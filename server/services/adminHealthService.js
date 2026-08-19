const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const { loadEnv } = require('../config/env');
const { PAYMENT_STATUSES, PAYMENT_PROVIDERS } = require('../utils/constants');

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const LOGO_DIR = path.join(__dirname, '..', 'assets');
const PDF_LOGOS = ['logo-cybernerds.png', 'logo-owasp.png', 'logo-kare.png'];

function apiEntry(name, method, pathName, status, detail = '') {
  return { name, method, path: pathName, status, detail };
}

async function pingDatabase() {
  const started = Date.now();
  const readyState = READY_STATES[mongoose.connection.readyState] || 'unknown';

  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return {
      status: 'down',
      readyState,
      latencyMs: null,
      message: 'Database is not connected',
    };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'up',
      readyState,
      latencyMs: Date.now() - started,
      message: 'MongoDB responded to ping',
    };
  } catch (error) {
    return {
      status: 'down',
      readyState: 'error',
      latencyMs: Date.now() - started,
      message: error.message || 'MongoDB ping failed',
    };
  }
}

async function getPaymentSnapshot() {
  const grouped = await Registration.aggregate([
    { $group: { _id: '$paymentStatus', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
  ]);

  const counts = {
    PAID: { count: 0, amount: 0 },
    PENDING: { count: 0, amount: 0 },
    FAILED: { count: 0, amount: 0 },
  };

  grouped.forEach((row) => {
    if (counts[row._id]) {
      counts[row._id] = { count: row.count, amount: row.amount || 0 };
    }
  });

  const [failed, pending] = await Promise.all([
    Registration.find({ paymentStatus: PAYMENT_STATUSES.FAILED })
      .select('teamName memberCount totalAmount paymentStatus updatedAt')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    Registration.find({ paymentStatus: PAYMENT_STATUSES.PENDING })
      .select('teamName memberCount totalAmount paymentStatus updatedAt')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
  ]);

  return { counts, failed, pending };
}

function paymentConfigIssues() {
  const config = loadEnv();
  const issues = [];
  const provider = config.payment.provider;
  let configured = true;

  if (provider === PAYMENT_PROVIDERS.MOCK) {
    issues.push({
      severity: 'warning',
      code: 'MOCK_PROVIDER',
      message: 'Mock payment provider is active. Live settlement is not running.',
    });
  }

  if (provider === PAYMENT_PROVIDERS.RAZORPAY && (!config.payment.keyId || !config.payment.keySecret)) {
    configured = false;
    issues.push({
      severity: 'error',
      code: 'PAYMENT_KEYS_MISSING',
      message: 'Razorpay is selected but payment keys are missing.',
    });
  }

  if (provider === PAYMENT_PROVIDERS.RAZORPAY && !config.payment.webhookSecret) {
    issues.push({
      severity: 'warning',
      code: 'WEBHOOK_SECRET_CHECK',
      message: 'Confirm the payment webhook secret is set for live capture events.',
    });
  }

  return { provider, configured, issues };
}

function pdfExportReady() {
  const missing = PDF_LOGOS.filter((file) => !fs.existsSync(path.join(LOGO_DIR, file)));
  if (missing.length === 0) {
    return { status: 'up', detail: 'PDF assets are available' };
  }
  return { status: 'degraded', detail: `Missing PDF logo files: ${missing.join(', ')}` };
}

function overallStatus(database, apis, paymentIssues) {
  if (database.status === 'down' || apis.some((item) => item.status === 'down')) {
    return 'down';
  }
  if (
    apis.some((item) => item.status === 'degraded') ||
    paymentIssues.some((item) => item.severity === 'error' || item.severity === 'warning')
  ) {
    return 'degraded';
  }
  return 'healthy';
}

function toIssueRow(registration, reason) {
  return {
    id: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    totalAmount: registration.totalAmount,
    paymentStatus: registration.paymentStatus,
    updatedAt: registration.updatedAt,
    reason,
  };
}

async function getAdminHealth() {
  const database = await pingDatabase();
  const dbUp = database.status === 'up';
  const pdf = pdfExportReady();
  const paymentSetup = paymentConfigIssues();

  let snapshot = {
    counts: {
      PAID: { count: 0, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 },
    },
    failed: [],
    pending: [],
  };

  if (dbUp) {
    snapshot = await getPaymentSnapshot();
  }

  const paymentIssues = [...paymentSetup.issues];
  if (snapshot.counts.FAILED.count > 0) {
    paymentIssues.push({
      severity: 'error',
      code: 'FAILED_PAYMENTS',
      message: `${snapshot.counts.FAILED.count} registration${snapshot.counts.FAILED.count === 1 ? '' : 's'} have failed payment.`,
    });
  }
  if (snapshot.counts.PENDING.count > 0) {
    paymentIssues.push({
      severity: 'warning',
      code: 'PENDING_PAYMENTS',
      message: `${snapshot.counts.PENDING.count} registration${snapshot.counts.PENDING.count === 1 ? '' : 's'} still awaiting payment.`,
    });
  }

  const dataApis = dbUp ? 'up' : 'down';
  const apis = [
    apiEntry('Public health', 'GET', '/api/health', 'up', 'Process is responding'),
    apiEntry('Create registration', 'POST', '/api/registrations', dataApis, dbUp ? 'Registration write path reachable' : 'Waiting on database'),
    apiEntry('Payment orders', 'POST', '/api/payments/orders', paymentSetup.configured && dbUp ? 'up' : 'down', paymentSetup.configured ? 'Order creation path reachable' : 'Payment provider is not configured'),
    apiEntry('Payment status', 'GET', '/api/payments/:id/status', dataApis, dbUp ? 'Status lookup path reachable' : 'Waiting on database'),
    apiEntry('Payment webhook', 'POST', '/api/payments/webhook', paymentSetup.configured ? 'up' : 'degraded', 'Webhook endpoint is mounted'),
    apiEntry('Admin login', 'POST', '/api/admin/auth/login', 'up', 'Authenticated session is active'),
    apiEntry('Admin registrations', 'GET', '/api/admin/registrations', dataApis, dbUp ? 'Admin list path reachable' : 'Waiting on database'),
    apiEntry('CSV export', 'GET', '/api/admin/registrations/export/csv', dataApis, dbUp ? 'CSV export path reachable' : 'Waiting on database'),
    apiEntry('PDF export', 'GET', '/api/admin/registrations/export/pdf', dbUp ? pdf.status : 'down', pdf.detail),
  ];

  return {
    overall: overallStatus(database, apis, paymentIssues),
    checkedAt: new Date().toISOString(),
    database,
    apis,
    payment: {
      provider: paymentSetup.provider,
      configured: paymentSetup.configured,
      counts: snapshot.counts,
      issues: paymentIssues,
      failed: snapshot.failed.map((row) => toIssueRow(row, 'Payment marked FAILED')),
      pending: snapshot.pending.map((row) => toIssueRow(row, 'Payment still PENDING')),
    },
  };
}

module.exports = { getAdminHealth };
