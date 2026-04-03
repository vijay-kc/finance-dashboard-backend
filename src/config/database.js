const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create or connect to SQLite database
const db = new Database(path.join(__dirname, '../../database.sqlite'));

// Enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initializeDatabase = () => {

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'analyst', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Financial records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Seed default admin user
  const adminExists = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Super Admin', 'admin@finance.com', hashedPassword, 'admin', 'active');

    console.log('Default admin user created');
    console.log('Email: admin@finance.com');
    console.log('Password: Admin@123');
  }

  console.log('Database initialized successfully');
};

module.exports = { db, initializeDatabase };
