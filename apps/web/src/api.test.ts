import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from './api';

afterEach(() => vi.unstubAllGlobals());
describe('cliente HTTP', () => {
  it('usa a origem configurada e valida o contrato', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'ok', service: 'jyboia-api' })),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(getHealth('http://localhost:4567')).resolves.toEqual({
      status: 'ok',
      service: 'jyboia-api',
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'http://localhost:4567/health',
    );
  });
  it('não aceita uma resposta incompatível como conexão válida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(getHealth('http://localhost:3001')).rejects.toThrow(
      'Resposta',
    );
  });
  it('informa falha HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    );
    await expect(getHealth('http://localhost:3001')).rejects.toThrow(
      'conectar',
    );
  });
});
