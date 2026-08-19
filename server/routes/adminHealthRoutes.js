const express = require('express');
const adminHealthController = require('../controllers/adminHealthController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', authenticate, requireAdmin, adminHealthController.getHealth);

module.exports = router;
