import { validateDocument, type ProjectInput } from '@jyboia/shared/projects';
import type { ProjectRepository } from './project-repository.js';
import { ApiError } from './errors.js';

function validateInput(input: ProjectInput): ProjectInput {
  if (
    ![1, 2].includes(input.formatVersion) ||
    input.workspaceData.schemaVersion !== input.formatVersion
  )
    throw new ApiError(
      422,
      'UNSUPPORTED_FORMAT_VERSION',
      'A versão do projeto não é suportada.',
    );
  const name = input.name.trim();
  if (
    !name ||
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
      name + input.description,
    )
  )
    throw new ApiError(400, 'INVALID_REQUEST', 'Nome ou descrição inválidos.');
  const result = validateDocument(input.workspaceData);
  if (!result.valid)
    throw new ApiError(
      422,
      'INVALID_DOCUMENT',
      'Revise a estrutura e os parâmetros dos blocos.',
      result.issues.map((issue) => ({
        ...issue,
        path: `/workspaceData${issue.path}`,
      })),
    );
  return { ...input, name, workspaceData: result.document };
}
export function readRevision(header: string | undefined): number {
  if (!header)
    throw new ApiError(
      428,
      'REVISION_REQUIRED',
      'Envie o ETag atual no cabeçalho If-Match.',
    );
  if (!/^"[1-9][0-9]*"$/.test(header))
    throw new ApiError(
      400,
      'INVALID_REQUEST',
      'O cabeçalho If-Match é inválido.',
    );
  const revision = Number(header.slice(1, -1));
  if (!Number.isSafeInteger(revision) || revision >= 2147483647)
    throw new ApiError(400, 'INVALID_REQUEST', 'A revisão é inválida.');
  return revision;
}
export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}
  create(input: ProjectInput) {
    return this.repository.create(validateInput(input));
  }
  async get(id: string) {
    const project = await this.repository.get(id);
    if (!project)
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado.');
    return project;
  }
  list(limit: number, offset: number) {
    return this.repository.list(limit, offset);
  }
  update(id: string, revision: string | undefined, input: ProjectInput) {
    return this.repository.update(
      id,
      readRevision(revision),
      validateInput(input),
    );
  }
  delete(id: string, revision: string | undefined) {
    return this.repository.delete(id, readRevision(revision));
  }
}
