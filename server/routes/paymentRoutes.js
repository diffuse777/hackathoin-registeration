const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/orders', paymentController.createPaymentOrder);
router.post('/webhook', paymentController.handleWebhook);
router.post('/mock/complete', paymentController.simulateMockPayment);
router.post('/:registrationId/reference', paymentController.submitPaymentReference);
router.get('/:registrationId/status', paymentController.getPaymentStatus);

module.exports = router;
