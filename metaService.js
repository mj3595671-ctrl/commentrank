const axios = require('axios');
const config = require('../config/env');
const db = require('../db/pool');

class MetaService {
  /**
   * شیکردنەوە و وەرگرتنی پێکهاتەی ID ی پۆست لە لینکی دراو
   * پشتگیری فۆرماتە فەرمییەکانی فەیسبووک دەکات
   */
  parseFacebookPostUrl(urlStr) {
    try {
      const parsed = new URL(urlStr);
      if (!parsed.hostname.includes('facebook.com') && !parsed.hostname.includes('fb.watch')) {
        throw new Error('URL must belong to facebook.com domain.');
      }

      // 1. فۆرماتی permalink.php?story_fbid=XYZ&id=ABC
      if (parsed.pathname.includes('permalink.php')) {
        const storyFbid = parsed.searchParams.get('story_fbid');
        const pageId = parsed.searchParams.get('id');
        if (storyFbid && pageId) return `${pageId}_${storyFbid}`;
      }

      // 2. فۆرماتی /page_id/posts/post_id یان /username/posts/post_id
      const postMatch = parsed.pathname.match(/\/(posts|activity)\/([0-9a-zA-Z_]+)/);
      if (postMatch && postMatch[2]) {
        return postMatch[2];
      }

      // 3. فۆرماتی وێنە یان ڤیدیۆ /photos/a.123/456 یان /videos/123
      const photoVideoMatch = parsed.pathname.match(/\/(videos|photos|watch)\/([0-9]+)/);
      if (photoVideoMatch && photoVideoMatch[2]) {
        return photoVideoMatch[2];
      }

      // ئەگەر تەنها کورتکراوە بوو یان ناسینەوەی ڕاستەوخۆ
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && !isNaN(segments[segments.length - 1])) {
        return segments[segments.length - 1];
      }

      throw new Error('Could not extract a valid Meta Object/Post ID from the provided URL format.');
    } catch (err) {
      throw new Error(`Invalid Facebook Post URL: ${err.message}`);
    }
  }

  /**
   * گۆڕینەوەی authorization_code بۆ Long-lived User Token بە شێوازی فەرمی
   */
  async exchangeCodeForToken(code) {
    const tokenUrl = `${config.meta.graphBaseUrl}/oauth/access_token`;
    
    // هەموارکردن بۆ کورتخایەن (Short-lived)
    const resp = await axios.get(tokenUrl, {
      params: {
        client_id: config.meta.appId,
        client_secret: config.meta.appSecret,
        redirect_uri: config.meta.redirectUri,
        code: code
      },
      timeout: 10000
    });

    const shortLivedToken = resp.data.access_token;

    // گۆڕینەوەی بۆ درێژخایەن (Long-lived ~ 60 days)
    const longLivedResp = await axios.get(tokenUrl, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: config.meta.appId,
        client_secret: config.meta.appSecret,
        fb_exchange_token: shortLivedToken
      },
      timeout: 10000
    });

    return longLivedResp.data;
  }

  /**
   * پشکنینی پڕۆفایلی بەکارهێنەر و لاپەڕەکانی (Pages) بە فەرمی
   */
  async fetchUserProfileAndPages(accessToken) {
    const profileResp = await axios.get(`${config.meta.graphBaseUrl}/me`, {
      params: {
        fields: 'id,name,email,picture.width(150).height(150)',
        access_token: accessToken
      }
    });

    // وەرگرتنی لاپەڕە بەڕێوەبراوەکان لەگەڵ Page Access Tokens
    let pages = [];
    try {
      const accountsResp = await axios.get(`${config.meta.graphBaseUrl}/me/accounts`, {
        params: {
          fields: 'id,name,access_token,tasks',
          access_token: accessToken
        }
      });
      pages = accountsResp.data.data || [];
    } catch (e) {
      console.warn('[META NOTICE] Could not read /me/accounts. Ensure "pages_read_engagement" is granted.');
    }

    return {
      profile: profileResp.data,
      pages
    };
  }

  /**
   * دۆزینەوەی گونجاوترین Access Token (ئەگەر پۆستەکە هی پەیج بێت، Page Token باشترە)
   */
  async resolveBestAccessToken(userId, targetPostId) {
    const tokensRes = await db.query(
      'SELECT access_token FROM facebook_tokens WHERE user_id = $1',
      [userId]
    );
    if (!tokensRes.rows.length) {
      throw new Error('NO_TOKEN_FOUND');
    }
    const userToken = tokensRes.rows[0].access_token;

    // ئەگەر پۆستەکە پیتی سەرەتای پەیج لەخۆبگرێت، پشکنین بکە بۆ لاپەڕەکان
    const pagesRes = await db.query(
      'SELECT page_id, access_token FROM facebook_pages WHERE user_id = $1',
      [userId]
    );

    for (const p of pagesRes.rows) {
      if (targetPostId.startsWith(p.page_id)) {
        return p.access_token; // بەکارهێنانی لاپەڕە فەرمییەکە بۆ دڵنیایی زیاتر
      }
    }

    return userToken;
  }

  /**
   * وەرگرتنی کۆمێنتە فەرمییەکان بە تەواوی سیستمی Cursor-based Pagination
   */
  async fetchAllComments(postId, accessToken, onProgress) {
    let allComments = [];
    let nextUrl = `${config.meta.graphBaseUrl}/${postId}/comments`;
    let params = {
      fields: 'id,from,message,created_time,like_count',
      limit: 100,
      summary: 'true',
      access_token: accessToken
    };

    let pageCount = 0;
    const maxPages = 50; // سنورداری پارێزراو بۆ ڕێگریکردن لە Rate-limit

    while (nextUrl && pageCount < maxPages) {
      pageCount++;
      if (onProgress) onProgress(`Fetching batch ${pageCount}...`);

      let resp;
      try {
        resp = await axios.get(nextUrl, { params, timeout: 15000 });
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          const fbErr = err.response.data.error;
          // کۆدەکانی Meta API: 100 (Invalid parameter/ID), 190 (Token expired), 200 (Permissions error)
          if (fbErr.code === 190) {
            throw new Error('FACEBOOK_SESSION_EXPIRED: Please reconnect your Meta Account.');
          }
          if (fbErr.code === 200 || fbErr.code === 10) {
            throw new Error('PERMISSION_DENIED: You do not have official permission to read comments on this object.');
          }
          if (fbErr.code === 17 || fbErr.code === 4 || fbErr.code === 32) {
            throw new Error('RATE_LIMIT: Facebook API rate limit reached. Please wait a while.');
          }
          throw new Error(`Meta Graph API Error: ${fbErr.message}`);
        }
        throw new Error(`Network/Server connection failed while calling Graph API: ${err.message}`);
      }

      const data = resp.data.data || [];
      allComments = allComments.concat(data);

      // Meta دەکرێت بەهۆی سنورداری پاراستنی تایبەتمەندی بەشداربووان لە پۆستە کەسییەکان ناوى بەکارهێنەر سنووردار بکات
      if (resp.data.paging && resp.data.paging.next) {
        nextUrl = resp.data.paging.next;
        params = {}; // پارامیتەرەکان پێشتر لە ناو خودی لینکی next هەن
      } else {
        nextUrl = null;
      }
    }

    return allComments;
  }
}

module.exports = new MetaService();
