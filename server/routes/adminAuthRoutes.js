const express = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { createAdminLoginRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const loginLimiter = createAdminLoginRateLimiter();

router.post('/login', loginLimiter, adminAuthController.login);
router.post('/logout', authenticate, requireAdmin, adminAuthController.logout);
router.get('/me', authenticate, requireAdmin, adminAuthController.me);

module.exports = router;
