function sendSuccess(res, { message = 'Request successful', data = {}, statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, { message = 'Something went wrong', code = 'INTERNAL_ERROR', statusCode = 500, details } = {}) {
  const error = { code };

  if (details) {
    error.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
}

module.exports = { sendSuccess, sendError };
