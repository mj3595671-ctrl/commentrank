const db = require('../db/pool');

exports.getSystemStats = async (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  try {
    const totalAnalyses = await db.query('SELECT COUNT(*) FROM analyses');
    const totalComments = await db.query('SELECT COALESCE(SUM(total_comments), 0) as total FROM analyses');
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const recentErrors = await db.query('SELECT * FROM api_logs WHERE status_code >= 400 ORDER BY created_at DESC LIMIT 10');

    res.json({
      success: true,
      stats: {
        totalAnalyses: parseInt(totalAnalyses.rows[0].count, 10),
        totalCommentsProcessed: parseInt(totalComments.rows[0].total, 10),
        totalUsers: parseInt(totalUsers.rows[0].count, 10),
        recentErrors: recentErrors.rows
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
