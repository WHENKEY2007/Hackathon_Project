const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get All Hackathons
router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`
      SELECT h.*, u.name as organizer_name,
      (SELECT COUNT(*) FROM requests WHERE hackathon_id = h.id AND status = 'approved') as current_members
      FROM hackathons h
      JOIN users u ON h.created_by_user_id = u.id
      ORDER BY h.start_date ASC
    `);
        const hackathons = stmt.all();
        res.json(hackathons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Single Hackathon by ID (Public)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare(`
      SELECT h.*, u.name as organizer_name,
      (SELECT COUNT(*) FROM requests WHERE hackathon_id = h.id AND status = 'approved') as current_members
      FROM hackathons h
      JOIN users u ON h.created_by_user_id = u.id
      WHERE h.id = ?
    `);
        const hackathon = stmt.get(id);

        if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

        res.json(hackathon);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Hackathon (Protected)
router.post('/', authenticateToken, (req, res) => {
    const { title, description, start_date, team_size, type, url } = req.body;

    if (!title || !start_date || !team_size) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO hackathons (title, description, start_date, team_size, created_by_user_id, type, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        const info = stmt.run(title, description, start_date, team_size, req.user.id, type, url);
        res.status(201).json({ message: 'Hackathon created', id: info.lastInsertRowid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Join Hackathon (Protected)
router.post('/:id/join', authenticateToken, (req, res) => {
    const hackathonId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if hackathon exists and is not full (optional logic)
        // Check if user already requested
        const checkStmt = db.prepare('SELECT * FROM requests WHERE hackathon_id = ? AND user_id = ?');
        const existing = checkStmt.get(hackathonId, userId);

        if (existing) {
            return res.status(400).json({ error: 'Request already sent' });
        }

        const stmt = db.prepare(`
      INSERT INTO requests (hackathon_id, user_id, status)
      VALUES (?, ?, 'pending')
    `);
        stmt.run(hackathonId, userId);

        // TODO: Send email to leader here

        res.status(201).json({ message: 'Join request sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Requests for a Hackathon (Leader Only)
router.get('/:id/requests', authenticateToken, (req, res) => {
    const hackathonId = req.params.id;

    try {
        // Check ownership
        const hackathon = db.prepare('SELECT created_by_user_id FROM hackathons WHERE id = ?').get(hackathonId);
        if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

        if (hackathon.created_by_user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const stmt = db.prepare(`
        SELECT r.*, u.name as user_name, u.email as user_email, u.skills as user_skills, u.university as user_university 
        FROM requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.hackathon_id = ?
    `);

        const requests = stmt.all(hackathonId);

        // Parse skills
        const parsedRequests = requests.map(r => ({
            ...r,
            user_skills: r.user_skills ? JSON.parse(r.user_skills) : []
        }));

        res.json(parsedRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Approve/Reject Request (Leader Only)
router.put('/:id/requests/:requestId', authenticateToken, (req, res) => {
    const { id, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Check ownership
        const hackathon = db.prepare('SELECT created_by_user_id FROM hackathons WHERE id = ?').get(id);
        if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

        if (hackathon.created_by_user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const stmt = db.prepare('UPDATE requests SET status = ? WHERE id = ? AND hackathon_id = ?');
        const result = stmt.run(status, requestId, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: `Request ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
