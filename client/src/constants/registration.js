export const STUDENT_TYPES = Object.freeze({
  DAY_SCHOLAR: 'DAY_SCHOLAR',
  HOSTEL: 'HOSTEL',
});

export const STUDENT_TYPE_OPTIONS = Object.freeze([
  { value: STUDENT_TYPES.DAY_SCHOLAR, label: 'Day scholar' },
  { value: STUDENT_TYPES.HOSTEL, label: 'Hostel' },
]);

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
});

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[6-9]\d{9}$/;
export const REGISTER_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9/_-]{1,29}$/;
export const BLOCKED_REGISTER_NUMBERS = Object.freeze(['99230040448']);
export const BLOCKED_REGISTER_MESSAGE =
  'The entered register number is blocked by the administrator.';
