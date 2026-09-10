const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const config = require('./config/env');
const db = require('./db/pool');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. پاراستنی پرۆدەکشن بە Helmet لەگەڵ پشتگیری Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*.fbcdn.net", "https://*.facebook.com"]
      }
    }
  })
);

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. بەڕێوەبردنی سێشن بە شێوەیەکی پارێزراو لە PostgreSQL
app.use(
  session({
    store: new pgSession({
      pool: db.pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production', // پێویستی بە HTTPS هەیە لە پرۆدەکشن
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ڕۆژ
      sameSite: 'lax'
    }
  })
);

app.use('/api/', apiLimiter);

// 3. ڕێڕەوەکانی API
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);

// 4. خزمەتگوزاری پەڕگەکانی فرۆنتئێند بە شێوازی Static
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// دەستپێکردنی سێرڤەر
app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(` CommentRank Production Platform Running `);
  console.log(` Port: ${config.port} | Mode: ${config.nodeEnv} `);
  console.log(` Graph API Version: ${config.meta.apiVersion}`);
  console.log(`=========================================`);
});
