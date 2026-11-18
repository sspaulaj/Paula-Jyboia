import { buildApp } from './app.js';
import { loadEnvironment, readServerConfig } from './env.js';
import { createDatabaseClient } from './database.js';

loadEnvironment();
const settings = readServerConfig();
const database = createDatabaseClient(process.env.DATABASE_URL ?? '');
const app = await buildApp({
  webOrigin: settings.webOrigin,
  logger: true,
  database,
});
app.addHook('onClose', async () => {
  await database.$disconnect();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().catch((error: unknown) => {
      app.log.error(error);
      process.exitCode = 1;
    });
  });
}

try {
  await app.listen({ host: settings.host, port: settings.port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}
