require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const { ensureInitialAdmin } = require('../services/adminAuthService');
const registrationRepository = require('../repositories/registrationRepository');
const { PAYMENT_STATUSES, STUDENT_TYPES } = require('../utils/constants');

let baseUrl = '';
let httpServer;
let config;
let token = '';
const createdIds = [];
const runId = Date.now().toString(36).toUpperCase();
const searchPrefix = `ADM-${runId}`;

function member(index, group, overrides = {}) {
  const n = String(index + 1).padStart(2, '0');

  return {
    name: `Admin List ${group} ${n}`,
    registerNumber: `AL${runId}${group}${n}`,
    department: 'CSE',
    section: 'A',
    phone: `98${String(group.charCodeAt(0))}${String(index).padStart(6, '0')}`,
    email: `al-${runId.toLowerCase()}-${group.toLowerCase()}-${n}@college.edu`,
    studentType: STUDENT_TYPES.DAY_SCHOLAR,
    ...overrides,
  };
}

async function json(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, json: payload };
}

async function setPaymentStatus(id, paymentStatus, extra = {}) {
  const doc = await registrationRepository.findById(id);
  doc.paymentStatus = paymentStatus;
  Object.assign(doc.payment, extra);
  await doc.save();
}

describe('Admin registration APIs', () => {
  before(async () => {
    config = loadEnv();
    await connectDB(config.mongoUri);
    await ensureInitialAdmin(config.admin);
    const app = createApp(config);

    await new Promise((resolve) => {
      httpServer = app.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${httpServer.address().port}`;

    const login = await json('/api/admin/auth/login', {
      method: 'POST',
      body: { email: config.admin.email, password: config.admin.password },
      auth: false,
    });
    assert.equal(login.status, 200);
    token = login.json.data.token;

    const paid = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-PAID`,
        members: [
          member(0, 'P', {
            studentType: STUDENT_TYPES.HOSTEL,
            hostelName: `Kaveri-${runId}`,
            roomNumber: '11',
          }),
          member(1, 'P'),
        ],
      },
    });
    const pending = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-PEND`,
        members: [member(0, 'N')],
      },
    });
    const failed = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-FAIL`,
        members: [member(0, 'F')],
      },
    });

    createdIds.push(paid.json.data.id, pending.json.data.id, failed.json.data.id);
    assert.equal(paid.status, 201);
    assert.equal(pending.status, 201);
    assert.equal(failed.status, 201);

    await setPaymentStatus(paid.json.data.id, PAYMENT_STATUSES.PAID, {
      paymentOrderId: `order-admin-${runId}`,
      paymentTransactionId: `txn-admin-${runId}`,
      paidAt: new Date(),
    });
    await setPaymentStatus(failed.json.data.id, PAYMENT_STATUSES.FAILED, {
      paymentOrderId: `order-admin-fail-${runId}`,
    });
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

  it('rejects unauthenticated list access', async () => {
    const { status, json: payload } = await json('/api/admin/registrations', { auth: false });
    assert.equal(status, 401);
    assert.equal(payload.error.code, 'UNAUTHORIZED');
  });

  it('lists teams with pagination metadata and counts', async () => {
    const { status, json: payload } = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&page=1&limit=10`
    );

    assert.equal(status, 200);
    assert.ok(Array.isArray(payload.data.teams));
    assert.equal(payload.data.pagination.page, 1);
    assert.equal(payload.data.pagination.limit, 10);
    assert.equal(payload.data.pagination.totalRecords, 3);
    assert.equal(payload.data.pagination.totalPages, 1);
    assert.equal(payload.data.counts.totalTeams, 3);
    assert.equal(payload.data.counts.totalParticipants, 4);

    const first = payload.data.teams[0];
    assert.ok(first.id);
    assert.ok(first.teamName);
    assert.ok(first.memberCount);
    assert.ok(first.totalAmount != null);
    assert.ok(first.paymentStatus);
    assert.ok(first.createdAt);
    assert.equal(first.members, undefined);
  });

  it('paginates team-wise results without loading the full collection', async () => {
    const { json: payload } = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&page=2&limit=1`
    );

    assert.equal(payload.data.teams.length, 1);
    assert.equal(payload.data.pagination.page, 2);
    assert.equal(payload.data.pagination.limit, 1);
    assert.equal(payload.data.pagination.totalRecords, 3);
    assert.equal(payload.data.pagination.totalPages, 3);
  });

  it('filters by payment status', async () => {
    const paid = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&paymentStatus=PAID`
    );
    const pending = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&paymentStatus=PENDING`
    );
    const failed = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&paymentStatus=FAILED`
    );

    assert.equal(paid.json.data.counts.totalTeams, 1);
    assert.ok(paid.json.data.teams.every((team) => team.paymentStatus === 'PAID'));
    assert.equal(pending.json.data.counts.totalTeams, 1);
    assert.equal(failed.json.data.counts.totalTeams, 1);
    assert.equal(failed.json.data.teams[0].paymentStatus, 'FAILED');
  });

  it('filters by student type and hostel', async () => {
    const hostel = await json(
      `/api/admin/registrations?search=${encodeURIComponent(searchPrefix)}&studentType=HOSTEL&hostelName=${encodeURIComponent(`Kaveri-${runId}`)}`
    );
    assert.equal(hostel.status, 200);
    assert.equal(hostel.json.data.counts.totalTeams, 1);
    assert.equal(hostel.json.data.teams[0].teamName, `${searchPrefix}-PAID`);
  });

  it('searches by team name, participant name, register number, email, and phone', async () => {
    const byTeam = await json(`/api/admin/registrations?search=${encodeURIComponent(`${searchPrefix}-PEND`)}`);
    const byName = await json(`/api/admin/registrations?search=${encodeURIComponent('Admin List N 01')}`);
    const byRegister = await json(`/api/admin/registrations?search=AL${runId}N01`);
    const byEmail = await json(
      `/api/admin/registrations?search=${encodeURIComponent(`al-${runId.toLowerCase()}-n-01@college.edu`)}`
    );
    const byPhone = await json(`/api/admin/registrations?search=98${String('N'.charCodeAt(0))}000000`);

    for (const result of [byTeam, byName, byRegister, byEmail, byPhone]) {
      assert.equal(result.json.data.counts.totalTeams, 1);
      assert.equal(result.json.data.teams[0].teamName, `${searchPrefix}-PEND`);
    }
  });

  it('returns complete member details for a team', async () => {
    const { status, json: payload } = await json(`/api/admin/registrations/${createdIds[0]}`);
    assert.equal(status, 200);
    assert.equal(payload.data.teamName, `${searchPrefix}-PAID`);
    assert.equal(payload.data.members.length, 2);
    assert.equal(payload.data.members[0].registerNumber.startsWith(`AL${runId}`), true);
    assert.equal(payload.data.totalAmount, 700);
    assert.equal(payload.data.paymentStatus, 'PAID');
    assert.ok(payload.data.members[0].name);
    assert.ok(payload.data.members[0].email);
  });

  it('returns registration and participant counts', async () => {
    const { status, json: payload } = await json(
      `/api/admin/registrations/summary?search=${encodeURIComponent(searchPrefix)}`
    );
    assert.equal(status, 200);
    assert.equal(payload.data.totalTeams, 3);
    assert.equal(payload.data.totalParticipants, 4);
  });

  it('does not allow admin APIs to create or update registration data', async () => {
    const create = await json('/api/admin/registrations', { method: 'POST', body: { teamName: 'nope' } });
    const update = await json(`/api/admin/registrations/${createdIds[0]}`, {
      method: 'PATCH',
      body: { paymentStatus: 'PAID' },
    });

    assert.equal(create.status, 404);
    assert.equal(update.status, 404);
  });

  it('deletes a registration and all of its participants', async () => {
    const created = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-DEL`,
        members: [member(0, 'D')],
      },
    });
    assert.equal(created.status, 201);
    const id = created.json.data.id;

    const unauthorized = await json(`/api/admin/registrations/${id}`, { method: 'DELETE', auth: false });
    assert.equal(unauthorized.status, 401);

    const removed = await json(`/api/admin/registrations/${id}`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal(removed.json.success, true);
    assert.equal(removed.json.data.id, id);

    const missing = await json(`/api/admin/registrations/${id}`);
    assert.equal(missing.status, 404);
  });
});
