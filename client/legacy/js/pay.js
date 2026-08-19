const params = new URLSearchParams(window.location.search);
const registrationId = params.get('id');
const payError = document.getElementById('pay-error');
const mockActions = document.getElementById('mock-actions');
let pollTimer = null;

function setError(message) {
  payError.hidden = !message;
  payError.textContent = message || '';
}

function goToDone(status, amount, teamName) {
  const query = new URLSearchParams({
    status,
    amount: String(amount || ''),
    team: teamName || '',
  });
  window.location.href = `/done?${query.toString()}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.message || 'Request failed');
  }
  return json;
}

async function loadOrder() {
  if (!registrationId) {
    window.location.href = '/register';
    return;
  }

  const order = await api('/api/payments/orders', {
    method: 'POST',
    body: JSON.stringify({ registrationId }),
  });
  const data = order.data;

  document.getElementById('qr-image').src = data.paymentRequest?.qrImageDataUrl || '';
  document.getElementById('qr-amount').textContent = `₹${data.amount}`;
  document.getElementById('pay-status').textContent = data.paymentStatus;
  document.getElementById('pay-team').textContent =
    `${data.teamName} · ${data.memberCount} participant${data.memberCount === 1 ? '' : 's'}`;
  mockActions.hidden = data.paymentRequest?.provider !== 'mock';

  if (data.paymentStatus === 'PAID' || data.paymentStatus === 'FAILED') {
    goToDone(data.paymentStatus, data.amount, data.teamName);
    return;
  }

  pollTimer = setInterval(async () => {
    try {
      const status = await api(`/api/payments/${registrationId}/status`);
      document.getElementById('pay-status').textContent = status.data.paymentStatus;
      if (status.data.paymentStatus === 'PAID' || status.data.paymentStatus === 'FAILED') {
        clearInterval(pollTimer);
        goToDone(status.data.paymentStatus, status.data.amount, status.data.teamName);
      }
    } catch {
      /* keep polling */
    }
  }, 2500);
}

async function simulate(result) {
  setError('');
  try {
    await api('/api/payments/mock/complete', {
      method: 'POST',
      body: JSON.stringify({ registrationId, result }),
    });
    const status = await api(`/api/payments/${registrationId}/status`);
    goToDone(status.data.paymentStatus, status.data.amount, status.data.teamName);
  } catch (error) {
    setError(error.message);
  }
}

document.getElementById('mock-pay').addEventListener('click', () => simulate('captured'));
document.getElementById('mock-fail').addEventListener('click', () => simulate('failed'));

loadOrder().catch((error) => {
  setError(error.message);
});
