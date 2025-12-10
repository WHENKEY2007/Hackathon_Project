const Database = require('better-sqlite3');
// Use a persistent file-based database
const db = new Database('hackathon.db');

// Enable WAL for better concurrency
db.pragma('journal_mode = WAL');

// Users Table
// skills will be stored as JSON string "['react', 'node']"
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    university TEXT,
    skills TEXT, 
    role TEXT DEFAULT 'user'
  )
`);

// Hackathons Table
db.exec(`
  CREATE TABLE IF NOT EXISTS hackathons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    team_size INTEGER,
    created_by_user_id INTEGER,
    type TEXT, 
    url TEXT,
    FOREIGN KEY(created_by_user_id) REFERENCES users(id)
  )
`);

// Join Requests Table
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hackathon_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hackathon_id) REFERENCES hackathons(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(hackathon_id, user_id)
  )
`);

console.log('Database initialized successfully.');

module.exports = db;
