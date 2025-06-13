// server/index.js
import 'dotenv/config'; // Basic environment variable loading
import createServer from './createServer.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  let server;
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
    // Fastify logs its own startup message, e.g.:
    // server.log.info(`Server listening on http://${HOST}:${PORT}`);
    // server.log.info(`Server listening on ${server.server.address().address}:${server.server.address().port}`)


  } catch (err) {
    if (server) {
      server.log.error(err);
    } else {
      console.error('Failed to create server or during startup:', err);
    }
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      if (server) {
        server.log.info(`Received ${signal}, shutting down gracefully...`);
        try {
          await server.close();
          server.log.info('Server closed successfully.');
          process.exit(0);
        } catch (closeErr) {
          server.log.error(`Error during server close: ${closeErr}`);
          process.exit(1);
        }
      } else {
        console.log(`Received ${signal}, but server was not initialized. Exiting.`);
        process.exit(0); // Or 1 if this state is considered an error
      }
    });
  });
}

start();
