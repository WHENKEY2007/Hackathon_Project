const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { email, password, name, university, skills } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const skillsJson = JSON.stringify(skills || []);

        const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, university, skills)
      VALUES (?, ?, ?, ?, ?)
    `);

        // SQLite errors are thrown synchronously
        const info = stmt.run(email, hashedPassword, name, university, skillsJson);

        // Auto-login after register? Or just return success.
        res.status(201).json({ message: 'User created successfully', userId: info.lastInsertRowid });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Me (Protected)
router.get('/me', authenticateToken, (req, res) => {
    // Check db again to ensure user still exists or get latest data
    const stmt = db.prepare('SELECT id, name, email, university, skills, role FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);

    if (!user) return res.sendStatus(404);

    // Parse skills back to array
    if (user.skills) {
        try {
            user.skills = JSON.parse(user.skills);
        } catch (e) {
            user.skills = [];
        }
    }

    res.json(user);
});

module.exports = router;
