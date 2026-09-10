const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth, adminController.getSystemStats);

module.exports = router;
