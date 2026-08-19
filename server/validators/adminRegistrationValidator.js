const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { PAYMENT_STATUSES, STUDENT_TYPES, ERROR_CODES } = require('../utils/constants');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function parseAdminRegistrationQuery(query = {}) {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const paymentStatus = String(query.paymentStatus || 'ALL').trim().toUpperCase();
  if (paymentStatus !== 'ALL' && !Object.values(PAYMENT_STATUSES).includes(paymentStatus)) {
    throw new AppError('Invalid paymentStatus filter', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const studentType = String(query.studentType || 'ALL').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (studentType !== 'ALL' && !Object.values(STUDENT_TYPES).includes(studentType)) {
    throw new AppError('Invalid studentType filter', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const hostelName = typeof query.hostelName === 'string' ? query.hostelName.trim() : '';
  const department = typeof query.department === 'string' ? query.department.trim() : '';

  if (department.length > 80) {
    throw new AppError('department filter is too long', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search,
    paymentStatus,
    studentType,
    hostelName,
    department,
  };
}

function validateRegistrationId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('A valid registration id is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return id;
}

function escapeRegexQuery(value) {
  return escapeRegex(value);
}

module.exports = {
  parseAdminRegistrationQuery,
  validateRegistrationId,
  escapeRegexQuery,
};
