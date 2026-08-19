const express = require('express');
const adminRegistrationController = require('../controllers/adminRegistrationController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', adminRegistrationController.listRegistrations);
router.get('/summary', adminRegistrationController.getRegistrationSummary);
router.get('/export/csv', adminRegistrationController.exportRegistrationsCsv);
router.get('/export/pdf', adminRegistrationController.exportRegistrationsPdf);
router.get('/:id', adminRegistrationController.getRegistrationById);
router.delete('/:id', adminRegistrationController.deleteRegistration);

module.exports = router;
