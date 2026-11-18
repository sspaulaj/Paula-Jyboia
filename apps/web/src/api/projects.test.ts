import { expect, it, vi } from 'vitest';
import { createProjectsClient } from './projects';
import { projectExample } from '@jyboia/shared/projects';
it('usa API e If-Match ao atualizar e excluir, sem repetir escritas após falha', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'REVISION_CONFLICT' } }), {
        status: 412,
      }),
    );
  const client = createProjectsClient('http://localhost:3001', fetcher);
  await expect(client.update('id', 3, projectExample)).rejects.toMatchObject({
    code: 'REVISION_CONFLICT',
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
    'If-Match': '"3"',
  });
  fetcher.mockResolvedValue(new Response(null, { status: 204 }));
  await client.remove('id', 4);
  expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
    method: 'DELETE',
    headers: { 'If-Match': '"4"' },
  });
});
it('não aceita resposta de carregamento com estrutura malformada', async () => {
  const client = createProjectsClient(
    '',
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'id',
            name: 'x',
            revision: 1,
            description: '',
            workspaceData: { schemaVersion: 2 },
            formatVersion: 2,
          }),
        ),
      ),
  );
  await expect(client.get('id')).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
});
