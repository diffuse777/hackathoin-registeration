const params = new URLSearchParams(window.location.search);
const status = params.get('status') || 'PAID';
const amount = params.get('amount') || '';
const teamName = params.get('team') || 'Your team';
const paid = status === 'PAID';

document.getElementById('done-kicker').textContent = paid ? 'Payment verified' : 'Payment failed';
document.getElementById('done-title').textContent = paid ? 'You’re in.' : 'Payment did not go through.';
document.getElementById('done-body').textContent = paid
  ? `${teamName} is registered. The server verified ₹${amount} and marked the team as PAID.`
  : 'The backend recorded a failed payment. You can start a new registration from the home page.';
