const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const adminRegistrationService = require('../services/adminRegistrationService');

const listRegistrations = asyncHandler(async (req, res) => {
  const data = await adminRegistrationService.listRegistrations(req.query);

  return sendSuccess(res, {
    message: 'Registrations fetched successfully',
    data,
  });
});

const getRegistrationSummary = asyncHandler(async (req, res) => {
  const data = await adminRegistrationService.getRegistrationSummary(req.query);

  return sendSuccess(res, {
    message: 'Registration counts fetched successfully',
    data,
  });
});

const getRegistrationById = asyncHandler(async (req, res) => {
  const data = await adminRegistrationService.getRegistrationById(req.params.id);

  return sendSuccess(res, {
    message: 'Registration fetched successfully',
    data,
  });
});

const exportRegistrationsCsv = asyncHandler(async (req, res) => {
  await adminRegistrationService.streamRegistrationsCsv(req.query, res);
});

const exportRegistrationsPdf = asyncHandler(async (req, res) => {
  await adminRegistrationService.streamRegistrationsPdf(req.query, res);
});

const deleteRegistration = asyncHandler(async (req, res) => {
  const data = await adminRegistrationService.deleteRegistration(req.params.id);

  return sendSuccess(res, {
    message: 'Registration deleted successfully',
    data,
  });
});

module.exports = {
  listRegistrations,
  getRegistrationSummary,
  getRegistrationById,
  deleteRegistration,
  exportRegistrationsCsv,
  exportRegistrationsPdf,
};
