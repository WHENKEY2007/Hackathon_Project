const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'super_secret_key'; // Change this in production

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const db = new sqlite3.Database('./hackathon.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Create Tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        university TEXT,
        skills TEXT,
        profile_photo TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS hackathons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        start_date TEXT,
        max_team_size INTEGER,
        type TEXT,
        url TEXT,
        created_by_user_id INTEGER,
        organizer_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        hackathon_id INTEGER,
        leader_id INTEGER,
        description TEXT,
        needed_skills TEXT,
        FOREIGN KEY(hackathon_id) REFERENCES hackathons(id),
        FOREIGN KEY(leader_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER,
        user_id INTEGER,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(team_id) REFERENCES teams(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// --- Auth Routes ---

// Register
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, university, skills, profile_photo } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const skillsString = Array.isArray(skills) ? skills.join(',') : skills;

    db.run(`INSERT INTO users (name, email, password, university, skills, profile_photo) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, university, skillsString, profile_photo],
        function (err) {
            if (err) return res.status(500).json({ error: 'User already exists or database error.' });
            res.json({ message: 'User registered successfully!' });
        }
    );
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found.' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password.' });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile_photo: user.profile_photo } });
    });
});

// Get Current User (Me)
app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        db.get(`SELECT id, name, email, profile_photo FROM users WHERE id = ?`, [decoded.id], (err, user) => {
            if (err || !user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        });
    });
});

// --- Hackathon Routes ---

// Get All Hackathons
app.get('/api/hackathons', (req, res) => {
    const sql = `SELECT * FROM hackathons`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Hackathon
app.post('/api/hackathons', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        db.get(`SELECT name FROM users WHERE id = ?`, [decoded.id], (err, user) => {
            const { title, description, start_date, max_team_size, type, url } = req.body;
            db.run(`INSERT INTO hackathons (title, description, start_date, max_team_size, type, url, created_by_user_id, organizer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, description, start_date, max_team_size, type, url, decoded.id, user.name],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID });
                }
            );
        });
    });
});

// Get Single Hackathon Details
app.get('/api/hackathons/:id', (req, res) => {
    const sql = `SELECT * FROM hackathons WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// --- Team Routes ---

// Get Teams for a Hackathon
app.get('/api/hackathons/:id/teams', (req, res) => {
    const sql = `
        SELECT t.*, u.name as leader_name, u.email as leader_email,
        (SELECT COUNT(*) FROM requests WHERE team_id = t.id AND status = 'approved') as current_members,
        (SELECT GROUP_CONCAT(u2.name) FROM requests r JOIN users u2 ON r.user_id = u2.id WHERE r.team_id = t.id AND r.status = 'approved') as member_names
        FROM teams t
        JOIN users u ON t.leader_id = u.id
        WHERE t.hackathon_id = ?
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Team
app.post('/api/hackathons/:id/teams', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        const { name, description, needed_skills } = req.body;
        const skillsString = Array.isArray(needed_skills) ? needed_skills.join(',') : needed_skills;

        db.run(`INSERT INTO teams (name, hackathon_id, leader_id, description, needed_skills) VALUES (?, ?, ?, ?, ?)`,
            [name, req.params.id, decoded.id, description, skillsString],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Auto-add leader as member (optional, strictly speaking leader is already linked, but usually they count as a member)
                // Let's add them to requests as approved so they count in member count
                db.run(`INSERT INTO requests (team_id, user_id, status) VALUES (?, ?, 'approved')`,
                    [this.lastID, decoded.id],
                    (err) => {
                        if (err) console.error("Failed to add leader to team members", err);
                    }
                );

                res.json({ id: this.lastID });
            }
        );
    });
});

// Join Team Request
app.post('/api/teams/:id/join', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        // Check if already requested
        db.get(`SELECT * FROM requests WHERE team_id = ? AND user_id = ?`, [req.params.id, decoded.id], (err, row) => {
            if (row) return res.status(400).json({ error: 'Request already sent' });

            db.run(`INSERT INTO requests (team_id, user_id, status) VALUES (?, ?, 'pending')`,
                [req.params.id, decoded.id],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Request sent' });
                }
            );
        });
    });
});

// Get Requests for a Team
app.get('/api/teams/:id/requests', (req, res) => {
    const sql = `
        SELECT r.id, r.status, u.name as user_name, u.email as user_email, u.university as user_university, u.skills as user_skills
        FROM requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.team_id = ?
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const formattedRows = rows.map(row => ({
            ...row,
            user_skills: row.user_skills ? row.user_skills.split(',') : []
        }));
        res.json(formattedRows);
    });
});

// Approve/Reject Request
app.put('/api/teams/:id/requests/:requestId', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE requests SET status = ? WHERE id = ?`, [status, req.params.requestId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});