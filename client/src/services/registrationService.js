import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function createRegistration(payload) {
  const response = await httpClient.post(API_ENDPOINTS.REGISTRATIONS, payload);
  return unwrapApi(response);
}
