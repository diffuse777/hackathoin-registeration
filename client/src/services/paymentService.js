import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function createPaymentOrder(registrationId) {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_ORDERS, { registrationId });
  return unwrapApi(response);
}

export async function getPaymentStatus(registrationId) {
  const response = await httpClient.get(API_ENDPOINTS.PAYMENT_STATUS(registrationId));
  return unwrapApi(response);
}

export async function submitPaymentReference(registrationId, paymentReference) {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_REFERENCE(registrationId), {
    paymentReference,
  });
  return unwrapApi(response);
}

export async function completeMockPayment(registrationId, result = 'success') {
  const response = await httpClient.post(API_ENDPOINTS.PAYMENT_MOCK_COMPLETE, {
    registrationId,
    result,
  });
  return unwrapApi(response);
}
