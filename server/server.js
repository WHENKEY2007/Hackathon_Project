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

// --- Q&A API Endpoints ---

// GET /api/questions
app.get('/api/questions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/questions
app.post('/api/questions', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { title, body, author } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        title,
        body,
        author: author || 'Anonymous',
        tags: req.body.tags || []
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// POST /api/answers
app.post('/api/answers', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { question_id, body, author } = req.body;

  if (!question_id || !body) {
    return res.status(400).json({ error: 'Question ID and body are required' });
  }

  try {
    const { data, error } = await supabase
      .from('answers')
      .insert([{
        question_id,
        body,
        author: author || 'Anonymous'
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error creating answer:', err);
    res.status(500).json({ error: 'Failed to create answer' });
  }
});

// POST /api/questions/:id/vote
app.post('/api/questions/:id/vote', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { id } = req.params;
  const { upvotes } = req.body;

  if (typeof upvotes !== 'number') {
    return res.status(400).json({ error: 'Upvotes count required' });
  }

  try {
    const { error } = await supabase
      .from('questions')
      .update({ upvotes })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating vote:', err);
    res.status(500).json({ error: 'Failed to update vote' });
  }
});

// --- Profile API Endpoints ---

// GET /api/profiles/:id
app.get('/api/profiles/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      throw error;
    }

    // If no profile exists, return empty object or 404. 
    // Returning null/empty is fine, client will handle "create profile" state.
    res.json(data || {});
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/profiles/:id (Upsert)
app.post('/api/profiles/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured.' });
  const { id } = req.params;
  const { full_name, bio, skills, social_links } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id,
        full_name,
        bio,
        skills,
        achievements: req.body.achievements,
        social_links,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
