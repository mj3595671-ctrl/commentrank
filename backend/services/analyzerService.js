class AnalyzerService {
  /**
   * خاوێنکردنەوە، گرووپکردن بەپێی Commenter ID ی جێگیر و ژماردن و ڕیزبەندی
   */
  processComments(rawComments) {
    const commenterMap = new Map();
    let validCount = 0;

    for (const comment of rawComments) {
      validCount++;

      // Meta لە ئەکاونتی کەسی یان هەندێک جۆری مۆدێڕەیشن تەنها ناو یان identifier بە فەرمی دەدات
      let commenterId = 'unknown_participant';
      let commenterName = 'Facebook User';

      if (comment.from && comment.from.id) {
        commenterId = comment.from.id;
        commenterName = comment.from.name || 'Anonymous User';
      } else if (comment.from && comment.from.name) {
        commenterId = `name_${comment.from.name}`;
        commenterName = comment.from.name;
      } else {
        // پۆستی ئەنۆنیمەس یان کەسی تایبەت بەپێی یاسای پاراستنی مافی بەکارهێنەرانی Meta
        commenterId = `anon_${comment.id}`;
        commenterName = 'Private Commenter';
      }

      const commentDate = comment.created_time ? new Date(comment.created_time) : new Date();

      if (!commenterMap.has(commenterId)) {
        commenterMap.set(commenterId, {
          id: commenterId,
          name: commenterName,
          count: 0,
          percentage: 0,
          lastCommentDate: commentDate
        });
      }

      const item = commenterMap.get(commenterId);
      item.count += 1;
      if (commentDate > item.lastCommentDate) {
        item.lastCommentDate = commentDate;
      }
    }

    // گۆڕین بۆ لیست و ڕیزبەندی لە زۆرترینەوە بۆ کەمترین
    const sortedCommenters = Array.from(commenterMap.values()).sort((a, b) => b.count - a.count);

    // ئەژمارکردنی ڕێژەی سەدی و پلە (Rank)
    const rankedList = sortedCommenters.map((user, idx) => {
      const percentage = validCount > 0 ? ((user.count / validCount) * 100).toFixed(1) : 0;
      return {
        rank: idx + 1,
        id: user.id,
        name: user.name,
        count: user.count,
        percentage: parseFloat(percentage),
        lastCommentDate: user.lastCommentDate.toISOString()
      };
    });

    // پشکنینی یەکسانبوون (Tie Detection) بۆ پلەی یەکەم
    let isTieForFirst = false;
    let tiedLeaders = [];
    if (rankedList.length > 1 && rankedList[0].count === rankedList[1].count && rankedList[0].count > 0) {
      isTieForFirst = true;
      tiedLeaders = rankedList.filter((c) => c.count === rankedList[0].count);
    }

    return {
      totalComments: validCount,
      uniqueCommenters: rankedList.length,
      leaderboard: rankedList,
      topCommenter: rankedList[0] || null,
      isTieForFirst,
      tiedLeaders,
      averagePerUser: rankedList.length ? (validCount / rankedList.length).toFixed(2) : 0
    };
  }

  /**
   * داتای تاقیکردنەوەی فەرمی (Demo Data Generator) بۆ ئەوەی سیستمەکە بە سەربەخۆیی بەکاربێت
   */
  getDemoDataset() {
    const rawDemo = [
      { id: 'c1', from: { id: 'usr_ahmad', name: 'Ahmad' }, created_time: '2026-09-09T10:00:00Z' },
      { id: 'c2', from: { id: 'usr_sara', name: 'Sara' }, created_time: '2026-09-09T11:00:00Z' },
      { id: 'c3', from: { id: 'usr_ali', name: 'Ali' }, created_time: '2026-09-09T11:30:00Z' },
      { id: 'c4', from: { id: 'usr_karwan', name: 'Karwan' }, created_time: '2026-09-09T12:00:00Z' },
      { id: 'c5', from: { id: 'usr_dana', name: 'Dana' }, created_time: '2026-09-09T13:00:00Z' }
    ];

    // زیادکردنی ژمارەی کۆمێنتەکان بۆ ڕەنگدانەوەی نموونەی داواکراو: Ahmad: 47, Sara: 35, Ali: 29, Karwan: 18, Dana: 12
    const expand = (id, name, count) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          id: `demo_${id}_${i}`,
          from: { id, name },
          created_time: new Date(Date.now() - (count - i) * 60000).toISOString()
        });
      }
      return arr;
    };

    const fullDemoComments = [
      ...expand('usr_ahmad', 'Ahmad', 47),
      ...expand('usr_sara', 'Sara', 35),
      ...expand('usr_ali', 'Ali', 29),
      ...expand('usr_karwan', 'Karwan', 18),
      ...expand('usr_dana', 'Dana', 12)
    ];

    return this.processComments(fullDemoComments);
  }

  /**
   * سیستمی هەڵبژاردنی براوە (Giveaway / Winner Engine)
   */
  pickWinner(leaderboard, mode = 'most_comments', weighted = false) {
    if (!leaderboard || leaderboard.length === 0) {
      throw new Error('No qualifying commenters available.');
    }

    if (mode === 'most_comments') {
      return leaderboard[0];
    }

    if (mode === 'random') {
      if (!weighted) {
        // هەر کەسێک تەنها 1 هەل بە شێوازی یەکسان
        const randomIndex = Math.floor(Math.random() * leaderboard.length);
        return leaderboard[randomIndex];
      } else {
        // هەلی زیاتر بەپێی ژمارەی کۆمێنتەکان (Weighted Lottery)
        const totalTickets = leaderboard.reduce((acc, curr) => acc + curr.count, 0);
        let randomTicket = Math.floor(Math.random() * totalTickets) + 1;

        for (const candidate of leaderboard) {
          randomTicket -= candidate.count;
          if (randomTicket <= 0) {
            return candidate;
          }
        }
        return leaderboard[0];
      }
    }

    throw new Error('Unsupported winner selection mode.');
  }
}

module.exports = new AnalyzerService();
