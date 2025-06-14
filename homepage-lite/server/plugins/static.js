// server/plugins/static.js
import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatible way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function staticPlugin(fastify, options) {
  const publicPath = path.join(__dirname, '..', '..', 'public');
  fastify.log.info(`Serving static files from: ${publicPath}`);

  fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: '/', // Optional: serve from root, or specify a prefix like '/static/'
    decorateReply: true, // Decorates reply with sendFile method
    index: false, // Explicitly disable serving index.html from root
    setHeaders: (res, pathName, stats) => {
      // Example: Set default cache control for static assets
      // More specific cache control can be set based on file types or paths
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    },
    // Optional: other configurations like etag, lastModified, etc.
    // etag: true, // Enable ETag generation
    // lastModified: true, // Enable Last-Modified header
  });
}

export default fp(staticPlugin, {
  name: 'static-assets-plugin',
  fastify: '^5.0.0',
});
