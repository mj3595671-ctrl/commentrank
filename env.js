require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  sessionSecret: process.env.SESSION_SECRET || 'dev_secret_fallback_key',
  databaseUrl: process.env.DATABASE_URL,
  meta: {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    redirectUri: process.env.META_REDIRECT_URI,
    apiVersion: process.env.META_GRAPH_API_VERSION || 'v20.0',
    graphBaseUrl: `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v20.0'}`
  }
};
