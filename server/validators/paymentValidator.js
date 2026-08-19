const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

function validateCreatePaymentOrder(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request body', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const registrationId = body.registrationId;

  if (!registrationId || typeof registrationId !== 'string' || !mongoose.Types.ObjectId.isValid(registrationId)) {
    throw new AppError('A valid registrationId is required', 400, ERROR_CODES.VALIDATION_ERROR, [
      { field: 'registrationId', message: 'A valid registrationId is required' },
    ]);
  }

  return { registrationId };
}

function validateRegistrationIdParam(registrationId) {
  if (!registrationId || !mongoose.Types.ObjectId.isValid(registrationId)) {
    throw new AppError('A valid registration id is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return registrationId;
}

function validatePaymentReference(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request body', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const paymentReference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() : '';

  if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{5,63}$/.test(paymentReference)) {
    throw new AppError('Enter a valid payment reference', 400, ERROR_CODES.VALIDATION_ERROR, [
      { field: 'paymentReference', message: 'Enter the UPI or bank transaction reference (6–64 characters).' },
    ]);
  }

  return { paymentReference };
}

module.exports = {
  validateCreatePaymentOrder,
  validateRegistrationIdParam,
  validatePaymentReference,
};
