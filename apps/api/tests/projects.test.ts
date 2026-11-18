import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { createDatabaseClient } from '../src/database.js';
import { projectExample, type ProjectResource } from '@jyboia/shared/projects';
import { openApiDocument } from '@jyboia/shared/openapi';

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Defina TEST_DATABASE_URL para um PostgreSQL local de testes.',
  );
const url = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
  throw new Error('Os testes exigem banco local.');
const schema = `jyboia_test_${randomUUID().replaceAll('-', '')}`;
const database = createDatabaseClient(connectionString, schema);
const pool = new pg.Pool({ connectionString });
let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  // Namespace único por execução: nunca limpa public nem dados de desenvolvimento.
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(
      await readFile(
        new URL(
          '../prisma/migrations/202611040001_projects/migration.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    );
  } finally {
    client.release();
  }
  const migration = await pool.connect();
  try {
    await migration.query(`SET search_path TO "${schema}"`);
    await migration.query(
      await readFile(
        new URL(
          '../prisma/migrations/202611050001_editor_format_v2/migration.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    );
  } finally {
    migration.release();
  }
  app = await buildApp({ webOrigin: 'http://localhost:5173', database });
});
afterAll(async () => {
  await app?.close();
  await database.$disconnect();
  // O nome é gerado acima e validado antes de excluir somente este namespace.
  if (!/^jyboia_test_[a-f0-9]{32}$/.test(schema))
    throw new Error('Schema de teste inesperado.');
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
});
const create = () =>
  app.inject({
    method: 'POST',
    url: '/api/projects',
    payload: structuredClone(projectExample),
  });

describe('Prisma + PostgreSQL + HTTP', () => {
  it('preserva documento v2 com repetição, condição e parâmetros no PostgreSQL', async () => {
    const workspaceData = {
      schemaVersion: 2,
      initialState: { x: 5, y: 0, heading: 0 },
      layout: [{ blockId: 'start:1', x: 30, y: 40 }],
      program: {
        entryBlockIds: ['start:1'],
        blocks: [
          { id: 'start:1', kind: 'start', next: 'repeat' },
          { id: 'repeat', kind: 'repeat', times: 3, body: 'move', next: 'if' },
          { id: 'move', kind: 'move', steps: 25, next: null },
          { id: 'if', kind: 'if', condition: 'gt', body: 'say', next: null },
          { id: 'gt', kind: 'gt', left: '2', right: '1', next: null },
          { id: 'say', kind: 'say', text: 'Olá de novo', next: null },
        ],
      },
    };
    const payload = {
      name: 'Formato completo',
      description: '',
      formatVersion: 2,
      workspaceData,
    };
    const created = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload,
    });
    expect(created.statusCode).toBe(201);
    expect(
      (await app.inject(`/api/projects/${created.json().id}`)).json()
        .workspaceData,
    ).toEqual(workspaceData);
    const invalid = structuredClone(payload);
    invalid.workspaceData.program.blocks[1]!.body = 'gt';
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/projects',
          payload: invalid,
        })
      ).statusCode,
    ).toBe(422);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/projects',
          payload: { ...payload, formatVersion: 1 },
        })
      ).statusCode,
    ).toBe(422);
  });
  it('cria, recupera sem perdas, lista, atualiza e exclui', async () => {
    const response = await create();
    expect(response.statusCode).toBe(201);
    const project = response.json<ProjectResource>();
    const resource = `/api/projects/${project.id}`;
    expect(response.headers.location).toBe(resource);
    expect(response.headers.etag).toBe('"1"');
    expect(project.workspaceData).toEqual(projectExample.workspaceData);
    expect((await app.inject(resource)).json()).toEqual(project);
    const page = await app.inject('/api/projects?limit=1&offset=0');
    expect(page.statusCode).toBe(200);
    expect(page.json().items[0]).not.toHaveProperty('workspaceData');
    expect(page.json().total).toBeGreaterThan(0);
    const workspaceData = structuredClone(projectExample.workspaceData);
    Object.assign(workspaceData.program.blocks[1]!.parameters, { steps: 25 });
    const updated = await app.inject({
      method: 'PUT',
      url: resource,
      headers: { 'if-match': '"1"' },
      payload: {
        ...projectExample,
        name: '  Novo nome  ',
        description: 'Atualizado',
        workspaceData,
      },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      name: 'Novo nome',
      description: 'Atualizado',
      revision: 2,
      createdAt: project.createdAt,
    });
    expect(updated.headers.etag).toBe('"2"');
    expect((await app.inject(resource)).json().workspaceData).toEqual(
      workspaceData,
    );
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: resource,
          headers: { 'if-match': '"1"' },
        })
      ).statusCode,
    ).toBe(412);
    const deleted = await app.inject({
      method: 'DELETE',
      url: resource,
      headers: { 'if-match': '"2"' },
    });
    expect(deleted.statusCode).toBe(204);
    expect(deleted.body).toBe('');
    expect((await app.inject(resource)).statusCode).toBe(404);
  });
  it('rejeita IDs inexistentes e revisão ausente, inválida ou antiga', async () => {
    const missing = `/api/projects/${randomUUID()}`;
    for (const method of ['GET', 'PUT', 'DELETE'] as const) {
      const result = await app.inject({
        method,
        url: missing,
        headers: { 'if-match': '"1"' },
        ...(method === 'PUT' ? { payload: projectExample } : {}),
      });
      expect(result.statusCode).toBe(404);
      expect(result.json().error.code).toBe('PROJECT_NOT_FOUND');
    }
    const resource = `/api/projects/${(await create()).json().id}`;
    for (const [header, status] of [
      [undefined, 428],
      ['*', 400],
      ['"2"', 412],
    ] as const) {
      const result = await app.inject({
        method: 'PUT',
        url: resource,
        headers: header ? { 'if-match': header } : {},
        payload: projectExample,
      });
      expect(result.statusCode).toBe(status);
    }
    expect(
      (await app.inject({ method: 'DELETE', url: resource })).statusCode,
    ).toBe(428);
  });
  it('somente uma de duas gravações simultâneas da mesma revisão vence', async () => {
    const resource = `/api/projects/${(await create()).json().id}`;
    const results = await Promise.all(
      ['A', 'B'].map((name) =>
        app.inject({
          method: 'PUT',
          url: resource,
          headers: { 'if-match': '"1"' },
          payload: { ...projectExample, name },
        }),
      ),
    );
    expect(results.map((result) => result.statusCode).sort()).toEqual([
      200, 412,
    ]);
    expect((await app.inject(resource)).json().revision).toBe(2);
  });
  it('atualização malformada preserva documento e revisão', async () => {
    const original = (await create()).json<ProjectResource>();
    const payload = structuredClone(projectExample);
    payload.workspaceData.program.blocks[0]!.next = 'missing';
    const resource = `/api/projects/${original.id}`;
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: resource,
          headers: { 'if-match': '"1"' },
          payload,
        })
      ).statusCode,
    ).toBe(422);
    expect((await app.inject(resource)).json()).toEqual(original);
  });
  it('responde por HTTP real em loopback sem frontend', async () => {
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const response = await fetch(`${address}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(projectExample),
    });
    expect(response.status).toBe(201);
    const project = (await response.json()) as ProjectResource;
    expect((await fetch(`${address}/api/projects/${project.id}`)).status).toBe(
      200,
    );
  });
  it.each([
    'cycle',
    'missing',
    'duplicate',
    'type',
    'parameter',
    'limit',
    'version',
    'extra',
    'unicode',
    'blankName',
  ])('rejeita dados %s sem gravar', async (scenario) => {
    const input = structuredClone(projectExample);
    const blocks = input.workspaceData.program.blocks;
    if (scenario === 'cycle') blocks[2]!.next = 'move1';
    if (scenario === 'missing') blocks[0]!.next = 'missing';
    if (scenario === 'duplicate') blocks.push({ ...blocks[1]! });
    if (scenario === 'type') Object.assign(blocks[1]!, { type: 'javascript' });
    if (scenario === 'parameter')
      Object.assign(blocks[1]!.parameters, { steps: '10' });
    if (scenario === 'limit')
      input.workspaceData.program.blocks = Array.from(
        { length: 201 },
        (_, index) => ({
          id: `b${index}`,
          type: 'start',
          parameters: {},
          next: null,
        }),
      );
    if (scenario === 'version') Object.assign(input, { formatVersion: 99 });
    if (scenario === 'extra')
      Object.assign(input.workspaceData, { script: 'alert(1)' });
    if (scenario === 'unicode') input.description = '\ud800';
    if (scenario === 'blankName') input.name = '   ';
    const before = await database.project.count();
    const result = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: input,
    });
    expect(result.statusCode).toBe(
      ['unicode', 'blankName'].includes(scenario) ? 400 : 422,
    );
    expect(result.json().error).toMatchObject({
      requestId: expect.any(String),
      issues: expect.any(Array),
    });
    expect(await database.project.count()).toBe(before);
  });
  it('preserva rascunhos e ordem independente da posição no array', async () => {
    const input = structuredClone(projectExample);
    input.workspaceData.program.blocks.reverse();
    const result = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: input,
    });
    expect(result.statusCode).toBe(201);
    expect(
      (await app.inject(`/api/projects/${result.json().id}`)).json()
        .workspaceData,
    ).toEqual(input.workspaceData);
    input.workspaceData.program = { entryBlockId: null, blocks: [] };
    input.workspaceData.layout = [];
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/projects',
          payload: input,
        })
      ).statusCode,
    ).toBe(201);
  });
  it('OpenAPI publicado coincide com o artefato versionado', async () => {
    expect((await app.inject('/openapi.json')).json()).toEqual(openApiDocument);
    expect(
      JSON.parse(
        await readFile(
          new URL('../../../docs/openapi.yaml', import.meta.url),
          'utf8',
        ),
      ),
    ).toEqual(openApiDocument);
  });
});
