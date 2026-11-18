import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { createDatabaseClient } from '../src/database.js';
export async function testDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (
    !connectionString ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(
      new URL(connectionString).hostname,
    )
  )
    throw new Error(
      'Defina TEST_DATABASE_URL para um PostgreSQL local de testes.',
    );
  const schema = `jyboia_test_${randomUUID().replaceAll('-', '')}`;
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const folder = new URL('../prisma/migrations/', import.meta.url);
    for (const name of (await readdir(folder, { withFileTypes: true }))
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .sort())
      await client.query(
        await readFile(new URL(`${name}/migration.sql`, folder), 'utf8'),
      );
  } finally {
    client.release();
  }
  const database = createDatabaseClient(connectionString, schema);
  return {
    database,
    async close() {
      await database.$disconnect();
      if (!/^jyboia_test_[a-f0-9]{32}$/.test(schema))
        throw new Error('Schema inesperado.');
      await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
      await pool.end();
    },
  };
}
