const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/facebook/login-url', authController.getLoginUrl);
router.get('/facebook/callback', authController.handleCallback);
router.get('/status', authController.getStatus);
router.post('/logout', authController.logout);

module.exports = router;
