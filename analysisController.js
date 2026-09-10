const metaService = require('../services/metaService');
const analyzerService = require('../services/analyzerService');
const db = require('../db/pool');

exports.analyzePost = async (req, res) => {
  const startTime = Date.now();
  const { postUrl, isDemo } = req.body;
  const userId = req.session ? req.session.userId : null;

  // 1. حاڵەتی Demo Mode
  if (isDemo) {
    const results = analyzerService.getDemoDataset();
    return res.json({
      success: true,
      isDemo: true,
      metaPostId: 'demo_object_12345',
      data: results,
      executionTimeMs: Date.now() - startTime
    });
  }

  // 2. حاڵەتی ڕاستەقینە - دەبێت بەکارهێنەر چووبێتەژوورەوە
  if (!userId) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: 'Facebook connection required to analyze live posts.'
    });
  }

  if (!postUrl) {
    return res.status(400).json({
      success: false,
      code: 'EMPTY_URL',
      message: 'Please provide a valid Facebook post URL.'
    });
  }

  try {
    // جیاکردنەوەی Post ID
    const postId = metaService.parseFacebookPostUrl(postUrl);

    // دۆزینەوەی Token ی فەرمی
    const accessToken = await metaService.resolveBestAccessToken(userId, postId);

    // وەرگرتنی کۆمێنتەکان بە فەرمی لە Graph API
    const rawComments = await metaService.fetchAllComments(postId, accessToken);

    if (rawComments.length === 0) {
      return res.status(200).json({
        success: true,
        isDemo: false,
        message: 'No comments found on this post, or permissions do not permit viewing them.',
        data: {
          totalComments: 0,
          uniqueCommenters: 0,
          leaderboard: [],
          topCommenter: null,
          isTieForFirst: false
        }
      });
    }

    // ڕیزبەندی و ژماردن
    const analyzed = analyzerService.processComments(rawComments);
    const executionTimeMs = Date.now() - startTime;

    // پاشەکەوتکردنی شیکاری لە داتابەیس بۆ مێژوو (History)
    const analysisRes = await db.query(
      `INSERT INTO analyses (user_id, post_url, meta_post_id, total_comments, unique_commenters, top_commenter_name, top_commenter_count, is_demo, execution_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
       RETURNING id`,
      [
        userId,
        postUrl,
        postId,
        analyzed.totalComments,
        analyzed.uniqueCommenters,
        analyzed.topCommenter ? analyzed.topCommenter.name : null,
        analyzed.topCommenter ? analyzed.topCommenter.count : 0,
        executionTimeMs
      ]
    );

    const analysisId = analysisRes.rows[0].id;

    // پاشەکەوتکردنی 100 بەشداربووی یەکەم لە خشتەی پەیوەندیدار
    for (const item of analyzed.leaderboard.slice(0, 100)) {
      await db.query(
        `INSERT INTO analysis_commenters (analysis_id, commenter_id, commenter_name, comment_count, percentage, last_comment_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (analysis_id, commenter_id) DO NOTHING`,
        [analysisId, item.id, item.name, item.count, item.percentage, item.lastCommentDate]
      );
    }

    return res.json({
      success: true,
      analysisId,
      isDemo: false,
      metaPostId: postId,
      data: analyzed,
      executionTimeMs
    });
  } catch (err) {
    console.error('[ANALYSIS ERROR]:', err.message);
    return res.status(400).json({
      success: false,
      code: 'GRAPH_API_ERROR',
      message: err.message
    });
  }
};

exports.pickGiveawayWinner = async (req, res) => {
  const { leaderboard, mode, weighted, analysisId } = req.body;

  try {
    const winner = analyzerService.pickWinner(leaderboard, mode, weighted);

    if (analysisId) {
      await db.query(
        `INSERT INTO winners (analysis_id, commenter_id, commenter_name, selection_type, qualifying_comments)
         VALUES ($1, $2, $3, $4, $5)`,
        [analysisId, winner.id, winner.name, mode, winner.count]
      );
    }

    return res.json({ success: true, winner });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.session.userId;
  try {
    const result = await db.query(
      `SELECT id, post_url, meta_post_id, total_comments, unique_commenters, top_commenter_name, is_demo, created_at
       FROM analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
};

exports.deleteAnalysis = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  try {
    await db.query('DELETE FROM analyses WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
