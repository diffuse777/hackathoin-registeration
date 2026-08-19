const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const paymentStatusService = require('../services/paymentStatusService');
const { getPaymentProvider } = require('../services/payment/providerFactory');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

function readWebhookSignature(req) {
  return req.get('x-razorpay-signature') || req.get('x-payment-signature');
}

function getRawWebhookBody(req) {
  if (req.rawBody) {
    return req.rawBody;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body, 'utf8');
  }

  return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
}

const createPaymentOrder = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentOrder(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment order created successfully',
    data,
  });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentStatus(req.params.registrationId);

  return sendSuccess(res, {
    message: 'Payment status fetched successfully',
    data,
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const provider = getPaymentProvider(loadEnv().payment);
  const rawBody = getRawWebhookBody(req);
  const signature = readWebhookSignature(req);

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 401, ERROR_CODES.INVALID_WEBHOOK_SIGNATURE);
  }

  const payload = (() => {
    try {
      return JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
    } catch {
      throw new AppError('Invalid webhook payload', 400, ERROR_CODES.BAD_REQUEST);
    }
  })();
  const event = provider.parseWebhookEvent(payload);
  const result = await paymentStatusService.applyWebhookEvent(event);

  return sendSuccess(res, {
    message: 'Webhook processed',
    data: {
      outcome: result.outcome,
      paymentStatus: result.paymentStatus,
    },
  });
});

const simulateMockPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.simulateMockPayment({
    registrationId: req.body?.registrationId,
    result: req.body?.result,
  });

  return sendSuccess(res, {
    message: 'Mock payment processed',
    data,
  });
});

const submitPaymentReference = asyncHandler(async (req, res) => {
  const data = await paymentService.submitPaymentReference({
    registrationId: req.params.registrationId,
    paymentReference: req.body?.paymentReference,
  });

  return sendSuccess(res, {
    message: 'Payment reference saved',
    data,
  });
});

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  submitPaymentReference,
  handleWebhook,
  simulateMockPayment,
};
