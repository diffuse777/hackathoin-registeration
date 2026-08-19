const crypto = require('crypto');
const adminRepository = require('../repositories/adminRepository');
const revokedTokenRepository = require('../repositories/revokedTokenRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken, verifyToken } = require('../utils/jwt');
const { validateAdminLogin } = require('../validators/adminAuthValidator');
const { ADMIN_ROLES, ERROR_CODES } = require('../utils/constants');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const GENERIC_AUTH_ERROR = 'Invalid email or password';
let dummyPasswordHashPromise;

function getDummyPasswordHash() {
  if (!dummyPasswordHashPromise) {
    dummyPasswordHashPromise = hashPassword(crypto.randomBytes(16).toString('hex'));
  }

  return dummyPasswordHashPromise;
}

function toPublicAdmin(admin) {
  return {
    id: String(admin._id),
    email: admin.email,
    role: admin.role,
  };
}

function getJwtConfig() {
  return loadEnv().jwt;
}

async function ensureInitialAdmin({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await adminRepository.findByEmail(normalizedEmail, { includePasswordHash: true });

  if (existing) {
    const passwordMatches = existing.passwordHash
      ? await comparePassword(password, existing.passwordHash)
      : false;

    if (!passwordMatches) {
      existing.passwordHash = await hashPassword(password);
      await existing.save();
      logger.info('Admin password synchronized from environment');
    } else {
      logger.info('Admin account already exists');
    }

    return existing;
  }

  const created = await adminRepository.create({
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: ADMIN_ROLES.ADMIN,
    isActive: true,
  });

  logger.info('Initial admin account created');
  return created;
}

async function login(body) {
  const { email, password } = validateAdminLogin(body);
  const admin = await adminRepository.findByEmail(email, { includePasswordHash: true });
  const passwordHash = admin?.passwordHash || (await getDummyPasswordHash());
  const passwordMatches = await comparePassword(password, passwordHash);

  if (!admin || !admin.isActive || !passwordMatches) {
    throw new AppError(GENERIC_AUTH_ERROR, 401, ERROR_CODES.UNAUTHORIZED);
  }

  const jwtConfig = getJwtConfig();
  const jti = crypto.randomUUID();
  const token = signToken(
    {
      sub: String(admin._id),
      role: admin.role,
    },
    {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
      jwtid: jti,
    }
  );

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: jwtConfig.expiresIn,
    admin: toPublicAdmin(admin),
  };
}

async function logout(auth) {
  if (!auth?.jti) {
    throw new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const expiresAt = auth.exp ? new Date(auth.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  await revokedTokenRepository.revoke({ jti: auth.jti, expiresAt });
}

async function getCurrentAdmin(auth) {
  const admin = await adminRepository.findById(auth.adminId);

  if (!admin || !admin.isActive) {
    throw new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  return toPublicAdmin(admin);
}

function decodeAuthenticatedToken(token) {
  return verifyToken(token, { secret: getJwtConfig().secret });
}

module.exports = {
  ensureInitialAdmin,
  login,
  logout,
  getCurrentAdmin,
  decodeAuthenticatedToken,
  toPublicAdmin,
};
