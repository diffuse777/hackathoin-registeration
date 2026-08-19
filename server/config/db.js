const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('./logger');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

let listenersBound = false;

function bindConnectionListeners() {
  if (listenersBound) {
    return;
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  listenersBound = true;
}

async function connectDB(mongoUri) {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', !process.env.VERCEL);
  bindConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }

  const connectPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: process.env.VERCEL ? 4000 : 15000,
    connectTimeoutMS: process.env.VERCEL ? 4000 : 15000,
    socketTimeoutMS: 15000,
    maxPoolSize: process.env.VERCEL ? 1 : 10,
    minPoolSize: 0,
    family: 4,
  });

  if (process.env.VERCEL) {
    await Promise.race([
      connectPromise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MongoDB connection timed out')), 6000);
      }),
    ]);
  } else {
    await connectPromise;
  }

  return mongoose.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

module.exports = { connectDB, disconnectDB };
