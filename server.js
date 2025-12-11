require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'super_secret_key';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, university, skills, profile_photo } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const skillsString = Array.isArray(skills) ? skills.join(',') : skills;

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
        return res.status(500).json({ error: 'User already exists or database error.' });
    }

    const { error } = await supabase.from('users').insert([
        { name, email, password: hashedPassword, university, skills: skillsString }
    ]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'User registered successfully!' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

    if (error || !user) return res.status(404).json({ error: 'User not found.' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });


    res.json({ token, user: { id: user.id, name: user.name, email: user.email, profile_photo: user.profile_photo } });
});

// Multer setup for file uploads (memory storage)
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Update Profile
app.put('/api/auth/profile', upload.single('profile_photo'), async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, university, skills } = req.body;
        let { profile_photo } = req.body;
        const skillsString = Array.isArray(skills) ? skills.join(',') : skills;

        // Handle File Upload
        if (req.file) {
            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${decoded.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error: uploadError } = await supabase
                .storage
                .from('profile-photos')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype
                });

            if (uploadError) return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            profile_photo = publicUrl;
        }

        const { data, error } = await supabase
            .from('users')
            .update({ name, university, skills: skillsString, profile_photo })
            .eq('id', decoded.id)
            .select('id, name, email, university, skills, profile_photo')
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: 'Unauthorized or invalid request' });
    }
});

// Get Current User (Me)
app.get('/api/auth/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, university, skills, profile_photo')
            .eq('id', decoded.id)
            .single();

        if (error || !user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to authenticate token' });
    }
});

// --- Hackathon Routes ---

// Get All Hackathons
app.get('/api/hackathons', async (req, res) => {
    const { data, error } = await supabase.from('hackathons').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Create Hackathon
app.post('/api/hackathons', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Get user name
        const { data: user, error: userError } = await supabase.from('users').select('name').eq('id', decoded.id).single();
        if (userError) return res.status(401).json({ error: 'Unauthorized' });

        const { title, description, start_date, max_team_size, type, url } = req.body;

        const { data, error } = await supabase.from('hackathons').insert([
            { title, description, start_date, max_team_size, type, url, created_by_user_id: decoded.id, organizer_name: user.name }
        ]).select();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ id: data[0].id });

    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

// Get Single Hackathon Details
app.get('/api/hackathons/:id', async (req, res) => {
    const { data, error } = await supabase.from('hackathons').select('*').eq('id', req.params.id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- Team Routes ---

// Get Teams for a Hackathon
app.get('/api/hackathons/:id/teams', async (req, res) => {
    // We need to fetch teams, their leaders, and their approved members
    // Supabase standard client can do deep Selects
    // Relation names depend on how FKs are set up. Assuming 'users' referenced by 'leader_id'

    // Attempting a relational query. If strict FKs are not set or named differently, this might fail slightly,
    // but we requested FKs in the plan.
    // 'leader:users!leader_id' means join users table via leader_id column and alias as leader.

    const { data: teams, error } = await supabase
        .from('teams')
        .select(`
            *,
            leader:users!leader_id (name, email),
            requests (
                status,
                user:users (name)
            )
        `)
        .eq('hackathon_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    // Format the response to match the previous structure
    // We filter requests to only 'approved' ones to count members and list names
    const formattedTeams = teams.map(team => {
        const approvedRequests = team.requests ? team.requests.filter(r => r.status === 'approved') : [];
        const memberNames = approvedRequests.map(r => r.user?.name).filter(Boolean).join(',');

        return {
            ...team,
            leader_name: team.leader?.name,
            leader_email: team.leader?.email,
            current_members: approvedRequests.length, // Leader is usually added as a member in requests too
            member_names: memberNames
        };
    });

    res.json(formattedTeams);
});

// Create Team
app.post('/api/hackathons/:id/teams', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const { name, description, needed_skills } = req.body;
        const skillsString = Array.isArray(needed_skills) ? needed_skills.join(',') : needed_skills;

        // Insert team
        const { data: teamData, error: teamError } = await supabase.from('teams').insert([
            { name, hackathon_id: req.params.id, leader_id: decoded.id, description, needed_skills: skillsString }
        ]).select();

        if (teamError) return res.status(500).json({ error: teamError.message });

        const teamId = teamData[0].id;

        // Auto-add leader as member (approved)
        const { error: reqError } = await supabase.from('requests').insert([
            { team_id: teamId, user_id: decoded.id, status: 'approved' }
        ]);

        if (reqError) console.error("Failed to add leader to team members", reqError);

        res.json({ id: teamId });

    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

// Join Team Request
app.post('/api/teams/:id/join', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Check if already requested
        const { data: existing } = await supabase.from('requests')
            .select('*')
            .eq('team_id', req.params.id)
            .eq('user_id', decoded.id)
            .single();

        if (existing) return res.status(400).json({ error: 'Request already sent' });

        const { error } = await supabase.from('requests').insert([
            { team_id: req.params.id, user_id: decoded.id, status: 'pending' }
        ]);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Request sent' });

    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

// Get Requests for a Team
app.get('/api/teams/:id/requests', async (req, res) => {
    const { data: requests, error } = await supabase
        .from('requests')
        .select(`
            id, status, user_id,
            user:users (name, email, university, skills)
        `)
        .eq('team_id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    const formattedRequests = requests.map(r => ({
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        user_name: r.user?.name,
        user_email: r.user?.email,
        user_university: r.user?.university,
        user_skills: r.user?.skills ? r.user.skills.split(',') : []
    }));

    res.json(formattedRequests);
});

// Approve/Reject Request
app.put('/api/teams/:id/requests/:requestId', async (req, res) => {
    const { status, rejection_reason } = req.body;

    const { error } = await supabase
        .from('requests')
        .update({ status, rejection_reason: status === 'rejected' ? rejection_reason : null })
        .eq('id', req.params.requestId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Status updated' });
});

// Edit Team
app.put('/api/teams/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { name, description, needed_skills } = req.body;
        const skillsString = Array.isArray(needed_skills) ? needed_skills.join(',') : needed_skills;

        // Verify ownership
        const { data: team } = await supabase.from('teams').select('leader_id').eq('id', req.params.id).single();
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.leader_id !== decoded.id) return res.status(403).json({ error: 'Only the leader can edit the team' });

        const { error } = await supabase
            .from('teams')
            .update({ name, description, needed_skills: skillsString })
            .eq('id', req.params.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Team updated' });
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

// Delete Team
app.delete('/api/teams/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Verify ownership
        const { data: team } = await supabase.from('teams').select('leader_id').eq('id', req.params.id).single();
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.leader_id !== decoded.id) return res.status(403).json({ error: 'Only the leader can delete the team' });

        // Delete requests first (though Cascade might handle it if set up in DB, explicit is safer here if unsure)
        await supabase.from('requests').delete().eq('team_id', req.params.id);

        const { error } = await supabase.from('teams').delete().eq('id', req.params.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Team deleted' });
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});