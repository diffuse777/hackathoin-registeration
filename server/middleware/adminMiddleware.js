const AppError = require('../utils/AppError');
const { ADMIN_ROLES, ERROR_CODES } = require('../utils/constants');

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== ADMIN_ROLES.ADMIN) {
    return next(new AppError('Admin access required', 403, ERROR_CODES.FORBIDDEN));
  }

  return next();
}

module.exports = { requireAdmin };
