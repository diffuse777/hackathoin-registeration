const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');
const { loadEnv } = require('../config/env');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAdminLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Invalid request body', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  let email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const envEmail = String(loadEnv().admin.email).trim().toLowerCase();

  if (!email || email === 'admin' || email === 'admin@example.com') {
    email = envEmail;
  }

  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    throw new AppError('Email and password are required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return { email, password };
}

module.exports = { validateAdminLogin };
