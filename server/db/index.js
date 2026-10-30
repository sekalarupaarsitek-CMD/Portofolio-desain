/**
 * SEKALARUPA STUDIO - Database Connection & Abstraction Layer
 * PRD Reference: Section 10 (Database Architecture)
 * Uses Node 24 native SQLite with WAL mode & foreign keys enabled.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { SQL_SCHEMA } = require('./schema');

// Ensure database directory exists
const DB_DIR = path.resolve(__dirname, '../../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'sekalarupa.db');
const db = new DatabaseSync(DB_PATH);

// Configure SQLite for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
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
