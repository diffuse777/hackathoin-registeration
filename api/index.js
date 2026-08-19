require('dns').setDefaultResultOrder?.('ipv4first');
require('dotenv').config();

const { loadEnv } = require('../server/config/env');
const { connectDB } = require('../server/config/db');
const { createApp } = require('../server/app');
const { ensureInitialAdmin } = require('../server/services/adminAuthService');

const globalForApi = globalThis;
if (!globalForApi.__hackathonApi) {
  globalForApi.__hackathonApi = { appPromise: null };
}

function restoreApiUrl(req) {
  const incoming = req.url || '/';
  const question = incoming.indexOf('?');
  const pathname = question === -1 ? incoming : incoming.slice(0, question);
  const search = question === -1 ? '' : incoming.slice(question);

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return;
  }

  const headerPath = req.headers['x-invoke-path'] || req.headers['x-forwarded-uri'];
  if (typeof headerPath === 'string' && headerPath.startsWith('/api')) {
    req.url = `${headerPath.split('?')[0]}${search}`;
    return;
  }

  req.url = `${pathname === '/' ? '/api' : `/api${pathname.startsWith('/') ? pathname : `/${pathname}`}`}${search}`;
}

function parseExistingBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Object.keys(req.body).length > 0 ? req.body : null;
  }

  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  return null;
}

function readRequestBody(req, timeoutMs = 1500) {
  const existing = parseExistingBody(req);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    };

    const timer = setTimeout(finish, timeoutMs);
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      clearTimeout(timer);
      finish();
    });
    req.on('error', () => {
      clearTimeout(timer);
      finish();
    });
  });
}

function runExpress(app, req, res) {
  return new Promise((resolve, reject) => {
    const done = () => {
      res.off('finish', done);
      res.off('close', done);
      resolve();
    };

    res.on('finish', done);
    res.on('close', done);

    try {
      app(req, res, (error) => {
        if (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function getApp() {
  if (!globalForApi.__hackathonApi.appPromise) {
    globalForApi.__hackathonApi.appPromise = (async () => {
      const config = loadEnv();
      try {
        await connectDB(config.mongoUri);
      } catch {
        throw new Error(
          'Cannot reach MongoDB from Vercel. In Atlas go to Network Access and allow 0.0.0.0/0, then check MONGODB_URI.'
        );
      }
      await ensureInitialAdmin(config.admin);
      return createApp(config, { apiOnly: true });
    })().catch((error) => {
      globalForApi.__hackathonApi.appPromise = null;
      throw error;
    });
  }

  return globalForApi.__hackathonApi.appPromise;
}

module.exports = async (req, res) => {
  try {
    restoreApiUrl(req);
    req.body = await readRequestBody(req);
    req._body = true;
    const app = await getApp();
    await runExpress(app, req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          message: error?.message || 'Server failed to start',
          error: { code: 'INTERNAL_ERROR' },
        })
      );
    }
  }
};
