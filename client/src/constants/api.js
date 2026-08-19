const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredBaseUrl || typeof configuredBaseUrl !== 'string') {
  throw new Error('VITE_API_BASE_URL is missing. Set it in client/.env');
}

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

export const API_ENDPOINTS = Object.freeze({
  HEALTH: '/health',
  REGISTRATIONS: '/registrations',
  PAYMENT_ORDERS: '/payments/orders',
  PAYMENT_STATUS: (registrationId) => `/payments/${registrationId}/status`,
  PAYMENT_REFERENCE: (registrationId) => `/payments/${registrationId}/reference`,
  ADMIN_LOGIN: '/admin/auth/login',
  ADMIN_LOGOUT: '/admin/auth/logout',
  ADMIN_ME: '/admin/auth/me',
  ADMIN_REGISTRATIONS: '/admin/registrations',
  ADMIN_REGISTRATION: (id) => `/admin/registrations/${id}`,
  ADMIN_REGISTRATIONS_SUMMARY: '/admin/registrations/summary',
  ADMIN_EXPORT_CSV: '/admin/registrations/export/csv',
  ADMIN_EXPORT_PDF: '/admin/registrations/export/pdf',
  ADMIN_HEALTH: '/admin/health',
  PAYMENT_MOCK_COMPLETE: '/payments/mock/complete',
});

export const API_ERROR_CODES = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  DUPLICATE_PARTICIPANT: 'DUPLICATE_PARTICIPANT',
  BLOCKED_REGISTER_NUMBER: 'BLOCKED_REGISTER_NUMBER',
});
