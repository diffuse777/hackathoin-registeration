const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'PAYMENT_WEBHOOK_SECRET',
];

function assertEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name] || !String(process.env[name]).trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  if (process.env.NODE_ENV !== 'production' && process.env.ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  if (process.env.PAYMENT_WEBHOOK_SECRET.length < 32) {
    throw new Error('PAYMENT_WEBHOOK_SECRET must be at least 32 characters');
  }

  const paymentProvider = (process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!['mock', 'razorpay'].includes(paymentProvider)) {
    throw new Error('PAYMENT_PROVIDER must be mock or razorpay');
  }

  if (nodeEnv === 'production' && paymentProvider === 'mock') {
    throw new Error('Mock payment provider cannot be used in production');
  }

  if (paymentProvider === 'razorpay') {
    const razorpayMissing = ['PAYMENT_KEY_ID', 'PAYMENT_KEY_SECRET'].filter(
      (name) => !process.env[name] || !String(process.env[name]).trim()
    );
    if (razorpayMissing.length > 0) {
      throw new Error(`Missing required environment variables: ${razorpayMissing.join(', ')}`);
    }
  }
}

function loadEnv() {
  assertEnv();

  const nodeEnv = process.env.NODE_ENV || 'development';

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    port: Number.parseInt(process.env.PORT, 10) || 5000,
    mongoUri: process.env.MONGODB_URI.trim(),
    jwt: Object.freeze({
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }),
    clientUrl: process.env.CLIENT_URL.trim(),
    admin: Object.freeze({
      email: process.env.ADMIN_EMAIL.trim(),
      password: process.env.ADMIN_PASSWORD,
    }),
    payment: Object.freeze({
      provider: (process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase(),
      keyId: (process.env.PAYMENT_KEY_ID || '').trim(),
      keySecret: process.env.PAYMENT_KEY_SECRET || '',
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    }),
  });
}

module.exports = { loadEnv };
