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
      } catch (error) {
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
