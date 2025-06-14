// server/routes/healthz.js
import fp from 'fastify-plugin';

async function healthzRoute(fastify, options) {
  // Define the full path explicitly here
  fastify.get('/healthz', async (request, reply) => {
    let dbStatus = 'ok';
    let dbCheckError = null;
    try {
      // Perform a simple, non-intrusive check on the database
      const result = fastify.db.pragma('quick_check'); // This typically returns a string 'ok' or throws.
      // If quick_check returns something other than 'ok' but doesn't throw (unusual for better-sqlite3 pragma),
      // we'll capture it. The main path for errors is the catch block.
      if (Array.isArray(result) && result.length > 0 && result[0].hasOwnProperty('quick_check')) {
        // This handles cases where pragma returns an array of objects like [{ quick_check: 'ok' }]
        if (result[0].quick_check !== 'ok') {
          dbStatus = `error: ${result[0].quick_check}`;
          dbCheckError = result[0].quick_check;
        }
      } else if (typeof result === 'string' && result !== 'ok') {
        dbStatus = `error: ${result}`;
        dbCheckError = result;
      }
      // If result is 'ok', dbStatus remains 'ok' and dbCheckError remains null.
    } catch (err) {
      fastify.log.error(`Health check DB error: ${err.message}`);
      dbStatus = 'error'; // General error status
      dbCheckError = err.message; // Specific error message
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
