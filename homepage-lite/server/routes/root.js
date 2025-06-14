// homepage-lite/server/routes/root.js
import fp from 'fastify-plugin';
// Ensure renderDashboardPage is imported instead of the old function name
import { renderDashboardPage } from '../lib/svelteRenderer.js';

async function rootRoute(fastify, options) {
  fastify.get('/', async (request, reply) => {
    try {
      // Pass the whole fastify instance to renderDashboardPage
      const pageHtml = await renderDashboardPage(fastify.appConfig, fastify);
      reply.type('text/html').send(pageHtml);
    } catch (err) {
      request.log.error({err: err}, 'Error rendering root page'); // Log the error object
      reply.status(500).send('Internal Server Error. Check logs.'); // More generic message to client
    }
  });
}

export default fp(rootRoute, {
  name: 'root-route',
  fastify: '4.x',
  dependencies: ['app-config'], // Ensure appConfig is loaded
});
