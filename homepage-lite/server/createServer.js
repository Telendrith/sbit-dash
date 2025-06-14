// server/createServer.js
import Fastify from 'fastify';
import fs from 'fs'; // Added
import path from 'path'; // Added
import { fileURLToPath, pathToFileURL } from 'url'; // Added pathToFileURL

import sqlitePlugin from './plugins/sqlite.js';
import staticPlugin from './plugins/static.js';
import appConfigPlugin from './plugins/appConfig.js';
import healthzRoute from './routes/healthz.js';
import rootRoute from './routes/root.js';

const __filename = fileURLToPath(import.meta.url); // Added
const __dirname = path.dirname(__filename); // Added

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

  // Placeholder for widget loading (already present)
  // server.decorate('widgets', {}); // This was already here, ensure it's useful or remove if widget registration below handles this concept.
                                  // For now, let's assume it's fine.

  // Dynamically register widget API routes
  const widgetsDir = path.join(__dirname, 'widgets');
  try {
    const widgetTypes = fs.readdirSync(widgetsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const widgetType of widgetTypes) {
      const routePath = path.join(widgetsDir, widgetType, '+route.js');
      if (fs.existsSync(routePath)) {
        try {
          // Construct a file:// URL for dynamic import
          const fileUrl = pathToFileURL(routePath).href;

          const { default: widgetRoutePlugin } = await import(fileUrl + '?t=' + Date.now()); // Cache busting
          if (typeof widgetRoutePlugin === 'function') {
            server.register(widgetRoutePlugin, { prefix: `/api/widgets/${widgetType}` });
            server.log.info(`Registered API route for widget: ${widgetType} at /api/widgets/${widgetType}`);
          } else {
            server.log.warn(`Export of ${routePath} is not a function/plugin for widget ${widgetType}.`);
          }
        } catch (err) {
          server.log.error({ err, widgetType }, `Error registering route for widget ${widgetType} from ${routePath}`);
        }
      }
    }
  } catch (err) {
    server.log.error({ err }, 'Error scanning widgets directory for routes');
  }

  // Optional: Hook for actions after plugins are loaded (e.g., print routes for debugging)
  // server.addHook('onReady', async () => {
  //   server.log.info('Custom onReady: Plugins loaded.');
  //   // server.log.info(`\n${server.printRoutes()}`);
  // });

  return server;
}
