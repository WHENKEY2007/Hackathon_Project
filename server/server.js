// server/server.js
const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
// Load env from project root regardless of where the server is started
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5500;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase credentials missing. Check your .env file.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password) return res.status(400).json({ error: 'fullname, email and password required.' });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullname } }
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Sign up successful. Check your email to confirm (if required).', user: data.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    // NOTE: This returns session info in data. For production, set secure cookie or JWT handling.
    return res.json({ user: data.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
