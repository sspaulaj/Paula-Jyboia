import { afterEach, describe, expect, it } from 'vitest';
import { isHealthResponse, PROJECT_SCHEMA_VERSION } from '@jyboia/shared';
import { buildApp } from './app.js';
import { readServerConfig } from './env.js';

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('bootstrap da API', () => {
  it('responde health conforme contrato compartilhado, sem banco', async () => {
    const app = await buildApp({ webOrigin: 'http://localhost:5173' });
    apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', service: 'jyboia-api' });
    expect(isHealthResponse(response.json())).toBe(true);
    expect(PROJECT_SCHEMA_VERSION).toBe(1);
  });
  it('permite apenas a origem configurada no CORS', async () => {
    const app = await buildApp({ webOrigin: 'http://localhost:5173' });
    apps.push(app);
    const allowed = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    const denied = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://example.invalid' },
    });
    expect(denied.headers['access-control-allow-origin']).not.toBe(
      'https://example.invalid',
    );
    expect(allowed.headers['access-control-allow-credentials']).toBeUndefined();
  });
  it('rejeita configurações inválidas antes de iniciar o servidor', () => {
    expect(() => readServerConfig({ API_HOST: '0.0.0.0' })).toThrow('loopback');
    expect(() => readServerConfig({ API_PORT: '0' })).toThrow('API_PORT');
    expect(() => readServerConfig({ WEB_ORIGIN: '*' })).toThrow();
    expect(() =>
      readServerConfig({ WEB_ORIGIN: 'http://localhost:5173/path' }),
    ).toThrow('WEB_ORIGIN');
  });
});
