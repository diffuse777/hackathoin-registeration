import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { normalizeApiError } from '../utils/apiError';
import { getAdminToken } from '../utils/authStorage';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export function unwrapApi(response) {
  const body = response?.data || {};

  return {
    success: Boolean(body.success),
    message: body.message || '',
    data: body.data ?? {},
  };
}
