const crypto = require('crypto');

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function derivedSecret(purpose, parts) {
  return crypto.createHash('sha256').update([purpose, ...parts].join('|')).digest('hex');
}

function defaultClientUrl() {
  const explicit = readEnv('CLIENT_URL');
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  const productionHost = readEnv('VERCEL_PROJECT_PRODUCTION_URL');
  if (productionHost) {
    return `https://${productionHost.replace(/^https?:\/\//, '')}`;
  }

  const vercelHost = readEnv('VERCEL_URL');
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, '')}`;
  }

  return 'http://localhost:5173';
}

function assertEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !readEnv(name));

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (readEnv('ADMIN_PASSWORD').length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const paymentProvider = (readEnv('PAYMENT_PROVIDER') || 'mock').toLowerCase();
  if (!['mock', 'razorpay'].includes(paymentProvider)) {
    throw new Error('PAYMENT_PROVIDER must be mock or razorpay');
  }

  if (paymentProvider === 'razorpay') {
    const razorpayMissing = ['PAYMENT_KEY_ID', 'PAYMENT_KEY_SECRET'].filter((name) => !readEnv(name));
    if (razorpayMissing.length > 0) {
      throw new Error(`Missing required environment variables: ${razorpayMissing.join(', ')}`);
    }
  }
}

function loadEnv() {
  assertEnv();

  const nodeEnv = process.env.NODE_ENV || 'development';
  const adminEmail = readEnv('ADMIN_EMAIL');
  const adminPassword = readEnv('ADMIN_PASSWORD');
  const mongoUri = readEnv('MONGODB_URI');
  const seed = [mongoUri, adminEmail, adminPassword];
  const jwtSecret = readEnv('JWT_SECRET') || derivedSecret('jwt', seed);
  const webhookSecret = readEnv('PAYMENT_WEBHOOK_SECRET') || derivedSecret('webhook', seed);
  const paymentProvider = (readEnv('PAYMENT_PROVIDER') || 'mock').toLowerCase();

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (webhookSecret.length < 32) {
    throw new Error('PAYMENT_WEBHOOK_SECRET must be at least 32 characters');
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    port: Number.parseInt(process.env.PORT, 10) || 5000,
    mongoUri,
    jwt: Object.freeze({
      secret: jwtSecret,
      expiresIn: readEnv('JWT_EXPIRES_IN') || '1d',
    }),
    clientUrl: defaultClientUrl(),
    admin: Object.freeze({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
    }),
    payment: Object.freeze({
      provider: paymentProvider,
      keyId: readEnv('PAYMENT_KEY_ID'),
      keySecret: process.env.PAYMENT_KEY_SECRET || '',
      webhookSecret,
    }),
  });
}

module.exports = { loadEnv };
