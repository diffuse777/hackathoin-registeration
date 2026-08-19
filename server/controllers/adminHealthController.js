const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const adminHealthService = require('../services/adminHealthService');

const getHealth = asyncHandler(async (req, res) => {
  const data = await adminHealthService.getAdminHealth();

  return sendSuccess(res, {
    message: 'Website health fetched successfully',
    data,
  });
});

module.exports = { getHealth };
