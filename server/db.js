import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDb() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Rebuilding schema for testing
  await db.exec('DROP TABLE IF EXISTS users');

  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      encrypted_data TEXT,
      failed_attempts INTEGER DEFAULT 0,
      lockout_time INTEGER DEFAULT 0
    )
  `);

  // Seed data for testing (password is 'password' for all)
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('password', salt);
    await db.run('INSERT INTO users (username, password_hash, encrypted_data) VALUES (?, ?, ?)', ['ADMIN', hash, null]);
    await db.run('INSERT INTO users (username, password_hash, encrypted_data) VALUES (?, ?, ?)', ['PLAYER1', hash, null]);
    await db.run('INSERT INTO users (username, password_hash, encrypted_data) VALUES (?, ?, ?)', ['TESTER', hash, null]);
  } catch (e) {
    console.error('Error seeding data:', e);
  }

  // Database Privileges Emulation via strict permissions
  try {
    fs.chmodSync(dbPath, 0o600);
  } catch(e) {
    console.warn('Could not set strict file permissions, potentially unsupported on this OS:', e.message);
  }

  return db;
}
