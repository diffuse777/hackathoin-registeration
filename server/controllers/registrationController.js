const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const registrationService = require('../services/registrationService');

const createRegistration = asyncHandler(async (req, res) => {
  const data = await registrationService.createRegistration(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration created successfully',
    data,
  });
});

module.exports = { createRegistration };
