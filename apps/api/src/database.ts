import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export function createDatabaseClient(
  connectionString: string,
  schema = 'public',
) {
  if (!connectionString)
    throw new Error('Defina DATABASE_URL antes de acessar o banco.');
  const adapter = new PrismaPg(
    {
      connectionString,
      connectionTimeoutMillis: 5000,
    },
    { schema },
  );
  return new PrismaClient({ adapter });
}
