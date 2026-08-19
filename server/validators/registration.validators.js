const {
  STUDENT_TYPES,
  MIN_TEAM_MEMBERS,
  MAX_TEAM_MEMBERS,
} = require('../utils/constants');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const REGISTER_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9/_-]{1,29}$/;

function normalizeStudentType(value) {
  if (value == null) {
    return value;
  }

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function isHostelStudent(studentType) {
  return normalizeStudentType(studentType) === STUDENT_TYPES.HOSTEL;
}

function isDayScholar(studentType) {
  return normalizeStudentType(studentType) === STUDENT_TYPES.DAY_SCHOLAR;
}

function isBlank(value) {
  return value == null || String(value).trim() === '';
}

function memberCountMatchesMembers(memberCount, members) {
  return Array.isArray(members) && memberCount === members.length;
}

function isValidTeamSize(count) {
  return Number.isInteger(count) && count >= MIN_TEAM_MEMBERS && count <= MAX_TEAM_MEMBERS;
}

function hasUniqueNormalizedValues(values) {
  const normalized = values
    .filter((value) => value != null && String(value).trim() !== '')
    .map((value) => String(value).trim().toLowerCase());

  return new Set(normalized).size === normalized.length;
}

function membersHaveUniqueRegisterNumbers(members) {
  if (!Array.isArray(members)) {
    return false;
  }

  return hasUniqueNormalizedValues(members.map((member) => member.registerNumber));
}

function membersHaveUniqueEmails(members) {
  if (!Array.isArray(members)) {
    return false;
  }

  return hasUniqueNormalizedValues(members.map((member) => member.email));
}

module.exports = {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  REGISTER_NUMBER_PATTERN,
  normalizeStudentType,
  isHostelStudent,
  isDayScholar,
  isBlank,
  memberCountMatchesMembers,
  isValidTeamSize,
  membersHaveUniqueRegisterNumbers,
  membersHaveUniqueEmails,
};
