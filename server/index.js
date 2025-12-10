require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const hackathonRoutes = require('./routes/hackathons');

app.use('/api/auth', authRoutes);
app.use('/api/hackathons', hackathonRoutes);

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Hackathon Team Finder API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
