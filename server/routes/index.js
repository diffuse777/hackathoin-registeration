const express = require('express');
const healthRoutes = require('./health.routes');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminAuthRoutes = require('./adminAuthRoutes');
const adminRegistrationRoutes = require('./adminRegistrationRoutes');
const adminHealthRoutes = require('./adminHealthRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/registrations', registrationRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/registrations', adminRegistrationRoutes);
router.use('/admin/health', adminHealthRoutes);

// Future modules (not implemented in this phase):
// router.use('/exports', exportRoutes);

module.exports = router;
