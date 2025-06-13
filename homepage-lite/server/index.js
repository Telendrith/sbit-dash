// server/index.js
import 'dotenv/config'; // Basic environment variable loading
import createServer from './createServer.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const server = await createServer({
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

  try {
    await server.listen({ port: PORT, host: HOST });
    // server.log.info(`Server listening on http://${HOST}:${PORT}`); // Fastify already logs this
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
