const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

function mapMongooseError(error) {
  if (error.name === 'CastError') {
    return new AppError('Invalid identifier', 400, ERROR_CODES.BAD_REQUEST);
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    const mapped = new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, details);
    return mapped;
  }

  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || error.keyValue || {})[0] || '';

    if (key.includes('registerNumber')) {
      return new AppError(
        'One or more register numbers are already registered',
        409,
        ERROR_CODES.DUPLICATE_PARTICIPANT
      );
    }

    if (key.includes('email')) {
      return new AppError('One or more emails are already registered', 409, ERROR_CODES.DUPLICATE_PARTICIPANT);
    }

    return new AppError('Duplicate value', 409, ERROR_CODES.CONFLICT);
  }

  return null;
}

function mapJwtError(error) {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, ERROR_CODES.UNAUTHORIZED);
  }

  return null;
}

function errorHandler(config) {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return sendError(res, {
        message: 'Invalid JSON payload',
        code: ERROR_CODES.BAD_REQUEST,
        statusCode: 400,
      });
    }

    const mapped = error instanceof AppError ? error : mapMongooseError(error) || mapJwtError(error);

    const statusCode = mapped?.statusCode || 500;
    const code = mapped?.code || ERROR_CODES.INTERNAL_ERROR;
    const isOperational = Boolean(mapped?.isOperational);

    const logPayload = {
      errMessage: error.message,
      code,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      stack: config.isProduction || statusCode < 500 ? undefined : error.stack,
    };

    if (statusCode >= 500) {
      logger.error('Request failed', logPayload);
    } else {
      logger.warn('Request failed', logPayload);
    }

    const clientMessage =
      isOperational || !config.isProduction
        ? mapped?.message || error.message || 'Something went wrong'
        : 'Something went wrong';

    return sendError(res, {
      message: clientMessage,
      code,
      statusCode,
      details: mapped?.details,
    });
  };
}

module.exports = errorHandler;
