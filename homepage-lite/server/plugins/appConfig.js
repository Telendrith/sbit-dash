// homepage-lite/server/plugins/appConfig.js
import fp from 'fastify-plugin';
import { loadAllConfigs } from '../lib/configLoader.js';

async function appConfigPlugin(fastify, options) {
  const config = loadAllConfigs();
  fastify.decorate('appConfig', config);
  fastify.log.info('[AppConfig] Application configuration loaded and decorated.');
}

export default fp(appConfigPlugin, {
  name: 'app-config',
  fastify: '^5.0.0',
});
