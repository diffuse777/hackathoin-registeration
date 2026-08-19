const { escapeRegexQuery } = require('../validators/adminRegistrationValidator');

function caseInsensitiveExact(value) {
  return {
    $regex: `^${escapeRegexQuery(value)}$`,
    $options: 'i',
  };
}

function buildAdminFilter({ search, paymentStatus, studentType, hostelName, department }) {
  const filter = {};

  if (paymentStatus && paymentStatus !== 'ALL') {
    filter.paymentStatus = paymentStatus;
  }

  if (studentType && studentType !== 'ALL') {
    filter['members.studentType'] = studentType;
  }

  if (hostelName) {
    filter['members.hostelName'] = caseInsensitiveExact(hostelName);
  }

  if (department) {
    filter['members.department'] = caseInsensitiveExact(department);
  }

  if (search) {
    const pattern = escapeRegexQuery(search);
    filter.$or = [
      { teamName: { $regex: pattern, $options: 'i' } },
      { 'members.name': { $regex: pattern, $options: 'i' } },
      { 'members.registerNumber': { $regex: pattern, $options: 'i' } },
      { 'members.email': { $regex: pattern, $options: 'i' } },
      { 'members.phone': { $regex: pattern, $options: 'i' } },
    ];
  }

  return filter;
}

function buildParticipantMatch({ studentType, hostelName, department }) {
  const match = {};

  if (studentType && studentType !== 'ALL') {
    match['members.studentType'] = studentType;
  }

  if (hostelName) {
    match['members.hostelName'] = caseInsensitiveExact(hostelName);
  }

  if (department) {
    match['members.department'] = caseInsensitiveExact(department);
  }

  return match;
}

function equalsIgnoreCase(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
}

function memberMatchesParticipantFilters(member, { studentType, hostelName, department } = {}) {
  if (studentType && studentType !== 'ALL' && member.studentType !== studentType) {
    return false;
  }

  if (hostelName && !equalsIgnoreCase(member.hostelName, hostelName)) {
    return false;
  }

  if (department && !equalsIgnoreCase(member.department, department)) {
    return false;
  }

  return true;
}

function filterParticipants(members, parsed) {
  return (members || []).filter((member) => memberMatchesParticipantFilters(member, parsed));
}

function describeAppliedFilters({
  paymentStatus = 'ALL',
  studentType = 'ALL',
  hostelName = '',
  department = '',
  search = '',
} = {}) {
  return [
    `Payment Status: ${paymentStatus || 'ALL'}`,
    `Student Type: ${studentType || 'ALL'}`,
    `Hostel: ${hostelName || 'ALL'}`,
    `Department: ${department || 'ALL'}`,
    `Search: ${search || 'ALL'}`,
  ];
}

module.exports = {
  buildAdminFilter,
  buildParticipantMatch,
  filterParticipants,
  describeAppliedFilters,
};
