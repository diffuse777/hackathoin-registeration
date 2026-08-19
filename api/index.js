require('dotenv').config();

const serverless = require('serverless-http');
const { loadEnv } = require('../server/config/env');
const { connectDB } = require('../server/config/db');
const { createApp } = require('../server/app');
const { ensureInitialAdmin } = require('../server/services/adminAuthService');

const globalForApi = globalThis;
if (!globalForApi.__hackathonApi) {
  globalForApi.__hackathonApi = { handlerPromise: null };
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

function parseVercelBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req._body = true;
    return;
  }

  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
    req._body = true;
  }
}

async function getHandler() {
  if (!globalForApi.__hackathonApi.handlerPromise) {
    globalForApi.__hackathonApi.handlerPromise = (async () => {
      const config = loadEnv();
      try {
        await connectDB(config.mongoUri);
      } catch {
        throw new Error(
          'Cannot reach MongoDB from Vercel. In Atlas go to Network Access and allow 0.0.0.0/0, then check MONGODB_URI.'
        );
      }
      await ensureInitialAdmin(config.admin);
      const app = createApp(config, { apiOnly: true });
      return serverless(app, {
        binary: ['application/pdf', 'application/octet-stream'],
      });
    })().catch((error) => {
      globalForApi.__hackathonApi.handlerPromise = null;
      throw error;
    });
  }

  return globalForApi.__hackathonApi.handlerPromise;
}

module.exports = async (req, res) => {
  try {
    restoreApiUrl(req);
    parseVercelBody(req);
    const handler = await getHandler();
    return handler(req, res);
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
