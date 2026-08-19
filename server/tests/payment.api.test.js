require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const registrationRepository = require('../repositories/registrationRepository');
const { hmacSha256Hex } = require('../utils/paymentSignature');
const { PAYMENT_STATUSES, REGISTRATION_FEE_PER_PARTICIPANT } = require('../utils/constants');

const createdIds = [];
let baseUrl = '';
let httpServer;
let webhookSecret = '';
const runId = Date.now().toString(36).toUpperCase();

function member(index, group) {
  const n = String(index + 1).padStart(2, '0');

  return {
    name: `Pay Student ${n}`,
    registerNumber: `PY${runId}${group}${n}`,
    department: 'CSE',
    section: 'A',
    phone: `99887${String(10000 + index).slice(-5)}`,
    email: `py-${runId.toLowerCase()}-${group}-${n}@college.edu`,
    studentType: index % 2 === 0 ? 'HOSTEL' : 'DAY_SCHOLAR',
    ...(index % 2 === 0 ? { hostelName: 'Kaveri', roomNumber: `${200 + index}` } : {}),
  };
}

async function postJson(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

async function createTeam(count, group) {
  const { status, json } = await postJson('/api/registrations', {
    teamName: `PAY-TEST ${runId} ${group}`,
    members: Array.from({ length: count }, (_, index) => member(index, group)),
  });

  assert.equal(status, 201);
  createdIds.push(json.data.id);
  return json.data;
}

function signedWebhook(payload) {
  const raw = JSON.stringify(payload);
  return {
    raw,
    signature: hmacSha256Hex(webhookSecret, raw),
  };
}

describe('Payment API', () => {
  before(async () => {
    const config = loadEnv();
    webhookSecret = config.payment.webhookSecret;
    await connectDB(config.mongoUri);
    const app = createApp(config);

    await new Promise((resolve) => {
      httpServer = app.listen(0, resolve);
    });

    const address = httpServer.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await registrationRepository.deleteByIds(createdIds);

    await new Promise((resolve, reject) => {
      if (!httpServer) {
        resolve();
        return;
      }
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });

    await disconnectDB();
  });

  it('creates payment orders using backend-calculated amounts for 1-5 participants', async () => {
    const expected = {
      1: 350,
      2: 700,
      3: 1050,
      4: 1400,
      5: 1750,
    };

    for (const count of [1, 2, 3, 4, 5]) {
      const registration = await createTeam(count, `N${count}`);
      const { status, json } = await postJson('/api/payments/orders', {
        registrationId: registration.id,
        amount: 1,
        totalAmount: 999999,
      });

      assert.equal(status, 201);
      assert.equal(json.data.amount, expected[count]);
      assert.equal(json.data.amount, count * REGISTRATION_FEE_PER_PARTICIPANT);
      assert.equal(json.data.memberCount, count);
      assert.equal(json.data.paymentStatus, PAYMENT_STATUSES.PENDING);
      assert.equal(json.data.paymentRequest.type, 'DYNAMIC_QR');
      assert.equal(json.data.paymentRequest.amount, expected[count]);
      assert.ok(json.data.paymentOrderId);
    }
  });

  it('rejects a frontend success shortcut and keeps payment pending', async () => {
    const registration = await createTeam(1, 'SUC');
    await postJson('/api/payments/orders', { registrationId: registration.id });

    const shortcut = await postJson('/api/payments/success', {
      registrationId: registration.id,
      paymentStatus: PAYMENT_STATUSES.PAID,
    });
    assert.equal(shortcut.status, 404);

    const statusResult = await getJson(`/api/payments/${registration.id}/status`);
    assert.equal(statusResult.json.data.paymentStatus, PAYMENT_STATUSES.PENDING);
  });

  it('rejects an invalid webhook signature', async () => {
    const registration = await createTeam(2, 'SIG');
    const order = await postJson('/api/payments/orders', { registrationId: registration.id });
    const payload = {
      event: 'payment.captured',
      payload: {
        paymentOrderId: order.json.data.paymentOrderId,
        paymentTransactionId: `txn_${runId}_sig`,
        amount: 700,
        currency: 'INR',
      },
    };

    const { status, json } = await postJson('/api/payments/webhook', payload, {
      'X-Payment-Signature': 'invalid-signature',
    });

    assert.equal(status, 401);
    assert.equal(json.error.code, 'INVALID_WEBHOOK_SIGNATURE');

    const current = await getJson(`/api/payments/${registration.id}/status`);
    assert.equal(current.json.data.paymentStatus, PAYMENT_STATUSES.PENDING);
  });

  it('does not mark PAID when the webhook amount does not match the backend fee', async () => {
    const registration = await createTeam(3, 'AMT');
    const order = await postJson('/api/payments/orders', { registrationId: registration.id });
    const payload = {
      event: 'payment.captured',
      payload: {
        paymentOrderId: order.json.data.paymentOrderId,
        paymentTransactionId: `txn_${runId}_amt`,
        amount: 1,
        currency: 'INR',
      },
    };
    const { raw, signature } = signedWebhook(payload);
    const { status, json } = await postJson('/api/payments/webhook', raw, {
      'X-Payment-Signature': signature,
    });

    assert.equal(status, 409);
    assert.equal(json.error.code, 'PAYMENT_AMOUNT_MISMATCH');

    const current = await getJson(`/api/payments/${registration.id}/status`);
    assert.equal(current.json.data.paymentStatus, PAYMENT_STATUSES.PENDING);
  });

  it('marks a verified payment as PAID and treats duplicate webhooks as idempotent', async () => {
    const registration = await createTeam(4, 'OK');
    const order = await postJson('/api/payments/orders', { registrationId: registration.id, amount: 50 });
    assert.equal(order.json.data.amount, 1400);

    const payload = {
      event: 'payment.captured',
      payload: {
        paymentOrderId: order.json.data.paymentOrderId,
        paymentTransactionId: `txn_${runId}_ok`,
        amount: 1400,
        currency: 'INR',
      },
    };
    const { raw, signature } = signedWebhook(payload);

    const first = await postJson('/api/payments/webhook', raw, { 'X-Payment-Signature': signature });
    assert.equal(first.status, 200);
    assert.equal(first.json.data.paymentStatus, PAYMENT_STATUSES.PAID);
    assert.equal(first.json.data.outcome, 'updated');

    const duplicate = await postJson('/api/payments/webhook', raw, { 'X-Payment-Signature': signature });
    assert.equal(duplicate.status, 200);
    assert.equal(duplicate.json.data.paymentStatus, PAYMENT_STATUSES.PAID);
    assert.equal(duplicate.json.data.outcome, 'idempotent');

    const current = await getJson(`/api/payments/${registration.id}/status`);
    assert.equal(current.json.data.paymentStatus, PAYMENT_STATUSES.PAID);
    assert.equal(current.json.data.amount, 1400);
    assert.ok(current.json.data.paidAt);

    const secondOrder = await postJson('/api/payments/orders', { registrationId: registration.id });
    assert.equal(secondOrder.status, 409);
    assert.equal(secondOrder.json.error.code, 'PAYMENT_ALREADY_COMPLETED');
  });

  it('marks a verified failed payment as FAILED', async () => {
    const registration = await createTeam(2, 'FL');
    const order = await postJson('/api/payments/orders', { registrationId: registration.id });
    const payload = {
      event: 'payment.failed',
      payload: {
        paymentOrderId: order.json.data.paymentOrderId,
        paymentTransactionId: `txn_${runId}_fl`,
        amount: 700,
        currency: 'INR',
      },
    };
    const { raw, signature } = signedWebhook(payload);
    const { status, json } = await postJson('/api/payments/webhook', raw, {
      'X-Payment-Signature': signature,
    });

    assert.equal(status, 200);
    assert.equal(json.data.paymentStatus, PAYMENT_STATUSES.FAILED);

    const current = await getJson(`/api/payments/${registration.id}/status`);
    assert.equal(current.json.data.paymentStatus, PAYMENT_STATUSES.FAILED);
    assert.equal(current.json.data.amount, 700);
  });
});
