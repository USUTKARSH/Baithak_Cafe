const form = document.querySelector('#admin-login-form');
const password = document.querySelector('#admin-password');
const error = document.querySelector('#login-error');
const next = new URLSearchParams(window.location.search).get('next') || '/admin.html';

form.addEventListener('submit', async event => {
  event.preventDefault();
  error.hidden = true;
  const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password.value }) });
  if (response.ok) { window.location.href = next; return; }
  error.textContent = response.status === 503 ? 'Admin authentication is not configured on the server.' : 'Incorrect password.';
  error.hidden = false;
  password.select();
});
