require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const registrationRepository = require('../repositories/registrationRepository');
const { REGISTRATION_FEE_PER_PARTICIPANT, PAYMENT_STATUSES } = require('../utils/constants');

const EXPECTED_TOTALS = {
  1: 350,
  2: 700,
  3: 1050,
  4: 1400,
  5: 1750,
};

const createdIds = [];
let baseUrl = '';
let httpServer;
const runId = Date.now().toString(36).toUpperCase();

function member(index, overrides = {}, group = 'X') {
  const n = String(index + 1).padStart(2, '0');

  return {
    name: `Student ${n}`,
    registerNumber: `AR${runId}${group}${n}`,
    department: 'CSE',
    section: 'A',
    phone: `98765${String(10000 + index).slice(-5)}`,
    email: `ar-${runId.toLowerCase()}-${group}-${n}@college.edu`,
    studentType: index % 2 === 0 ? 'HOSTEL' : 'DAY_SCHOLAR',
    ...(index % 2 === 0 ? { hostelName: 'Kaveri', roomNumber: `${100 + index}` } : {}),
    ...overrides,
  };
}

function payload(count, extra = {}) {
  const members = Array.from({ length: count }, (_, index) => member(index, {}, `T${count}`));

  return {
    teamName: `API-TEST ${runId} ${count}`,
    members,
    ...extra,
  };
}

async function postRegistration(body, { raw } = {}) {
  const response = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw || JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

describe('POST /api/registrations', () => {
  before(async () => {
    const config = loadEnv();
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

  for (const count of [1, 2, 3, 4, 5]) {
    it(`creates a ${count}-participant registration and charges ${EXPECTED_TOTALS[count]}`, async () => {
      const { status, json } = await postRegistration(
        payload(count, {
          totalAmount: 1,
          paymentStatus: PAYMENT_STATUSES.PAID,
          paymentTransactionId: 'client-should-not-win',
          paidAt: '2026-01-01T00:00:00.000Z',
        })
      );

      assert.equal(status, 201);
      assert.equal(json.success, true);
      assert.equal(json.message, 'Registration created successfully');
      assert.equal(json.data.memberCount, count);
      assert.equal(json.data.totalAmount, EXPECTED_TOTALS[count]);
      assert.equal(json.data.totalAmount, count * REGISTRATION_FEE_PER_PARTICIPANT);
      assert.equal(json.data.paymentStatus, PAYMENT_STATUSES.PENDING);
      assert.equal(json.data.paymentTransactionId, undefined);
      assert.equal(json.data.paidAt, undefined);
      assert.ok(json.data.id);
      createdIds.push(json.data.id);
    });
  }

  it('rejects a missing team name', async () => {
    const body = payload(1);
    delete body.teamName;
    const { status, json } = await postRegistration(body);

    assert.equal(status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  it('rejects an empty members list', async () => {
    const { status, json } = await postRegistration({
      teamName: `API-TEST ${runId} empty`,
      members: [],
    });

    assert.equal(status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_PARTICIPANT_COUNT');
  });

  it('rejects an invalid studentType', async () => {
    const { status, json } = await postRegistration({
      teamName: `API-TEST ${runId} type`,
      members: [member(20, { studentType: 'PG' })],
    });

    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  it('rejects a hostel student without hostelName', async () => {
    const { status, json } = await postRegistration({
      teamName: `API-TEST ${runId} hostel`,
      members: [member(21, { studentType: 'HOSTEL', hostelName: '', roomNumber: '12' })],
    });

    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  it('rejects duplicate register numbers in the same request', async () => {
    const first = member(22);
    const { status, json } = await postRegistration({
      teamName: `API-TEST ${runId} dup`,
      members: [first, member(23, { registerNumber: first.registerNumber, email: 'other@college.edu' })],
    });

    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

    it('rejects a register number blocked by the administrator', async () => {
      const { status, json } = await postRegistration({
        teamName: `API-TEST ${runId} blocked`,
        members: [member(30, { registerNumber: '99230040448' })],
      });

      assert.equal(status, 403);
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'BLOCKED_REGISTER_NUMBER');
      assert.equal(json.message, 'The entered register number is blocked by the administrator.');
    });
  });
