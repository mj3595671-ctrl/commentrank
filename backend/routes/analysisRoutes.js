const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { requireAuth } = require('../middleware/auth');
const { analysisLimiter } = require('../middleware/rateLimiter');

router.post('/run', analysisLimiter, analysisController.analyzePost);
router.post('/winner', analysisController.pickGiveawayWinner);
router.get('/history', requireAuth, analysisController.getHistory);
router.delete('/:id', requireAuth, analysisController.deleteAnalysis);

module.exports = router;
