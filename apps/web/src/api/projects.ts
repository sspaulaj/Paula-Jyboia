import {
  validateDocument,
  type ProjectInput,
  type ProjectResource,
  type ProjectPage,
} from '@jyboia/shared/projects';
export class ProjectApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const messages: Record<string, string> = {
  REVISION_CONFLICT:
    'Este projeto foi alterado em outra janela. Suas alterações foram mantidas. Abra a versão atual antes de tentar salvar novamente.',
  PROJECT_NOT_FOUND:
    'O projeto não foi encontrado. Ele pode ter sido excluído.',
  SERVICE_UNAVAILABLE:
    'O serviço de projetos está indisponível. Confira se a API e o banco estão iniciados.',
  INVALID_DOCUMENT: 'Revise os blocos e suas conexões antes de salvar.',
  UNSUPPORTED_FORMAT_VERSION: 'Esta versão do projeto não é suportada.',
  PAYLOAD_TOO_LARGE: 'O projeto ultrapassou o tamanho permitido.',
};
export function createProjectsClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const base = baseUrl.replace(/\/$/, '');
  async function request(
    path: string,
    method = 'GET',
    body?: ProjectInput,
    revision?: number,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetcher(`${base}/api/projects${path}`, {
        method,
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(revision ? { 'If-Match': `"${revision}"` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        const code = data?.error?.code ?? `HTTP_${response.status}`;
        throw new ProjectApiError(
          code,
          messages[code] ??
            'O serviço não conseguiu concluir a operação. Tente novamente mais tarde.',
        );
      }
      if (response.status === 204) return undefined;
      return await response.json();
    } catch (error) {
      if (error instanceof ProjectApiError) throw error;
      throw new ProjectApiError(
        'NETWORK',
        method === 'POST'
          ? 'A resposta da API não chegou. O projeto pode ter sido criado: consulte a lista antes de salvar novamente.'
          : 'Não foi possível comunicar com a API. Suas alterações foram mantidas.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
  const resource = (input: unknown): ProjectResource => {
    const data = input as Partial<ProjectResource> | null;
    if (
      !data ||
      typeof data.id !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.description !== 'string' ||
      !Number.isSafeInteger(data.revision) ||
      data.revision! < 1 ||
      !validateDocument(data.workspaceData).valid ||
      data.formatVersion !== data.workspaceData?.schemaVersion
    )
      throw new ProjectApiError(
        'INVALID_RESPONSE',
        'A API retornou um projeto inválido. O programa aberto foi preservado.',
      );
    return data as ProjectResource;
  };
  return {
    async list(offset = 0): Promise<ProjectPage> {
      const data = (await request(`?limit=20&offset=${offset}`)) as ProjectPage;
      if (
        !data ||
        !Array.isArray(data.items) ||
        !Number.isSafeInteger(data.total) ||
        data.items.some(
          (item) =>
            typeof item.id !== 'string' ||
            typeof item.name !== 'string' ||
            !Number.isInteger(item.revision),
        )
      )
        throw new ProjectApiError(
          'INVALID_RESPONSE',
          'Não foi possível ler a lista de projetos.',
        );
      return data;
    },
    async get(id: string) {
      return resource(await request(`/${encodeURIComponent(id)}`));
    },
    async create(input: ProjectInput) {
      return resource(await request('', 'POST', input));
    },
    async update(id: string, revision: number, input: ProjectInput) {
      return resource(
        await request(`/${encodeURIComponent(id)}`, 'PUT', input, revision),
      );
    },
    async remove(id: string, revision: number) {
      await request(
        `/${encodeURIComponent(id)}`,
        'DELETE',
        undefined,
        revision,
      );
    },
  };
}
export const projectsClient = createProjectsClient(
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001',
);
