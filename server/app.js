const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const requestLogger = require('./middleware/requestLogger');
const { createApiRateLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const legacyClientDir = path.join(__dirname, '..', 'client', 'legacy');

function allowedCorsOrigins(config) {
  const origins = new Set();

  if (config.clientUrl) {
    origins.add(config.clientUrl.replace(/\/+$/, ''));
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (config.isDevelopment) {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }

  return origins;
}

function isAllowedCorsOrigin(origin, allowed) {
  if (!origin) {
    return true;
  }

  if (allowed.has(origin)) {
    return true;
  }

  return Boolean(process.env.VERCEL) && /^https:\/\/[\w.-]+\.vercel\.app$/.test(origin);
}

function createApp(config, options = {}) {
  const app = express();
  const corsOrigins = allowedCorsOrigins(config);
  const apiOnly = Boolean(options.apiOnly || process.env.VERCEL);

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin, corsOrigins)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({
    limit: '32kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(requestLogger);

  const apiLimiter = createApiRateLimiter();
  app.use('/api', apiLimiter);
  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  if (apiOnly) {
    // Vercel may strip /api when rewriting into the function, e.g. /admin/auth/login.
    app.use(apiLimiter);
    app.use(apiRoutes);
  } else {
    function sendPage(fileName) {
      return (req, res) => {
        res.sendFile(path.join(legacyClientDir, fileName));
      };
    }

    app.get('/', sendPage('home.html'));
    app.get('/home', sendPage('home.html'));
    app.get('/register', sendPage('register.html'));
    app.get('/pay', sendPage('pay.html'));
    app.get('/done', sendPage('done.html'));
    app.get('/admin', sendPage('admin.html'));
    app.use(express.static(legacyClientDir));
  }

  app.use(notFound);
  app.use(errorHandler(config));

  return app;
}

module.exports = { createApp };
