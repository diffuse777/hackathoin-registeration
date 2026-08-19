import { API_ENDPOINTS } from '../constants/api';
import { httpClient, unwrapApi } from './httpClient';

export async function getAdminHealth() {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_HEALTH);
  return unwrapApi(response);
}

export async function listRegistrations(params) {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_REGISTRATIONS, { params });
  return unwrapApi(response);
}

export async function getRegistrationSummary(params) {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_REGISTRATIONS_SUMMARY, { params });
  return unwrapApi(response);
}

export async function getRegistrationById(id) {
  const response = await httpClient.get(API_ENDPOINTS.ADMIN_REGISTRATION(id));
  return unwrapApi(response);
}

export async function deleteRegistration(id) {
  const response = await httpClient.delete(API_ENDPOINTS.ADMIN_REGISTRATION(id));
  return unwrapApi(response);
}

async function downloadExport(url, params, fallbackName) {
  const response = await httpClient.get(url, {
    params,
    responseType: 'blob',
    timeout: 60000,
  });

  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    const payload = JSON.parse(text);
    throw new Error(payload.message || 'Export failed. Please try again.');
  }

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackName;
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportRegistrationsCsv(params) {
  await downloadExport(API_ENDPOINTS.ADMIN_EXPORT_CSV, params, 'registrations.csv');
}

export async function exportRegistrationsPdf(params) {
  await downloadExport(API_ENDPOINTS.ADMIN_EXPORT_PDF, params, 'registrations.pdf');
}
