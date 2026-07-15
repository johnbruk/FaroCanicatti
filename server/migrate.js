import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Applica lo schema del database (idempotente: usa CREATE TABLE IF NOT EXISTS).
async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✓ Schema applicato.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('✗ Migrazione fallita:', err.message);
  process.exit(1);
});
