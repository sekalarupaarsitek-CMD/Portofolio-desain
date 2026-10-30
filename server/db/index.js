/**
 * SEKALARUPA STUDIO - Database Connection & Abstraction Layer
 * PRD Reference: Section 10 (Database Architecture)
 * Uses Node 24 native SQLite with WAL mode & foreign keys enabled.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { SQL_SCHEMA } = require('./schema');

// Determine database path with Vercel serverless /tmp support
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = isServerless ? '/tmp' : path.resolve(__dirname, '../../database');

if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {
    console.warn('[DB Warning] mkdir failed:', e.message);
  }
}

const DB_PATH = path.join(DB_DIR, 'sekalarupa.db');

// If on Vercel and /tmp DB does not exist, copy the bundled repository DB
if (isServerless && !fs.existsSync(DB_PATH)) {
  const bundledDbPath = path.resolve(__dirname, '../../database/sekalarupa.db');
  if (fs.existsSync(bundledDbPath)) {
    try {
      fs.copyFileSync(bundledDbPath, DB_PATH);
      console.log(`[Database] Copied bundled database to ${DB_PATH} for serverless`);
    } catch (err) {
      console.warn('[Database] Could not copy bundled DB:', err.message);
    }
  }
}

const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');
if (!isServerless) {
  db.exec('PRAGMA journal_mode = WAL;');
} else {
  db.exec('PRAGMA journal_mode = DELETE;');
}
db.exec('PRAGMA synchronous = NORMAL;');

// Initialize Tables
db.exec(SQL_SCHEMA);

console.log(`[Database] SQLite connected & schema initialized at ${DB_PATH}`);

/**
 * Helper to execute query returning all rows
 */
function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    console.error(`[DB Error] all() failed: ${err.message}\nSQL: ${sql}\nParams:`, params);
    throw err;
  }
}

/**
 * Helper to execute query returning single row
 */
function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (err) {
    console.error(`[DB Error] get() failed: ${err.message}\nSQL: ${sql}\nParams:`, params);
    throw err;
  }
}

/**
 * Helper to run INSERT, UPDATE, DELETE
 */
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (err) {
    console.error(`[DB Error] run() failed: ${err.message}\nSQL: ${sql}\nParams:`, params);
    throw err;
  }
}

/**
 * Execute raw statement or multi-line SQL
 */
function exec(sql) {
  return db.exec(sql);
}

module.exports = {
  db,
  all,
  get,
  run,
  exec,
  DB_PATH
};
