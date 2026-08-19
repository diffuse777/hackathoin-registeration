const QRCode = require('qrcode');
const registrationRepository = require('../repositories/registrationRepository');
const paymentStatusService = require('./paymentStatusService');
const { validateCreatePaymentOrder, validateRegistrationIdParam, validatePaymentReference } = require('../validators/paymentValidator');
const { calculateRegistrationFee } = require('../utils/calculateRegistrationFee');
const { PAYMENT_STATUSES, CURRENCY, ERROR_CODES, PAYMENT_PROVIDERS } = require('../utils/constants');
const { getPaymentProvider } = require('./payment/providerFactory');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const { BLOCKED_REGISTER_MESSAGE, isBlockedRegisterNumber } = require('../utils/blockedRegisterNumbers');

function getProvider() {
  return getPaymentProvider(loadEnv().payment);
}

async function withQrImage(paymentRequest) {
  if (!paymentRequest?.qrPayload) {
    return paymentRequest;
  }

  return {
    ...paymentRequest,
    qrImageDataUrl: await QRCode.toDataURL(paymentRequest.qrPayload, {
      width: 280,
      margin: 1,
      color: { dark: '#071018', light: '#f4ffe8' },
    }),
  };
}

function toPublicPaymentOrder(registration, paymentRequest) {
  return {
    registrationId: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    amount: registration.totalAmount,
    currency: CURRENCY,
    paymentStatus: registration.paymentStatus,
    paymentOrderId: registration.payment?.paymentOrderId || null,
    paymentRequest,
  };
}

function toPublicPaymentStatus(registration) {
  return {
    registrationId: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    amount: registration.totalAmount,
    currency: CURRENCY,
    paymentStatus: registration.paymentStatus,
    paymentOrderId: registration.payment?.paymentOrderId || null,
    paidAt: registration.payment?.paidAt || null,
    paymentReference: registration.payment?.paymentTransactionId || null,
  };
}

async function createPaymentOrder(body) {
  const { registrationId } = validateCreatePaymentOrder(body);
  const registration = await registrationRepository.findById(registrationId);

  if (!registration) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  if ((registration.members || []).some((member) => isBlockedRegisterNumber(member.registerNumber))) {
    throw new AppError(BLOCKED_REGISTER_MESSAGE, 403, ERROR_CODES.BLOCKED_REGISTER_NUMBER);
  }

  if (registration.paymentStatus === PAYMENT_STATUSES.PAID) {
    throw new AppError('This registration is already paid', 409, ERROR_CODES.PAYMENT_ALREADY_COMPLETED);
  }

  const amount = calculateRegistrationFee(registration.memberCount);

  if (amount !== registration.totalAmount) {
    registration.totalAmount = amount;
  }

  if (
    registration.paymentStatus === PAYMENT_STATUSES.PENDING &&
    registration.payment?.paymentOrderId
  ) {
    const existingRequest = await withQrImage({
      type: 'DYNAMIC_QR',
      provider: getProvider().getName(),
      amount,
      currency: CURRENCY,
      orderId: registration.payment.paymentOrderId,
      description: `Hackathon registration - ${registration.teamName}`,
      qrPayload: `upi://pay?am=${amount}&cu=${CURRENCY}&tn=${encodeURIComponent(String(registration._id))}`,
    });

    return toPublicPaymentOrder(registration, existingRequest);
  }

  const order = await getProvider().createPaymentOrder({
    amount,
    currency: CURRENCY,
    registrationId: String(registration._id),
    receipt: String(registration._id),
    notes: {
      description: `Hackathon registration - ${registration.teamName}`,
      memberCount: String(registration.memberCount),
    },
  });

  const updated = await registrationRepository.setPaymentOrder({
    registrationId: registration._id,
    paymentOrderId: order.paymentOrderId,
    paymentStatus: PAYMENT_STATUSES.PENDING,
  });

  updated.totalAmount = amount;
  const paymentRequest = await withQrImage(order.paymentRequest);

  return toPublicPaymentOrder(updated, paymentRequest);
}

async function simulateMockPayment({ registrationId, result }) {
  const config = loadEnv();

  if (config.isProduction || config.payment.provider !== PAYMENT_PROVIDERS.MOCK) {
    throw new AppError('Mock payment simulation is disabled', 403, ERROR_CODES.FORBIDDEN);
  }

  const id = validateRegistrationIdParam(registrationId);
  const registration = await registrationRepository.findById(id);

  if (!registration) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  if (!registration.payment?.paymentOrderId) {
    throw new AppError('Create a payment order first', 400, ERROR_CODES.PAYMENT_ORDER_NOT_FOUND);
  }

  const amount = calculateRegistrationFee(registration.memberCount);
  const provider = getProvider();
  const payload = {
    event: result === 'failed' ? 'payment.failed' : 'payment.captured',
    payload: {
      paymentOrderId: registration.payment.paymentOrderId,
      paymentTransactionId: `txn_mock_${Date.now()}`,
      amount,
      currency: CURRENCY,
    },
  };
  const rawBody = JSON.stringify(payload);

  if (!provider.verifyWebhookSignature(rawBody, provider.signWebhookBody(rawBody))) {
    throw new AppError('Invalid webhook signature', 401, ERROR_CODES.INVALID_WEBHOOK_SIGNATURE);
  }

  return paymentStatusService.applyWebhookEvent(provider.parseWebhookEvent(payload));
}

async function getPaymentStatus(registrationId) {
  const id = validateRegistrationIdParam(registrationId);
  const registration = await registrationRepository.findById(id);

  if (!registration) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  return toPublicPaymentStatus(registration);
}

async function submitPaymentReference({ registrationId, paymentReference }) {
  const id = validateRegistrationIdParam(registrationId);
  const { paymentReference: reference } = validatePaymentReference({ paymentReference });
  const registration = await registrationRepository.findById(id);

  if (!registration) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  if (registration.paymentStatus !== PAYMENT_STATUSES.PAID) {
    throw new AppError('Payment is not confirmed yet', 409, ERROR_CODES.BAD_REQUEST);
  }

  const duplicate = await registrationRepository.findByPaymentTransactionId(reference);
  if (duplicate && String(duplicate._id) !== String(registration._id)) {
    throw new AppError('This payment reference is already recorded', 409, ERROR_CODES.CONFLICT);
  }

  const updated = await registrationRepository.setPaymentReference({
    registrationId: id,
    paymentTransactionId: reference,
  });

  if (!updated) {
    throw new AppError('Payment is not confirmed yet', 409, ERROR_CODES.BAD_REQUEST);
  }

  return {
    registrationId: String(updated._id),
    paymentStatus: updated.paymentStatus,
    paymentReference: updated.payment?.paymentTransactionId || reference,
  };
}

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  submitPaymentReference,
  simulateMockPayment,
  toPublicPaymentOrder,
  toPublicPaymentStatus,
};
