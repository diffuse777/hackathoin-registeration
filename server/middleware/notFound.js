const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, ERROR_CODES.NOT_FOUND));
}

module.exports = notFound;
