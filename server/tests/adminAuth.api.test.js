require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../app');
const { ensureInitialAdmin } = require('../services/adminAuthService');

let baseUrl = '';
let httpServer;
let config;
let accessToken = '';

async function postJson(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

async function getJson(path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

describe('Admin authentication', () => {
  before(async () => {
    config = loadEnv();
    await connectDB(config.mongoUri);
    await ensureInitialAdmin(config.admin);
    const app = createApp(config);

    await new Promise((resolve) => {
      httpServer = app.listen(0, resolve);
    });

    const address = httpServer.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      if (!httpServer) {
        resolve();
        return;
      }
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    await disconnectDB();
  });

  it('logs in with valid credentials and omits secrets', async () => {
    const { status, json } = await postJson('/api/admin/auth/login', {
      email: config.admin.email,
      password: config.admin.password,
    });

    assert.equal(status, 200);
    assert.equal(json.success, true);
    assert.ok(json.data.token);
    assert.equal(json.data.tokenType, 'Bearer');
    assert.equal(json.data.admin.email, config.admin.email.toLowerCase());
    assert.equal(json.data.admin.role, 'admin');
    assert.equal(json.data.password, undefined);
    assert.equal(json.data.passwordHash, undefined);
    assert.equal(json.data.admin.password, undefined);
    assert.equal(json.data.admin.passwordHash, undefined);
    accessToken = json.data.token;
  });

  it('rejects an invalid password with a generic error', async () => {
    const { status, json } = await postJson('/api/admin/auth/login', {
      email: config.admin.email,
      password: 'definitely-wrong-password',
    });

    assert.equal(status, 401);
    assert.equal(json.error.code, 'UNAUTHORIZED');
    assert.equal(json.message, 'Invalid email or password');
  });

  it('rejects an unknown email with the same generic error', async () => {
    const { status, json } = await postJson('/api/admin/auth/login', {
      email: 'nobody@example.com',
      password: 'definitely-wrong-password',
    });

    assert.equal(status, 401);
    assert.equal(json.error.code, 'UNAUTHORIZED');
    assert.equal(json.message, 'Invalid email or password');
  });

  it('allows a protected endpoint with a valid token', async () => {
    const { status, json } = await getJson('/api/admin/auth/me', {
      Authorization: `Bearer ${accessToken}`,
    });

    assert.equal(status, 200);
    assert.equal(json.data.email, config.admin.email.toLowerCase());
    assert.equal(json.data.passwordHash, undefined);
  });

  it('rejects a missing token', async () => {
    const { status, json } = await getJson('/api/admin/auth/me');
    assert.equal(status, 401);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  it('rejects a malformed token', async () => {
    const { status, json } = await getJson('/api/admin/auth/me', {
      Authorization: 'Bearer not-a-real-token',
    });
    assert.equal(status, 401);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  it('rejects an expired token', async () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign(
      {
        sub: '000000000000000000000000',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) - 30,
      },
      config.jwt.secret,
      { jwtid: 'expired-test-token', algorithm: 'HS256' }
    );

    const { status, json } = await getJson('/api/admin/auth/me', {
      Authorization: `Bearer ${expired}`,
    });
    assert.equal(status, 401);
    assert.equal(json.error.code, 'UNAUTHORIZED');
    assert.equal(json.message, 'Token expired');
  });

  it('invalidates the session on logout', async () => {
    const logout = await postJson('/api/admin/auth/logout', {}, {
      Authorization: `Bearer ${accessToken}`,
    });
    assert.equal(logout.status, 200);

    const me = await getJson('/api/admin/auth/me', {
      Authorization: `Bearer ${accessToken}`,
    });
    assert.equal(me.status, 401);
  });
});
