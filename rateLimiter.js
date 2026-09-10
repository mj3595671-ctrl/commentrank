const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 خولەک
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

const analysisLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 خولەک
  max: 15,
  message: {
    success: false,
    code: 'ANALYSIS_RATE_LIMIT',
    message: 'Analysis quota reached. Meta rate limits require pacing. Please wait a few minutes.'
  }
});

module.exports = { apiLimiter, analysisLimiter };
