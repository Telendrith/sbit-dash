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
let scriptShouldFail = false; // Flag to track if any step failed

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
    scriptShouldFail = true;
  }

  if (!scriptShouldFail) {
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
    const coreSchemaMigrationId = 'core_schema_v1_initial_setup'; // Descriptive ID for this core schema

    // Ensure the migrations table itself exists by applying schema.sql.
    // schema.sql is designed to be idempotent (CREATE IF NOT EXISTS).
    try {
      db.exec(schemaSql);
      console.log('[Migrate] Ensured core tables (like migrations) are present from schema.sql.');
    } catch (sqlErr) {
      console.error(`[Migrate] Critical error applying schema.sql (migrations table might be missing or other schema error): ${sqlErr.message}`);
      scriptShouldFail = true;
    }

    if (!scriptShouldFail) {
      const migrationApplied = db.prepare('SELECT 1 FROM migrations WHERE hash = ?').get(coreSchemaMigrationId);

      if (migrationApplied) {
        console.log(`[Migrate] Core schema migration '${coreSchemaMigrationId}' already applied. Skipping further schema execution for this ID.`);
      } else {
        console.log(`[Migrate] Applying core schema migration '${coreSchemaMigrationId}'...`);
        try {
          // The schemaSql was already run once to ensure the migrations table.
          // If schema.sql contains only CREATE IF NOT EXISTS, running it again (as part of the initial db.exec)
          // is fine. If it had data insertion or destructive alters, this logic would need splitting
          // schema.sql into "create migrations table" and "apply full schema if not applied".
          // For now, we assume schema.sql is safe to have been run fully once.
          // We only need to record this specific migration ID.
          db.prepare('INSERT INTO migrations (hash, applied_at) VALUES (?, strftime(\'%Y-%m-%d %H:%M:%S\',\'now\'))').run(coreSchemaMigrationId);
          console.log(`[Migrate] Core schema migration '${coreSchemaMigrationId}' applied successfully and recorded.`);
        } catch (sqlErr) {
          console.error(`[Migrate] Error recording core schema migration '${coreSchemaMigrationId}': ${sqlErr.message}`);
          scriptShouldFail = true;
        }
      }
    }
  }

  // Placeholder for future: Read individual widget model.sql files, calculate hash,
  // check against migrations table, apply if new, and record.

  if (scriptShouldFail) {
    process.exitCode = 1; // Set exit code if any step marked it as failed
  }

} catch (err) { // This is the outer catch for general errors (e.g., DB connection)
  console.error(`[Migrate] Error during migration process: ${err.message}`);
  // console.error(err.stack); // Optional
  process.exitCode = 1; // Indicate failure
} finally {
  if (db && db.open) {
    db.close();
    console.log('[Migrate] Database connection closed.');
  }
  // Node.js will exit with process.exitCode if set (defaults to 0 if not set)
  // or if it was set by an explicit process.exit() call earlier (like in the signal handlers)
  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}
