import { API_ERROR_CODES } from '../constants/api';

export class ApiError extends Error {
  constructor({ message, code = API_ERROR_CODES.INTERNAL_ERROR, status = 500, details, cause } = {}) {
    super(message || 'Something went wrong');
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiError({
      message: 'The request timed out. Please try again.',
      code: API_ERROR_CODES.TIMEOUT,
      status: 408,
      cause: error,
    });
  }

  if (!error?.response) {
    return new ApiError({
      message: 'Unable to reach the server. Check your connection and try again.',
      code: API_ERROR_CODES.NETWORK,
      status: 0,
      cause: error,
    });
  }

  const payload = error.response.data || {};
  const status = error.response.status;

  if (typeof Blob !== 'undefined' && payload instanceof Blob) {
    return new ApiError({
      message: 'Request failed',
      status,
      cause: error,
    });
  }

  const code = payload.error?.code || API_ERROR_CODES.INTERNAL_ERROR;
  const message = payload.message || 'Request failed';

  return new ApiError({
    message,
    code,
    status,
    details: payload.error?.details,
    cause: error,
  });
}

export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong';
}
