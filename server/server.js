require('dotenv').config();

const { loadEnv } = require('./config/env');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { createApp } = require('./app');
const { ensureInitialAdmin } = require('./services/adminAuthService');

const SHUTDOWN_TIMEOUT_MS = 10000;

let config;
let httpServer;
let isShuttingDown = false;

function registerProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    void shutdown('unhandledRejection', 1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: error.stack,
    });
    void shutdown('uncaughtException', 1);
  });

  ['SIGTERM', 'SIGINT', 'SIGBREAK'].forEach((signal) => {
    process.on(signal, () => {
      void shutdown(signal, 0);
    });
  });
}

async function shutdown(signal, exitCode) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('Graceful shutdown started', { signal });

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExit.unref();

  try {
    if (httpServer) {
      if (typeof httpServer.closeIdleConnections === 'function') {
        httpServer.closeIdleConnections();
      }

      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    await disconnectDB();
    logger.info('Shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during shutdown', { message: error.message });
    process.exit(1);
  }
}

async function start() {
  config = loadEnv();
  registerProcessHandlers();

  await connectDB(config.mongoUri);
  await ensureInitialAdmin(config.admin);

  const app = createApp(config);

  httpServer = app.listen(config.port, () => {
    logger.info('HTTP server started', {
      port: config.port,
      environment: config.nodeEnv,
      pid: process.pid,
    });
  });
}

start().catch((error) => {
  logger.error('Failed to start server', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
