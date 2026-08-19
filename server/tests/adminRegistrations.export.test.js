require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const { ensureInitialAdmin } = require('../services/adminAuthService');
const registrationRepository = require('../repositories/registrationRepository');
const { CSV_COLUMNS } = require('../utils/csv');
const { PAYMENT_STATUSES, STUDENT_TYPES } = require('../utils/constants');

let baseUrl = '';
let httpServer;
let config;
let token = '';
const createdIds = [];
const runId = Date.now().toString(36).toUpperCase();
const searchPrefix = `CSV-${runId}`;
const kaveriHostel = `Kaveri-${runId}`;
const narmadaHostel = `Narmada-${runId}`;

function member(index, group, overrides = {}) {
  const n = String(index + 1).padStart(2, '0');

  return {
    name: `Export ${group} ${n}`,
    registerNumber: `CX${runId}${group}${n}`,
    department: 'CSE',
    section: 'A',
    phone: `97${String(group.charCodeAt(0))}${String(index).padStart(6, '0')}`,
    email: `cx-${runId.toLowerCase()}-${group.toLowerCase()}-${n}@college.edu`,
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

async function exportCsv(query = '', { auth = true } = {}) {
  const headers = {};
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/admin/registrations/export/csv${query}`, { headers });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text };
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });

  return { headers, rows };
}

async function setPaymentStatus(id, paymentStatus, extra = {}) {
  const doc = await registrationRepository.findById(id);
  doc.paymentStatus = paymentStatus;
  Object.assign(doc.payment, extra);
  await doc.save();
}

describe('Admin CSV export', () => {
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

    const mixed = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-MIX`,
        members: [
          member(0, 'M', {
            studentType: STUDENT_TYPES.HOSTEL,
            hostelName: kaveriHostel,
            roomNumber: '11',
            department: 'CSE',
          }),
          member(1, 'M', {
            studentType: STUDENT_TYPES.DAY_SCHOLAR,
            department: 'ECE',
          }),
        ],
      },
    });
    const dayOnly = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-DAY`,
        members: [member(0, 'D', { department: 'CSE' })],
      },
    });
    const hostelOnly = await json('/api/registrations', {
      method: 'POST',
      body: {
        teamName: `${searchPrefix}-HOST`,
        members: [
          member(0, 'H', {
            studentType: STUDENT_TYPES.HOSTEL,
            hostelName: narmadaHostel,
            roomNumber: '22',
            department: 'ECE',
          }),
        ],
      },
    });

    createdIds.push(mixed.json.data.id, dayOnly.json.data.id, hostelOnly.json.data.id);
    assert.equal(mixed.status, 201);
    assert.equal(dayOnly.status, 201);
    assert.equal(hostelOnly.status, 201);

    await setPaymentStatus(mixed.json.data.id, PAYMENT_STATUSES.PAID, {
      paymentOrderId: `order-csv-${runId}`,
      paymentTransactionId: `txn-csv-${runId}`,
      paidAt: new Date(),
    });
    await setPaymentStatus(hostelOnly.json.data.id, PAYMENT_STATUSES.FAILED, {
      paymentOrderId: `order-csv-fail-${runId}`,
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

  it('rejects unauthenticated export', async () => {
    const { status, text } = await exportCsv(`?search=${encodeURIComponent(searchPrefix)}`, { auth: false });
    assert.equal(status, 401);
    const payload = JSON.parse(text);
    assert.equal(payload.error.code, 'UNAUTHORIZED');
  });

  it('exports all matching registrations as participant rows', async () => {
    const { status, headers, text } = await exportCsv(`?search=${encodeURIComponent(searchPrefix)}`);
    const { headers: columns, rows } = parseCsv(text);

    assert.equal(status, 200);
    assert.match(headers.get('content-type'), /text\/csv/);
    assert.match(headers.get('content-disposition'), /attachment; filename="hackathon-registrations-\d{4}-\d{2}-\d{2}\.csv"/);
    assert.deepEqual(columns, [...CSV_COLUMNS]);
    assert.equal(rows.length, 4);
    assert.equal(columns.includes('_id'), false);
    assert.equal(columns.includes('id'), false);
    assert.doesNotMatch(text, /ObjectId/);
    assert.ok(rows.every((row) => row['Created Date']));
    assert.ok(rows.every((row) => row['Team Name'].startsWith(searchPrefix)));
  });

  it('exports only hostel participants for studentType=HOSTEL', async () => {
    const { text } = await exportCsv(
      `?search=${encodeURIComponent(searchPrefix)}&studentType=HOSTEL`
    );
    const { rows } = parseCsv(text);

    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row['Student Type'] === 'HOSTEL'));
    assert.equal(rows.some((row) => row['Team Name'] === `${searchPrefix}-MIX`), true);
    assert.equal(
      rows.find((row) => row['Team Name'] === `${searchPrefix}-MIX`)['Member Count'],
      '2'
    );
    assert.equal(
      rows.find((row) => row['Team Name'] === `${searchPrefix}-MIX`)['Total Team Amount'],
      '700'
    );
  });

  it('exports only day scholars for studentType=DAY_SCHOLAR', async () => {
    const { text } = await exportCsv(
      `?search=${encodeURIComponent(searchPrefix)}&studentType=DAY_SCHOLAR`
    );
    const { rows } = parseCsv(text);

    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row['Student Type'] === 'DAY_SCHOLAR'));
    assert.ok(rows.every((row) => row['Hostel Name'] === ''));
  });

  it('exports only participants from a specific hostel', async () => {
    const { text } = await exportCsv(
      `?search=${encodeURIComponent(searchPrefix)}&hostelName=${encodeURIComponent(kaveriHostel)}`
    );
    const { rows } = parseCsv(text);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Hostel Name'], kaveriHostel);
    assert.equal(rows[0]['Participant Name'], 'Export M 01');
    assert.equal(rows[0]['Room Number'], '11');
  });

  it('filters export by payment status', async () => {
    const { text } = await exportCsv(
      `?search=${encodeURIComponent(searchPrefix)}&paymentStatus=PAID`
    );
    const { rows } = parseCsv(text);

    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row['Payment Status'] === 'PAID'));
    assert.ok(rows.every((row) => row['Team Name'] === `${searchPrefix}-MIX`));
  });

  it('combines search with student type and department filters', async () => {
    const { text } = await exportCsv(
      `?search=${encodeURIComponent(searchPrefix)}&studentType=HOSTEL&department=ECE`
    );
    const { rows } = parseCsv(text);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]['Team Name'], `${searchPrefix}-HOST`);
    assert.equal(rows[0]['Department'], 'ECE');
    assert.equal(rows[0]['Student Type'], 'HOSTEL');
    assert.equal(rows[0]['Hostel Name'], narmadaHostel);
  });
});
