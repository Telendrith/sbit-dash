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
// Resolve path from project root (assuming migrate.js is in server/db)
const projectRoot = path.resolve(__dirname, '..', '..');
const dbFilePath = path.resolve(projectRoot, dbFile);

console.log(`[Migrate] Attempting to connect to database: ${dbFilePath}`);

let db; // Keep db declaration outside try to be accessible in finally

try {
  db = new Database(dbFilePath);
  console.log(`[Migrate] Connected to SQLite database: ${dbFilePath}`);

  // Ensure WAL mode is set for consistency with the main app
  db.pragma('journal_mode = WAL');
  console.log('[Migrate] Journal mode set to WAL.');

  const schemaSqlPath = path.join(__dirname, 'schema.sql');
  console.log(`[Migrate] Checking for core schema at: ${schemaSqlPath}`);

  if (!fs.existsSync(schemaSqlPath)) {
    console.error(`[Migrate] Error: Schema file not found at ${schemaSqlPath}`);
    process.exitCode = 1;
    return; // Exit the try block, proceed to finally
  }

  const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
  console.log(`[Migrate] Core schema file found. Applying...`);

  try {
    db.exec(schemaSql);
    console.log('[Migrate] Core schema applied successfully.');
  } catch (sqlErr) {
    console.error(`[Migrate] Error applying SQL schema: ${sqlErr.message}`);
    // console.error('[Migrate] SQL Error Stack:', sqlErr.stack); // Optional for more verbose error
    process.exitCode = 1;
    return; // Exit the try block, proceed to finally
  }

  // Placeholder for future: Read widget model.sql files, calculate hash, update migrations table and user_version
  // For now, we just apply the core schema.
  // const currentVersion = db.pragma('user_version', { simple: true });
  // console.log(`[Migrate] Current user_version: ${currentVersion}`);
  // const newVersion = 1; // Example
  // if (currentVersion < newVersion) {
  //   db.pragma(`user_version = ${newVersion}`);
  //   console.log(`[Migrate] Database user_version updated to ${newVersion}`);
  // }

} catch (err) { // This is the outer catch for general errors (e.g., DB connection)
  console.error(`[Migrate] Error during migration process: ${err.message}`);
  // console.error(err.stack); // Optional
  process.exitCode = 1;
} finally {
  if (db && db.open) {
    db.close();
    console.log('[Migrate] Database connection closed.');
  }
  // Node.js will exit with process.exitCode if set (defaults to 0 if not set)
  // No explicit process.exit() here ensures the finally block completes.
}
