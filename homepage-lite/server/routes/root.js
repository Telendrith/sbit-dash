// homepage-lite/server/routes/root.js
import fp from 'fastify-plugin';
import { renderSvelteApp } from '../lib/svelteRenderer.js';

async function rootRoute(fastify, options) {
  fastify.get('/', async (request, reply) => {
    try {
      const { settings, services, widgets, customCss, customJs } = fastify.appConfig;

      const { html: appHtml, head: appHead } = await renderSvelteApp({
        title: settings.title || 'Sbit-Dash',
        services: services || [],
        widgetsConfig: widgets || { layout: [] }, // Pass widgets config
        customCss: customCss || '',
        customJs: customJs || '',
      });

      // Simple HTML shell
      const pageHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${appHead}
          <!-- Link to global CSS files if any, e.g., from public/css/main.css -->
          <!-- Custom CSS from config is injected by App.svelte's <svelte:head> -->
        </head>
        <body>
          <div id="app-root">
            ${appHtml}
          </div>
          <!-- Global JS files if any -->
          <!-- Custom JS from config is injected by App.svelte itself -->
        </body>
        </html>
      `;

      reply.type('text/html').send(pageHtml);
    } catch (err) {
      request.log.error('Error rendering root page:', err);
      reply.status(500).send('Internal Server Error');
    }
  });
}

export default fp(rootRoute, {
  name: 'root-route',
  fastify: '4.x',
  dependencies: ['app-config'], // Ensure appConfig is loaded
});
