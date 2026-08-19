const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const adminAuthService = require('../services/adminAuthService');

const login = asyncHandler(async (req, res) => {
  const data = await adminAuthService.login(req.body);

  return sendSuccess(res, {
    message: 'Login successful',
    data,
  });
});

const logout = asyncHandler(async (req, res) => {
  await adminAuthService.logout(req.auth);

  return sendSuccess(res, {
    message: 'Logout successful',
    data: {},
  });
});

const me = asyncHandler(async (req, res) => {
  const data = await adminAuthService.getCurrentAdmin(req.auth);

  return sendSuccess(res, {
    message: 'Admin session is active',
    data,
  });
});

module.exports = { login, logout, me };
