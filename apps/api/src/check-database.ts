import { createDatabaseClient } from './database.js';
import { loadEnvironment } from './env.js';

loadEnvironment();
const database = createDatabaseClient(process.env.DATABASE_URL ?? '');
try {
  await database.$queryRaw`SELECT 1`;
  console.info('Conexão com PostgreSQL confirmada.');
} finally {
  await database.$disconnect();
}
