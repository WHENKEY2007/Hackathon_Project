// login.js
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const err = document.getElementById('login-error');
  err.textContent = '';

  if (!email || !password) { err.textContent = 'Please enter both email and password.'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || 'Login failed.';
      return;
    }

    // Demo: redirect to dashboard after success
    window.location.href = '/dashboard.html';
  } catch (e) {
    console.error(e);
    err.textContent = 'Connection error. Make sure server is running.';
  }
});

// Google buttons: placeholders (actual OAuth handled server-side)
document.getElementById('google-signin').addEventListener('click', () => {
  alert('Google sign-in coming soon. Configure Supabase OAuth in server.');
});
