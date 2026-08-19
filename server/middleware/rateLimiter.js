const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

function createApiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const path = req.originalUrl.split('?')[0];
      return path === '/api/health' || path === '/api/payments/webhook' || req.path === '/health';
    },
    handler: (req, res, next) => {
      next(
        new AppError(
          'Too many requests. Please try again later.',
          429,
          ERROR_CODES.RATE_LIMIT_EXCEEDED
        )
      );
    },
  });
}

function createAdminLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new AppError(
          'Too many login attempts. Please try again later.',
          429,
          ERROR_CODES.RATE_LIMIT_EXCEEDED
        )
      );
    },
  });
}

module.exports = { createApiRateLimiter, createAdminLoginRateLimiter };
