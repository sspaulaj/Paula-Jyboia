import { describe, it, expect } from 'vitest';
import { buildApp } from './app.js';
import { projectExample } from '@jyboia/shared/projects';
describe('contrato HTTP sem banco', () => {
  it('exige JSON em escritas', async () => {
    const app = await buildApp({ webOrigin: 'http://localhost:5173' });
    try {
      const result = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: 'texto',
        headers: { 'content-type': 'text/plain' },
      });
      expect(result.statusCode).toBe(415);
      expect(result.json().error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    } finally {
      await app.close();
    }
  });
  it.each([
    { method: 'GET', url: '/api/projects/not-a-uuid', expected: 400 },
    { method: 'GET', url: '/api/projects?limit=101', expected: 400 },
    {
      method: 'POST',
      url: '/api/projects',
      payload: { ...projectExample, extra: true },
      expected: 400,
    },
    {
      method: 'POST',
      url: '/api/projects',
      payload: { ...projectExample, formatVersion: '1' },
      expected: 400,
    },
    {
      method: 'POST',
      url: '/api/projects',
      payload: '{',
      headers: { 'content-type': 'application/json' },
      expected: 400,
    },
    {
      method: 'POST',
      url: '/api/projects',
      payload: 'x'.repeat(256 * 1024 + 1),
      headers: { 'content-type': 'application/json' },
      expected: 413,
    },
    {
      method: 'POST',
      url: '/api/projects',
      payload: projectExample,
      headers: { 'content-encoding': 'gzip' },
      expected: 415,
    },
    { method: 'GET', url: '/api/projects', expected: 503 },
  ] as const)(
    'retorna $expected para $method $url',
    async ({ expected, ...options }) => {
      const app = await buildApp({ webOrigin: 'http://localhost:5173' });
      try {
        const response = await app.inject(options);
        expect(response.statusCode).toBe(expected);
        expect(response.json()).toMatchObject({
          error: {
            code: expect.any(String),
            message: expect.any(String),
            requestId: expect.any(String),
            issues: expect.any(Array),
          },
        });
        expect(response.body).not.toContain('stack');
      } finally {
        await app.close();
      }
    },
  );
});
