// server/index.js
import 'dotenv/config'; // Basic environment variable loading
import createServer from './createServer.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SHUTDOWN_TIMEOUT_MS = 15000; // 15 seconds
let isShuttingDown = false; // Flag to prevent multiple shutdown attempts
let server; // Declare server instance variable in a scope accessible to handlers

// Unified graceful shutdown function - defined early to be accessible
async function gracefulShutdown(signal) {
  // Safely get a logger, defaulting to console if server.log is not available
  const effectiveLog = (server && server.log) ? server.log : {
      info: console.log,
      warn: console.warn,
      error: console.error,
      fatal: console.error, // Add fatal for Pino compatibility
  };

  if (isShuttingDown && signal !== 'uncaughtExceptionCleanup') { // Allow emergency cleanup to proceed somewhat
    effectiveLog.warn(`Shutdown already in progress. ${signal} ignored.`);
    return;
  }
  isShuttingDown = true; // Set flag early
  effectiveLog.info(`Received ${signal}. Starting graceful shutdown with ${SHUTDOWN_TIMEOUT_MS}ms timeout...`);

  const shutdownTimer = setTimeout(() => {
    effectiveLog.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`);
    process.exit(1); // Force exit
  }, SHUTDOWN_TIMEOUT_MS);

  shutdownTimer.unref(); // Allow Node.js to exit if this is the only timer left.

  try {
    // Close Database Connection first
    if (server && server.db && typeof server.db.close === 'function') {
      try {
        server.db.close(); // better-sqlite3 close is synchronous
        effectiveLog.info('Database connection closed successfully.');
      } catch (dbErr) {
        effectiveLog.error({ err: dbErr } if (dbErr instanceof Error) else dbErr, 'Error closing database connection.');
      }
    } else {
      effectiveLog.warn('Database (server.db) or db.close method not available for shutdown cleanup.');
    }

    // Then Close Fastify Server
    if (server && typeof server.close === 'function') {
      await server.close(); // Fastify server.close() is asynchronous
      effectiveLog.info('Fastify server closed successfully.');
    } else {
      effectiveLog.warn('Server object or server.close method not available for shutdown.');
    }

    clearTimeout(shutdownTimer);
    effectiveLog.info('Graceful shutdown completed.');
    process.exit(0); // Normal exit after successful shutdown
  } catch (err) {
    effectiveLog.error({ err } if (err instanceof Error) else err, 'Error during graceful shutdown sequence.');
    clearTimeout(shutdownTimer);
    process.exit(1); // Exit with error code
  }
}

process.on('unhandledRejection', (reason, promise) => {
  const log = server && server.log ? server.log : console;
  log.error({
    type: 'UnhandledRejection',
    reason: reason,
    promise: promise
  }, 'Unhandled Rejection at Promise. Attempting graceful shutdown.');

  if (!isShuttingDown) {
    gracefulShutdown('unhandledRejection');
  } else {
    log.warn('Shutdown already in progress. Unhandled rejection occurred during shutdown.');
  }
});

process.on('uncaughtException', (error) => {
  const log = server && server.log ? server.log : (console.fatal || console.error);
  log.fatal ? log.fatal({ type: 'UncaughtException', error: error, stack: error.stack }, 'Uncaught Exception. Application state is unknown. Attempting to shut down and exit.')
            : log.error({ type: 'UncaughtException', error: error, stack: error.stack }, 'Uncaught Exception. Application state is unknown. Attempting to shut down and exit.');


  if (!isShuttingDown) {
    isShuttingDown = true;

    const emergencyLog = server && server.log ? server.log : console;

    if (server && server.db && typeof server.db.close === 'function') {
      try {
        server.db.close();
        emergencyLog.info('Database connection closed during emergency shutdown.');
      } catch (dbErr) {
        emergencyLog.error({err: dbErr}, 'Error closing database during emergency shutdown.');
      }
    }

    if (server && typeof server.close === 'function') {
      server.close().then(() => {
        emergencyLog.info('Fastify server closed during emergency shutdown.');
        process.exit(1);
      }).catch(serverErr => {
        emergencyLog.error({err: serverErr}, 'Error closing server during emergency shutdown.');
        process.exit(1);
      });
    } else {
      emergencyLog.error('Server not available for emergency close. Exiting.');
      process.exit(1);
    }

    const emergencyTimeout = setTimeout(() => {
      emergencyLog.error('Emergency shutdown cleanup timed out. Forcing exit.');
      process.exit(1);
    }, 5000);
    emergencyTimeout.unref();

  } else {
    (server && server.log ? server.log : console).warn('Shutdown already in progress. Uncaught exception occurred during shutdown. Forcing exit.');
    setTimeout(() => process.exit(1), 1000).unref();
  }
});


async function start() {
  // server is now assigned to the higher-scoped variable
  try {
    server = await createServer({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
      dbFile: process.env.DB_FILE || 'sbitdash.sqlite',
    });

    await server.listen({ port: PORT, host: HOST });
    // Fastify logs its own startup message.
  } catch (err) {
    const logError = server && server.log ? server.log.error.bind(server.log) : console.error;
    logError({ err } if (err instanceof Error) else err, 'Error during server startup or listening.');
    process.exit(1); // Exit if server fails to start
  }

  // Graceful shutdown signal listeners (SIGINT, SIGTERM, SIGHUP)
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      if (!server) { // Should ideally not happen if start() succeeded
        console.log(`Received ${signal}, but server was not initialized. Exiting.`);
        process.exit(1);
        return;
      }
      await gracefulShutdown(signal);
    });
  });
}

start();
