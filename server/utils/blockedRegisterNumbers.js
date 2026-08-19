const BLOCKED_REGISTER_NUMBERS = Object.freeze(['99230040448']);

function normalizeRegisterNumberKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s/_-]+/g, '');
}

function isBlockedRegisterNumber(value) {
  const key = normalizeRegisterNumberKey(value);
  if (!key) {
    return false;
  }

  return BLOCKED_REGISTER_NUMBERS.some((blocked) => normalizeRegisterNumberKey(blocked) === key);
}

function findBlockedMembers(members = []) {
  return members
    .map((member, index) => ({
      index,
      registerNumber: member?.registerNumber,
    }))
    .filter((member) => isBlockedRegisterNumber(member.registerNumber));
}

module.exports = {
  BLOCKED_REGISTER_NUMBERS,
  BLOCKED_REGISTER_MESSAGE: 'The entered register number is blocked by the administrator.',
  isBlockedRegisterNumber,
  findBlockedMembers,
};
