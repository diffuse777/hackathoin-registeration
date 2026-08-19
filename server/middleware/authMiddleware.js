const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');
const { verifyToken } = require('../utils/jwt');
const { loadEnv } = require('../config/env');
const adminRepository = require('../repositories/adminRepository');
const revokedTokenRepository = require('../repositories/revokedTokenRepository');

function extractBearerToken(req) {
  const header = req.get('authorization') || req.get('Authorization') || '';

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const payload = verifyToken(token, { secret: loadEnv().jwt.secret });

  if (!payload?.sub || !payload.jti) {
    throw new AppError('Invalid token', 401, ERROR_CODES.UNAUTHORIZED);
  }

  if (await revokedTokenRepository.isRevoked(payload.jti)) {
    throw new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const admin = await adminRepository.findById(payload.sub);

  if (!admin || !admin.isActive) {
    throw new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  req.auth = {
    adminId: String(admin._id),
    email: admin.email,
    role: admin.role,
    jti: payload.jti,
    exp: payload.exp,
  };

  next();
});

module.exports = { authenticate };
