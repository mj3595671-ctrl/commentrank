const metaService = require('../services/metaService');
const config = require('../config/env');
const db = require('../db/pool');

exports.getLoginUrl = (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  // ڕێگەپێدانە فەرمییە پێویستەکانی فەیسبووک
  const permissions = [
    'public_profile',
    'email',
    'pages_show_list',
    'pages_read_engagement',
    'pages_read_user_content'
  ].join(',');

  const authUrl = `https://www.facebook.com/${config.meta.apiVersion}/dialog/oauth?` +
    `client_id=${config.meta.appId}` +
    `&redirect_uri=${encodeURIComponent(config.meta.redirectUri)}` +
    `&state=${state}` +
    `&scope=${permissions}` +
    `&response_type=code`;

  res.json({ success: true, url: authUrl });
};

exports.handleCallback = async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${config.frontendUrl}?error=${encodeURIComponent(error_description || error)}`);
  }

  try {
    const tokenData = await metaService.exchangeCodeForToken(code);
    const userAccessToken = tokenData.access_token;
    const expiresInSeconds = tokenData.expires_in || 5184000; // 60 ڕۆژ
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const { profile, pages } = await metaService.fetchUserProfileAndPages(userAccessToken);

    // پاشەکەوتکردن یان نوێکردنەوە لە داتابەیس
    const userResult = await db.query(
      `INSERT INTO users (facebook_id, name, email, avatar_url, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (facebook_id) DO UPDATE 
       SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
       RETURNING id, name, email, avatar_url, role`,
      [profile.id, profile.name, profile.email || null, profile.picture?.data?.url || null]
    );

    const internalUser = userResult.rows[0];

    // پاشەکەوتکردنی Token بە پارێزراوی لە سێرڤەر (تەنها لە باکئێند)
    await db.query(
      `INSERT INTO facebook_tokens (user_id, access_token, expires_at, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE 
       SET access_token = EXCLUDED.access_token, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
      [internalUser.id, userAccessToken, expiresAt]
    );

    // پاشەکەوتکردنی لاپەڕە فەرمییەکان
    for (const page of pages) {
      await db.query(
        `INSERT INTO facebook_pages (user_id, page_id, name, access_token)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, page_id) DO UPDATE 
         SET access_token = EXCLUDED.access_token, name = EXCLUDED.name`,
        [internalUser.id, page.id, page.name, page.access_token]
      );
    }

    // دروستکردنی Session
    req.session.userId = internalUser.id;
    req.session.userRole = internalUser.role;

    res.redirect(`${config.frontendUrl}?auth=success`);
  } catch (err) {
    console.error('[AUTH ERROR]:', err.message);
    res.redirect(`${config.frontendUrl}?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getStatus = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ connected: false });
  }

  try {
    const userRes = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.role, t.expires_at
       FROM users u
       LEFT JOIN facebook_tokens t ON u.id = t.user_id
       WHERE u.id = $1`,
      [req.session.userId]
    );

    if (!userRes.rows.length) {
      req.session.destroy();
      return res.json({ connected: false });
    }

    const user = userRes.rows[0];
    const isExpired = user.expires_at && new Date(user.expires_at) < new Date();

    res.json({
      connected: !isExpired,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar_url,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database session check failed' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};
