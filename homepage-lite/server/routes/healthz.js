// server/routes/healthz.js
import fp from 'fastify-plugin';

async function healthzRoute(fastify, options) {
  fastify.get('/', async (request, reply) => {
    let dbStatus = 'ok';
    let dbCheckError = null;
    try {
      // Perform a simple, non-intrusive check on the database
      const result = fastify.db.pragma('quick_check');
      if (result !== 'ok') {
        dbStatus = `error: ${result}`;
      }
    } catch (err) {
      fastify.log.error(`Health check DB error: ${err.message}`);
      dbStatus = 'error';
      dbCheckError = err.message;
    }

    const healthInfo = {
      status: 'ok',
      uptime_ms: Math.floor(process.uptime() * 1000),
      timestamp: new Date().toISOString(),
      db_status: dbStatus,
    };

    if (dbCheckError) {
      healthInfo.db_error_details = dbCheckError;
    }

    // If dbStatus is not 'ok', return a 503 status code
    if (dbStatus !== 'ok') {
      reply.code(503).send(healthInfo);
    } else {
      reply.send(healthInfo);
    }
  });
}

export default fp(healthzRoute, {
  name: 'healthz-route',
  fastify: '^5.0.0',
  dependencies: ['sqlite-plugin'], // Ensure DB plugin is loaded
});
