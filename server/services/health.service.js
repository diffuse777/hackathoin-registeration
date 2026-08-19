function getHealthStatus() {
  return {
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };
