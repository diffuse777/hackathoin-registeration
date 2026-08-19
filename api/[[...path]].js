require('dotenv').config();

const serverless = require('serverless-http');
const { loadEnv } = require('../server/config/env');
const { connectDB } = require('../server/config/db');
const { createApp } = require('../server/app');
const { ensureInitialAdmin } = require('../server/services/adminAuthService');

let handlerPromise;

function ensureApiPath(req) {
  const url = req.url || '/';
  if (url.startsWith('/api')) {
    return;
  }

  req.url = url === '/' ? '/api' : `/api${url.startsWith('/') ? url : `/${url}`}`;
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
    ensureApiPath(req);
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
