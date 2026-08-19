require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const { ensureInitialAdmin } = require('../services/adminAuthService');
const registrationRepository = require('../repositories/registrationRepository');
const { createRegistrationPdfReport } = require('../utils/registrationPdfReport');
const { PAYMENT_STATUSES, STUDENT_TYPES } = require('../utils/constants');

let baseUrl = '';
let httpServer;
let config;
let token = '';
const createdIds = [];
const runId = Date.now().toString(36).toUpperCase();
const searchPrefix = `PDF-${runId}`;
const kaveriHostel = `Kaveri-${runId}`;
const narmadaHostel = `Narmada-${runId}`;

function member(index, group, overrides = {}) {
  const n = String(index + 1).padStart(2, '0');

  return {
    name: `Pdf Export ${group} ${n}`,
    registerNumber: `PX${runId}${group}${n}`,
    department: 'CSE',
    section: 'A',
    phone: `96${String(group.charCodeAt(0))}${String(index).padStart(6, '0')}`,
    email: `px-${runId.toLowerCase()}-${group.toLowerCase()}-${n}@college.edu`,
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

async function exportPdf(query = '', { auth = true } = {}) {
  const headers = {};
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/admin/registrations/export/pdf${query}`, { headers });
  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, buffer };
}

async function extractPdfText(buffer) {
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text || '',
      pages: result.total || result.pages?.length || 0,
    };
  } finally {
    await parser.destroy();
  }
}

async function collectPdf(write) {
  const chunks = [];
  const stream = new PassThrough();
  stream.on('data', (chunk) => chunks.push(chunk));
  const report = createRegistrationPdfReport(stream, {
    generatedAt: new Date('2026-08-18T16:00:00.000Z'),
    filterLines: ['Payment Status: ALL', 'Student Type: ALL', 'Hostel: ALL', 'Department: ALL', 'Search: ALL'],
  });
  write(report);
  await report.end();
  return Buffer.concat(chunks);
}

async function setPaymentStatus(id, paymentStatus, extra = {}) {
  const doc = await registrationRepository.findById(id);
  doc.paymentStatus = paymentStatus;
  Object.assign(doc.payment, extra);
  await doc.save();
}

describe('PDF report pagination', () => {
  it('spans multiple pages and repeats table headers', async () => {
    const buffer = await collectPdf((report) => {
      for (let index = 1; index <= 18; index += 1) {
        report.writeTeam({
          teamName: `Paging Team ${String(index).padStart(2, '0')}`,
          memberCount: 2,
          paymentStatus: 'PENDING',
          totalAmount: 700,
          members: [
            {
              name: `Pager ${index}A`,
              registerNumber: `PG${index}A`,
              department: 'CSE',
              section: 'A',
              phone: '9000000001',
              email: `pager-${index}-a@college.edu`,
              studentType: 'HOSTEL',
              hostelName: 'Kaveri',
              roomNumber: '10',
            },
            {
              name: `Pager ${index}B`,
              registerNumber: `PG${index}B`,
              department: 'ECE',
              section: 'B',
              phone: '9000000002',
              email: `pager-${index}-b@college.edu`,
              studentType: 'DAY_SCHOLAR',
            },
          ],
        });
      }
    });

    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
    const { text, pages } = await extractPdfText(buffer);
    assert.ok(pages >= 2);
    assert.match(text, /QUANTEX SERIES MUGEN/);
    assert.match(text, /ELECTRONICALLY GENERATED/);
    assert.match(text, /Team Name/);
    const headerCount = (text.match(/Register No/g) || []).length;
    assert.ok(headerCount >= pages);
    assert.doesNotMatch(text, /ObjectId|_id/);
    assert.doesNotMatch(text, /Generated Date/);
    assert.doesNotMatch(text, /Applied Filters/);
  });
});

describe('Admin PDF export', () => {
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
      paymentOrderId: `order-pdf-${runId}`,
      paymentTransactionId: `txn-pdf-${runId}`,
      paidAt: new Date(),
    });
    await setPaymentStatus(hostelOnly.json.data.id, PAYMENT_STATUSES.FAILED, {
      paymentOrderId: `order-pdf-fail-${runId}`,
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
    const { status, buffer } = await exportPdf(`?search=${encodeURIComponent(searchPrefix)}`, { auth: false });
    assert.equal(status, 401);
    const payload = JSON.parse(buffer.toString('utf8'));
    assert.equal(payload.error.code, 'UNAUTHORIZED');
  });

  it('exports all matching registrations with report metadata', async () => {
    const { status, headers, buffer } = await exportPdf(`?search=${encodeURIComponent(searchPrefix)}`);
    const { text } = await extractPdfText(buffer);

    assert.equal(status, 200);
    assert.match(headers.get('content-type'), /application\/pdf/);
    assert.match(headers.get('content-disposition'), /attachment; filename="hackathon-registrations-\d{4}-\d{2}-\d{2}\.pdf"/);
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
    assert.match(text, /QUANTEX SERIES MUGEN/);
    assert.match(text, /ELECTRONICALLY GENERATED/);
    assert.match(text, new RegExp(`${searchPrefix}-MIX`));
    assert.match(text, new RegExp(`${searchPrefix}-DAY`));
    assert.match(text, new RegExp(`${searchPrefix}-HOST`));
    assert.match(text, /Pdf Export M 01/);
    assert.match(text, /Pdf Export M 02/);
    assert.match(text, /Paid Status/);
    assert.doesNotMatch(text, /ObjectId/);
    assert.doesNotMatch(text, /Generated Date/);
    assert.doesNotMatch(text, /Applied Filters/);
  });

  it('exports only hostel participants for studentType=HOSTEL', async () => {
    const { buffer } = await exportPdf(`?search=${encodeURIComponent(searchPrefix)}&studentType=HOSTEL`);
    const { text } = await extractPdfText(buffer);

    assert.match(text, /Pdf Export M 01/);
    assert.doesNotMatch(text, /Pdf Export M 02/);
    assert.match(text, /Pdf Export H 01/);
    assert.doesNotMatch(text, /Pdf Export D 01/);
  });

  it('exports only day scholars for studentType=DAY_SCHOLAR', async () => {
    const { buffer } = await exportPdf(`?search=${encodeURIComponent(searchPrefix)}&studentType=DAY_SCHOLAR`);
    const { text } = await extractPdfText(buffer);

    assert.match(text, /Pdf Export M 02/);
    assert.match(text, /Pdf Export D 01/);
    assert.doesNotMatch(text, /Pdf Export M 01/);
    assert.doesNotMatch(text, /Pdf Export H 01/);
  });

  it('exports only participants from a specific hostel', async () => {
    const { buffer } = await exportPdf(
      `?search=${encodeURIComponent(searchPrefix)}&hostelName=${encodeURIComponent(kaveriHostel)}`
    );
    const { text } = await extractPdfText(buffer);

    assert.match(text, /Pdf Export M 01/);
    assert.doesNotMatch(text, /Pdf Export M 02/);
    assert.doesNotMatch(text, /Pdf Export H 01/);
    assert.doesNotMatch(text, new RegExp(narmadaHostel));
  });

  it('exports only paid registrations', async () => {
    const { buffer } = await exportPdf(`?search=${encodeURIComponent(searchPrefix)}&paymentStatus=PAID`);
    const { text } = await extractPdfText(buffer);

    assert.match(text, new RegExp(`${searchPrefix}-MIX`));
    assert.match(text, /Pdf Export M 01/);
    assert.match(text, /Pdf Export M 02/);
    assert.doesNotMatch(text, new RegExp(`${searchPrefix}-DAY`));
    assert.doesNotMatch(text, new RegExp(`${searchPrefix}-HOST`));
    assert.match(text, /PAID/);
  });

  it('combines search with student type and department filters', async () => {
    const { buffer } = await exportPdf(
      `?search=${encodeURIComponent(searchPrefix)}&studentType=HOSTEL&department=ECE`
    );
    const { text } = await extractPdfText(buffer);

    assert.match(text, new RegExp(`${searchPrefix}-HOST`));
    assert.match(text, /Pdf Export H 01/);
    assert.doesNotMatch(text, /Pdf Export M 01/);
    assert.doesNotMatch(text, /Pdf Export D 01/);
  });
});
