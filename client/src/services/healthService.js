import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function getHealth() {
  const response = await httpClient.get(API_ENDPOINTS.HEALTH);
  return unwrapApi(response);
}
