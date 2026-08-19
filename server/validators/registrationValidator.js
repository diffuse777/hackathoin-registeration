const AppError = require('../utils/AppError');
const {
  MIN_TEAM_MEMBERS,
  MAX_TEAM_MEMBERS,
  STUDENT_TYPES,
  ERROR_CODES,
} = require('../utils/constants');
const {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  REGISTER_NUMBER_PATTERN,
  normalizeStudentType,
  isHostelStudent,
  isBlank,
  isValidTeamSize,
  membersHaveUniqueRegisterNumbers,
  membersHaveUniqueEmails,
} = require('./registration.validators');
const {
  BLOCKED_REGISTER_MESSAGE,
  findBlockedMembers,
} = require('../utils/blockedRegisterNumbers');

function throwValidation(details, message = 'Validation failed') {
  throw new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
}

function requireString(value, field, details, { min = 1, max = 80 } = {}) {
  if (value == null || (typeof value !== 'string' && typeof value !== 'number')) {
    details.push({ field, message: `${field} is required` });
    return '';
  }

  const trimmed = String(value).trim();

  if (isBlank(trimmed)) {
    details.push({ field, message: `${field} is required` });
    return '';
  }

  if (trimmed.length < min) {
    details.push({ field, message: `${field} is too short` });
  }

  if (trimmed.length > max) {
    details.push({ field, message: `${field} is too long` });
  }

  return trimmed;
}

function sanitizeMember(rawMember, index, details) {
  const prefix = `members[${index}]`;

  if (!rawMember || typeof rawMember !== 'object' || Array.isArray(rawMember)) {
    details.push({ field: prefix, message: 'Each member must be an object' });
    return null;
  }

  const name = requireString(rawMember.name, `${prefix}.name`, details, { min: 2, max: 80 });
  const registerNumber = requireString(rawMember.registerNumber, `${prefix}.registerNumber`, details, {
    min: 2,
    max: 30,
  }).toUpperCase();
  const department = requireString(rawMember.department, `${prefix}.department`, details, { min: 1, max: 80 });
  const section = requireString(rawMember.section, `${prefix}.section`, details, { min: 1, max: 10 }).toUpperCase();
  const phone = requireString(
    rawMember.phone == null ? rawMember.phone : String(rawMember.phone).replace(/\s+/g, ''),
    `${prefix}.phone`,
    details,
    { min: 10, max: 10 }
  );
  const email = requireString(rawMember.email, `${prefix}.email`, details, { min: 5, max: 120 }).toLowerCase();
  const studentType = normalizeStudentType(rawMember.studentType);

  if (registerNumber && !registerNumber.match(REGISTER_NUMBER_PATTERN)) {
    details.push({ field: `${prefix}.registerNumber`, message: 'Register number format is invalid' });
  }

  if (phone && !phone.match(PHONE_PATTERN)) {
    details.push({
      field: `${prefix}.phone`,
      message: 'Phone number must be a valid 10-digit Indian mobile number',
    });
  }

  if (email && !email.match(EMAIL_PATTERN)) {
    details.push({ field: `${prefix}.email`, message: 'Email format is invalid' });
  }

  if (!Object.values(STUDENT_TYPES).includes(studentType)) {
    details.push({
      field: `${prefix}.studentType`,
      message: 'studentType must be HOSTEL or DAY_SCHOLAR',
    });
  }

  const member = {
    name,
    registerNumber,
    department,
    section,
    phone,
    email,
    studentType,
  };

  if (isHostelStudent(studentType)) {
    member.hostelName = requireString(rawMember.hostelName, `${prefix}.hostelName`, details, { min: 1, max: 80 });
    member.roomNumber = requireString(rawMember.roomNumber, `${prefix}.roomNumber`, details, { min: 1, max: 20 });
  }

  return member;
}

function validateCreateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throwValidation([{ field: 'body', message: 'Request body must be a JSON object' }], 'Invalid request body');
  }

  const details = [];
  const teamName = requireString(body.teamName, 'teamName', details, { min: 2, max: 80 });

  if (!Array.isArray(body.members)) {
    details.push({ field: 'members', message: 'members must be an array' });
    throwValidation(details);
  }

  if (!isValidTeamSize(body.members.length)) {
    throw new AppError(
      `A team must have between ${MIN_TEAM_MEMBERS} and ${MAX_TEAM_MEMBERS} participants`,
      400,
      ERROR_CODES.INVALID_PARTICIPANT_COUNT,
      [{ field: 'members', message: `Expected ${MIN_TEAM_MEMBERS}-${MAX_TEAM_MEMBERS} participants` }]
    );
  }

  if (body.memberCount != null && body.memberCount !== body.members.length) {
    details.push({
      field: 'memberCount',
      message: 'memberCount must match the number of members',
    });
  }

  const members = body.members.map((member, index) => sanitizeMember(member, index, details)).filter(Boolean);
  const blockedMembers = findBlockedMembers(members);

  if (blockedMembers.length > 0) {
    throw new AppError(
      BLOCKED_REGISTER_MESSAGE,
      403,
      ERROR_CODES.BLOCKED_REGISTER_NUMBER,
      blockedMembers.map((member) => ({
        field: `members[${member.index}].registerNumber`,
        message: BLOCKED_REGISTER_MESSAGE,
      }))
    );
  }

  if (!membersHaveUniqueRegisterNumbers(members)) {
    details.push({ field: 'members.registerNumber', message: 'Duplicate register numbers are not allowed' });
  }

  if (!membersHaveUniqueEmails(members)) {
    details.push({ field: 'members.email', message: 'Duplicate emails are not allowed' });
  }

  if (details.length > 0) {
    throwValidation(details);
  }

  return {
    teamName,
    members,
    memberCount: members.length,
  };
}

module.exports = { validateCreateRegistration };
