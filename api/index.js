require('dotenv').config();

const serverless = require('serverless-http');
const { loadEnv } = require('../server/config/env');
const { connectDB } = require('../server/config/db');
const { createApp } = require('../server/app');
const { ensureInitialAdmin } = require('../server/services/adminAuthService');

let handlerPromise;

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
    const headerPathname = headerPath.split('?')[0];
    req.url = `${headerPathname}${search}`;
    return;
  }

  req.url = `${pathname === '/' ? '/api' : `/api${pathname.startsWith('/') ? pathname : `/${pathname}`}`}${search}`;
}

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const config = loadEnv();
      await connectDB(config.mongoUri);
      await ensureInitialAdmin(config.admin);
      const app = createApp(config, { apiOnly: true });
      return serverless(app, {
        binary: ['application/pdf', 'application/octet-stream'],
      });
    })().catch((error) => {
      handlerPromise = null;
      throw error;
    });
  }

  return handlerPromise;
}

module.exports = async (req, res) => {
  try {
    restoreApiUrl(req);
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
