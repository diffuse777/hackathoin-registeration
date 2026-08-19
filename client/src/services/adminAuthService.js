import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function loginAdmin({ email, password }) {
  const response = await httpClient.post(API_ENDPOINTS.ADMIN_LOGIN, { email, password });
  return unwrapApi(response);
}

export async function logoutAdmin() {
  const response = await httpClient.post(API_ENDPOINTS.ADMIN_LOGOUT);
  return unwrapApi(response);
}

export async function getCurrentAdmin() {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_ME);
  return unwrapApi(response);
}
