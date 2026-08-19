require('dotenv').config();

const { loadEnv } = require('../server/config/env');
const { connectDB } = require('../server/config/db');
const { createApp } = require('../server/app');
const { ensureInitialAdmin } = require('../server/services/adminAuthService');

let appPromise;

function ensureApiPath(req) {
  const url = req.url || '/';
  if (url.startsWith('/api')) {
    return;
  }

  req.url = url === '/' ? '/api' : `/api${url.startsWith('/') ? url : `/${url}`}`;
}

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const config = loadEnv();
      await connectDB(config.mongoUri);
      await ensureInitialAdmin(config.admin);
      return createApp(config);
    })();
  }

  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    ensureApiPath(req);
    return app(req, res);
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        message: 'Server failed to start',
        error: { code: 'INTERNAL_ERROR' },
      })
    );
  }
};
