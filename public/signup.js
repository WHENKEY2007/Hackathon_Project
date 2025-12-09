// signup.js
document.getElementById('signup-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const fullname = document.getElementById('fullname').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const confirm = document.getElementById('confirm-password').value.trim();
  const err = document.getElementById('signup-error');
  const success = document.getElementById('signup-success');
  err.textContent = ''; success.textContent = '';

  if (!fullname || !email || !password || !confirm) { err.textContent = 'Please fill all fields.'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (password !== confirm) { err.textContent = 'Passwords do not match.'; return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { err.textContent = 'Enter a valid email.'; return; }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Sign up failed.'; return; }

    success.textContent = data.message || 'Sign up successful! Redirecting...';
    document.getElementById('signup-form').reset();
    setTimeout(() => window.location.href = '/index.html', 1800);
  } catch (e) {
    console.error(e);
    err.textContent = 'Connection error. Make sure server is running.';
  }
});

document.getElementById('google-signup').addEventListener('click', () => {
  alert('Google sign-up coming soon. Configure Supabase OAuth in server.');
});
