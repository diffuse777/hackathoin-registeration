import { HACKATHON, estimateRegistrationTotal, formatMoney } from '../constants/hackathon';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  REGISTER_NUMBER_PATTERN,
  BLOCKED_REGISTER_NUMBERS,
  BLOCKED_REGISTER_MESSAGE,
  STUDENT_TYPES,
} from '../constants/registration';

function createMemberId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createBlankMember() {
  return {
    id: createMemberId(),
    name: '',
    registerNumber: '',
    department: '',
    section: '',
    phone: '',
    email: '',
    studentType: STUDENT_TYPES.DAY_SCHOLAR,
    hostelName: '',
    roomNumber: '',
  };
}

export function resizeMembers(members, count) {
  const next = members.slice(0, count);
  while (next.length < count) {
    next.push(createBlankMember());
  }
  return next;
}

export function isHostelMember(studentType) {
  return studentType === STUDENT_TYPES.HOSTEL;
}

export function updateMemberField(member, field, value) {
  const next = { ...member, [field]: value };

  if (field === 'studentType' && value !== STUDENT_TYPES.HOSTEL) {
    next.hostelName = '';
    next.roomNumber = '';
  }

  if (field === 'phone') {
    next.phone = String(value).replace(/\D/g, '').slice(0, 10);
  }

  if (field === 'registerNumber' || field === 'section') {
    next[field] = String(value).toUpperCase();
  }

  return next;
}

export function toRegistrationPayload(teamName, members) {
  return {
    teamName: teamName.trim(),
    members: members.map((member) => {
      const item = {
        name: member.name.trim(),
        registerNumber: member.registerNumber.trim().toUpperCase(),
        department: member.department.trim(),
        section: member.section.trim().toUpperCase(),
        phone: member.phone.replace(/\s+/g, ''),
        email: member.email.trim().toLowerCase(),
        studentType: member.studentType,
      };

      if (isHostelMember(member.studentType)) {
        item.hostelName = member.hostelName.trim();
        item.roomNumber = member.roomNumber.trim();
      }

      return item;
    }),
  };
}

function requireLength(value, field, errors, { min, max, label }) {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    errors[field] = `${label} is required`;
    return;
  }

  if (trimmed.length < min) {
    errors[field] = `${label} is too short`;
  } else if (trimmed.length > max) {
    errors[field] = `${label} is too long`;
  }
}

export function validateTeamStep(teamName, memberCount) {
  const errors = {};
  const { minMembers, maxMembers } = HACKATHON.team;
  requireLength(teamName, 'teamName', errors, { min: 2, max: 80, label: 'Team name' });

  const count = Number(memberCount);
  if (!Number.isInteger(count) || count < minMembers || count > maxMembers) {
    errors.memberCount = `A team must have between ${minMembers} and ${maxMembers} participants`;
  }

  return errors;
}

export function validateRegistrationForm(teamName, members) {
  const errors = validateTeamStep(teamName, members.length);
  const { minMembers, maxMembers } = HACKATHON.team;

  if (members.length < minMembers || members.length > maxMembers) {
    errors.members = `A team must have between ${minMembers} and ${maxMembers} participants`;
  }

  const registerNumbers = new Set();
  const emails = new Set();

  members.forEach((member, index) => {
    const prefix = `members[${index}]`;

    requireLength(member.name, `${prefix}.name`, errors, { min: 2, max: 80, label: 'Name' });
    requireLength(member.registerNumber, `${prefix}.registerNumber`, errors, {
      min: 2,
      max: 30,
      label: 'Register number',
    });
    requireLength(member.department, `${prefix}.department`, errors, {
      min: 1,
      max: 80,
      label: 'Department',
    });
    requireLength(member.section, `${prefix}.section`, errors, { min: 1, max: 10, label: 'Section' });
    requireLength(member.phone, `${prefix}.phone`, errors, { min: 10, max: 10, label: 'Phone' });
    requireLength(member.email, `${prefix}.email`, errors, { min: 5, max: 120, label: 'Email' });

    const registerNumber = member.registerNumber.trim().toUpperCase();
    const phone = member.phone.replace(/\s+/g, '');
    const email = member.email.trim().toLowerCase();

    if (registerNumber && isBlockedRegisterNumber(registerNumber)) {
      errors[`${prefix}.registerNumber`] = BLOCKED_REGISTER_MESSAGE;
    } else if (registerNumber && !REGISTER_NUMBER_PATTERN.test(registerNumber)) {
      errors[`${prefix}.registerNumber`] = 'Register number format is invalid';
    }

    if (phone && !PHONE_PATTERN.test(phone)) {
      errors[`${prefix}.phone`] = 'Phone number must be a valid 10-digit Indian mobile number';
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      errors[`${prefix}.email`] = 'Email format is invalid';
    }

    if (registerNumber) {
      if (registerNumbers.has(registerNumber)) {
        errors[`${prefix}.registerNumber`] = 'Duplicate register numbers are not allowed';
      }
      registerNumbers.add(registerNumber);
    }

    if (email) {
      if (emails.has(email)) {
        errors[`${prefix}.email`] = 'Duplicate emails are not allowed';
      }
      emails.add(email);
    }

    if (isHostelMember(member.studentType)) {
      requireLength(member.hostelName, `${prefix}.hostelName`, errors, {
        min: 1,
        max: 80,
        label: 'Hostel name',
      });
      requireLength(member.roomNumber, `${prefix}.roomNumber`, errors, {
        min: 1,
        max: 20,
        label: 'Room number',
      });
    }
  });

  return errors;
}

export function fieldErrorsFromApi(details) {
  if (!Array.isArray(details)) {
    return {};
  }

  return details.reduce((errors, item) => {
    if (item?.field && item?.message) {
      errors[item.field] = item.message;
    }
    return errors;
  }, {});
}

export function formatEstimatedTotal(memberCount) {
  return formatMoney(estimateRegistrationTotal(memberCount));
}

export function studentTypeLabel(studentType) {
  return studentType === STUDENT_TYPES.HOSTEL ? 'Hostel' : 'Day scholar';
}

function normalizeRegisterNumberKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s/_-]+/g, '');
}

export function isBlockedRegisterNumber(value) {
  const key = normalizeRegisterNumberKey(value);
  if (!key) {
    return false;
  }

  return BLOCKED_REGISTER_NUMBERS.some((blocked) => normalizeRegisterNumberKey(blocked) === key);
}

export function findBlockedRegisterIndex(members) {
  return members.findIndex((member) => isBlockedRegisterNumber(member.registerNumber));
}

export { BLOCKED_REGISTER_MESSAGE };
