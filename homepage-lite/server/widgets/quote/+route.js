// homepage-lite/server/widgets/quote/+route.js
import fp from 'fastify-plugin';
import { fetch } from 'undici'; // Using undici's fetch, ensure undici is installed or use Node's global fetch

const CACHE_KEY = 'widget_quote_daily';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// This is the fetcher logic, co-located for clarity but could be separate
async function fetchQuoteFromAPI(fastify) {
  try {
    const response = await fetch('https://zenquotes.io/api/random'); // 'random' for testing, 'today' might be better for daily
    if (!response.ok) {
      throw new Error(`ZenQuotes API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data && data.length > 0 && data[0].q && data[0].a) {
      return { quote: data[0].q, author: data[0].a };
    }
    throw new Error('Invalid quote data format from ZenQuotes API');
  } catch (err) {
    fastify.log.error({ err, widget: 'quote' }, 'Failed to fetch quote from ZenQuotes API');
    throw err; // Re-throw to be caught by the route handler
  }
}

async function quoteWidgetRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    // 1. Check cache
    try {
      // Ensure db is available on fastify instance
      if (!fastify.db) {
        request.log.error({ widget: 'quote' }, 'Database plugin (fastify.db) not available.');
        return reply.status(500).send({ error: 'Database not configured for quote widget.' });
      }
      const cached = await fastify.db.prepare('SELECT json, expires_at FROM cache WHERE key = ?').get(CACHE_KEY);
      if (cached && cached.expires_at > Date.now()) {
        request.log.info({ widget: 'quote', source: 'cache' }, 'Serving daily quote from cache');
        return JSON.parse(cached.json);
      }
    } catch (dbErr) {
      request.log.error({ err: dbErr, widget: 'quote' }, 'Error reading quote from cache');
      // Proceed to fetch, don't let cache read error stop the request
    }

    // 2. Fetch new data if not cached or expired
    try {
      request.log.info({ widget: 'quote', source: 'api' }, 'Fetching new daily quote from API');
      const quoteData = await fetchQuoteFromAPI(fastify);

      // 3. Store in cache
      try {
        if (!fastify.db) throw new Error('Database not available for caching.');
        const expires_at = Date.now() + CACHE_TTL_MS;
        await fastify.db.prepare('INSERT OR REPLACE INTO cache (key, json, expires_at) VALUES (?, ?, ?)')
                      .run(CACHE_KEY, JSON.stringify(quoteData), expires_at);
        request.log.info({ widget: 'quote' }, 'Successfully cached new daily quote');
      } catch (dbErr) {
        request.log.error({ err: dbErr, widget: 'quote' }, 'Error saving new quote to cache');
        // Continue to return data even if caching fails
      }
      return quoteData;
    } catch (fetchErr) {
      // If API fetch fails, try to serve stale cache if available, otherwise error
      try {
        if (!fastify.db) throw new Error('Database not available for stale cache retrieval.');
        const cached = await fastify.db.prepare('SELECT json FROM cache WHERE key = ?').get(CACHE_KEY);
        if (cached) {
          request.log.warn({ widget: 'quote', source: 'stale-cache' }, 'API fetch failed, serving stale quote from cache');
          return JSON.parse(cached.json);
        }
      } catch (dbErr) {
         request.log.error({ err: dbErr, widget: 'quote' }, 'Error reading stale quote from cache during API failure');
      }
      // Consistent error object structure
      return reply.status(500).send({ error: 'Failed to fetch daily quote and no cache available.' });
    }
  });
}

export default fp(quoteWidgetRoutes, {
  name: 'quote-widget-routes',
  fastify: '4.x',
  dependencies: ['sqlite-plugin', 'app-config'], // Ensure DB and config are ready
});
