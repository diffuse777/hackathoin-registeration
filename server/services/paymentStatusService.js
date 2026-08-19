const registrationRepository = require('../repositories/registrationRepository');
const { calculateRegistrationFee } = require('../utils/calculateRegistrationFee');
const { PAYMENT_STATUSES, WEBHOOK_EVENTS, CURRENCY, ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

function assertVerifiedAmount(registration, event) {
  const expectedAmount = calculateRegistrationFee(registration.memberCount);

  if (event.amount !== expectedAmount || event.amount !== registration.totalAmount) {
    throw new AppError(
      'Webhook payment amount does not match the registration fee',
      409,
      ERROR_CODES.PAYMENT_AMOUNT_MISMATCH,
      [
        {
          field: 'amount',
          message: `Expected ${expectedAmount}, received ${event.amount}`,
        },
      ]
    );
  }

  if (event.currency && event.currency !== CURRENCY) {
    throw new AppError('Webhook payment currency is invalid', 409, ERROR_CODES.PAYMENT_AMOUNT_MISMATCH);
  }
}

async function applyCapturedPayment(event) {
  const registration = await registrationRepository.findByPaymentOrderId(event.paymentOrderId);

  if (!registration) {
    throw new AppError('Payment order was not found', 404, ERROR_CODES.PAYMENT_ORDER_NOT_FOUND);
  }

  assertVerifiedAmount(registration, event);

  if (registration.paymentStatus === PAYMENT_STATUSES.PAID) {
    logger.info('Idempotent payment webhook ignored', {
      paymentOrderId: event.paymentOrderId,
      paymentTransactionId: event.paymentTransactionId,
    });
    return {
      outcome: 'idempotent',
      paymentStatus: PAYMENT_STATUSES.PAID,
      registrationId: String(registration._id),
    };
  }

  const updated = await registrationRepository.markPaidAtomic({
    paymentOrderId: event.paymentOrderId,
    paymentTransactionId: event.paymentTransactionId,
    paidAt: new Date(),
  });

  if (!updated) {
    const latest = await registrationRepository.findByPaymentOrderId(event.paymentOrderId);
    if (latest?.paymentStatus === PAYMENT_STATUSES.PAID) {
      return {
        outcome: 'idempotent',
        paymentStatus: PAYMENT_STATUSES.PAID,
        registrationId: String(latest._id),
      };
    }

    throw new AppError('Unable to mark payment as paid', 409, ERROR_CODES.CONFLICT);
  }

  logger.info('Payment marked as paid', {
    registrationId: String(updated._id),
    paymentOrderId: event.paymentOrderId,
  });

  return {
    outcome: 'updated',
    paymentStatus: PAYMENT_STATUSES.PAID,
    registrationId: String(updated._id),
  };
}

async function applyFailedPayment(event) {
  const registration = await registrationRepository.findByPaymentOrderId(event.paymentOrderId);

  if (!registration) {
    throw new AppError('Payment order was not found', 404, ERROR_CODES.PAYMENT_ORDER_NOT_FOUND);
  }

  if (registration.paymentStatus === PAYMENT_STATUSES.PAID) {
    logger.warn('Failed webhook ignored because payment is already paid', {
      paymentOrderId: event.paymentOrderId,
    });
    return {
      outcome: 'ignored',
      paymentStatus: PAYMENT_STATUSES.PAID,
      registrationId: String(registration._id),
    };
  }

  if (registration.paymentStatus === PAYMENT_STATUSES.FAILED) {
    return {
      outcome: 'idempotent',
      paymentStatus: PAYMENT_STATUSES.FAILED,
      registrationId: String(registration._id),
    };
  }

  const updated = await registrationRepository.markFailedAtomic({
    paymentOrderId: event.paymentOrderId,
    paymentTransactionId: event.paymentTransactionId,
  });

  const latest = updated || (await registrationRepository.findByPaymentOrderId(event.paymentOrderId));

  return {
    outcome: updated ? 'updated' : 'idempotent',
    paymentStatus: latest?.paymentStatus || PAYMENT_STATUSES.FAILED,
    registrationId: String(latest?._id || registration._id),
  };
}

async function applyWebhookEvent(event) {
  if (!event?.paymentOrderId) {
    throw new AppError('Webhook is missing a payment order id', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (event.eventType === WEBHOOK_EVENTS.IGNORED) {
    return { outcome: 'ignored', paymentStatus: null, registrationId: null };
  }

  if (event.eventType === WEBHOOK_EVENTS.PAYMENT_CAPTURED) {
    if (!event.paymentTransactionId) {
      throw new AppError('Webhook is missing a payment transaction id', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    return applyCapturedPayment(event);
  }

  if (event.eventType === WEBHOOK_EVENTS.PAYMENT_FAILED) {
    return applyFailedPayment(event);
  }

  return { outcome: 'ignored', paymentStatus: null, registrationId: null };
}

module.exports = {
  applyWebhookEvent,
};
