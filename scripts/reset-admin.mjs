/**
 * Reset / create admin user with correct SHA-256 password hash.
 * Run: node scripts/reset-admin.mjs
 */

import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "nova.db");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

// Ensure users table exists (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Ensure sessions has user_id column
try { db.exec(`ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`); }
catch { /* already exists */ }

function generateSalt() { return randomUUID().replace(/-/g, ""); }
function hashPassword(password, salt) {
  return createHash("sha256").update(salt + password).digest("hex");
}

// Delete any stale admin rows
try { db.prepare("DELETE FROM users WHERE email = 'admin@nova.com'").run(); } catch { /* skip */ }

// Insert fresh admin
const id = randomUUID();
const salt = generateSalt();
const hash = hashPassword("admin123", salt);
db.prepare(
  "INSERT INTO users (id, email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, ?)"
).run(id, "admin@nova.com", "Admin", hash, salt, "admin");

console.log("✅  Admin user reset with correct crypto hash.");
console.log("    Email:    admin@nova.com");
console.log("    Password: admin123");
db.close();
