// server/plugins/sqlite.js
import fp from 'fastify-plugin';
import Database from 'better-sqlite3';

async function sqlitePlugin(fastify, options) {
  const { dbFile = 'sbitdash.sqlite' } = options; // Default to sbitdash.sqlite
  let db;

  try {
    db = new Database(dbFile); // Removed verbose: console.log to rely on Fastify logger
    fastify.log.info(`SQLite database opened at ${dbFile}`);

    // Set WAL mode for better concurrency and performance
    db.pragma('journal_mode = WAL');
    fastify.log.info('SQLite journal_mode set to WAL');

    // Set synchronous mode to NORMAL for a good balance of safety and speed
    // In WAL mode, NORMAL still ensures that transactions are durable.
    db.pragma('synchronous = NORMAL');
    fastify.log.info('SQLite synchronous set to NORMAL');

    // Attach the db instance to the Fastify instance
    fastify.decorate('db', db);

    // Add a hook to close the database connection when Fastify server closes
    fastify.addHook('onClose', (instance, done) => {
      if (instance.db) {
        instance.db.close();
        instance.log.info('SQLite database connection closed.');
      }
      done();
    });

  } catch (err) {
    fastify.log.error(`Failed to initialize SQLite plugin: ${err.message}`);
    // Propagate the error to prevent server from starting with a broken DB connection
    throw new Error(`SQLite initialization failed: ${err.message}`);
  }
}

export default fp(sqlitePlugin, {
  name: 'sqlite-plugin',
  fastify: '^5.0.0', // Specify Fastify version compatibility
});
