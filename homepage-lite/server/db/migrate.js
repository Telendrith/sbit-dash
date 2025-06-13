// server/db/migrate.js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load environment variables

// ESM compatible way to get __dirname for this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DB_FILE || 'sbitdash.sqlite';
const dbFilePath = path.resolve(__dirname, '..', '..', dbFile); // Resolve path relative to project root

console.log(`[Migrate] Attempting to connect to database: ${dbFilePath}`);

let db;
try {
  db = new Database(dbFilePath); // Removed verbose: console.log
  console.log(`[Migrate] Connected to SQLite database: ${dbFilePath}`);

  // Ensure WAL mode is set for consistency with the main app
  db.pragma('journal_mode = WAL');
  console.log('[Migrate] Journal mode set to WAL.');

  const schemaSqlPath = path.join(__dirname, 'schema.sql');
  console.log(`[Migrate] Reading core schema from: ${schemaSqlPath}`);
  const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');

  console.log('[Migrate] Applying core schema...');
  db.exec(schemaSql);
  console.log('[Migrate] Core schema applied successfully.');

  // Placeholder for future: Read widget model.sql files, calculate hash, update migrations table and user_version
  // For now, we just apply the core schema.
  // const currentVersion = db.pragma('user_version', { simple: true });
  // console.log(`[Migrate] Current user_version: ${currentVersion}`);
  // const newVersion = 1; // Example
  // if (currentVersion < newVersion) {
  //   db.pragma(`user_version = ${newVersion}`);
  //   console.log(`[Migrate] Database user_version updated to ${newVersion}`);
  // }


} catch (err) {
  console.error(`[Migrate] Error during migration: ${err.message}`);
  console.error(err.stack);
  process.exitCode = 1; // Indicate failure
} finally {
  if (db && db.open) {
    db.close();
    console.log('[Migrate] Database connection closed.');
  }
}
