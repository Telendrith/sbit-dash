// server/createServer.js
import Fastify from 'fastify';
import sqlitePlugin from './plugins/sqlite.js'; // To be added in a later step
// import staticPlugin from './plugins/static.js'; // To be added in a later step
// import healthzRoute from './routes/healthz.js'; // To be added in a later step

export default async function createServer(opts = {}) {
  const server = Fastify({
    logger: opts.logger !== undefined ? opts.logger : true,
    disableRequestLogging: process.env.NODE_ENV === 'production', // Example: less verbose logs in prod
  });

  // Register core plugins - will be uncommented as they are built
  server.register(sqlitePlugin, { dbFile: opts.dbFile });
  // server.register(staticPlugin);

  // Register core routes
  // server.register(healthzRoute, { prefix: '/healthz' });

  // Placeholder for widget loading - to be implemented
  server.decorate('widgets', {}); // Initialize an empty object for widgets

  // Example: Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}, shutting down...`);
      await server.close();
      process.exit(0);
    });
  });

  // Optional: Hook to demonstrate readiness after plugins are loaded
  server.addHook('onReady', async () => {
    server.log.info('Server is ready and plugins are loaded.');
    // Example: list all routes
    // server.log.info(`
//${server.printRoutes()}`);
  });


  return server;
}
