const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const healthService = require('../services/health.service');

const getHealth = asyncHandler(async (req, res) => {
  const data = healthService.getHealthStatus();
  return sendSuccess(res, {
    message: 'Server is healthy',
    data,
  });
});

module.exports = { getHealth };
