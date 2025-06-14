// server/createServer.js
import Fastify from 'fastify';
import sqlitePlugin from './plugins/sqlite.js';
import staticPlugin from './plugins/static.js';
import appConfigPlugin from './plugins/appConfig.js';
import healthzRoute from './routes/healthz.js'; // To be added in a later step
import rootRoute from './routes/root.js';

export default async function createServer(opts = {}) {
  const server = Fastify({
    logger: opts.logger !== undefined ? opts.logger : true,
    disableRequestLogging: process.env.NODE_ENV === 'production',
  });

  // Register core plugins
  server.register(sqlitePlugin, { dbFile: opts.dbFile });
  server.register(staticPlugin);
  server.register(appConfigPlugin);

  // Register core routes
  server.register(healthzRoute, { prefix: '/healthz' });
  server.register(rootRoute);

  // Placeholder for widget loading
  server.decorate('widgets', {});

  // Optional: Hook for actions after plugins are loaded (e.g., print routes for debugging)
  // server.addHook('onReady', async () => {
  //   server.log.info('Custom onReady: Plugins loaded.');
  //   // server.log.info(`\n${server.printRoutes()}`);
  // });

  return server;
}
