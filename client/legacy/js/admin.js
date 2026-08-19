document.getElementById('admin-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.getElementById('admin-message');
  message.textContent = 'Admin login will be connected when authentication APIs are added.';
});
