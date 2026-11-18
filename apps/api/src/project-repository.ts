import type { ProjectInput } from '@jyboia/shared/projects';
import type { PrismaClient, Prisma } from './generated/prisma/client.js';
import { ApiError } from './errors.js';

const data = (input: ProjectInput) => ({
  ...input,
  workspaceData: input.workspaceData as unknown as Prisma.InputJsonObject,
});
export class ProjectRepository {
  constructor(private readonly database: PrismaClient) {}
  create(input: ProjectInput) {
    return this.database.project.create({ data: data(input) });
  }
  get(id: string) {
    return this.database.project.findUnique({ where: { id } });
  }
  list(limit: number, offset: number) {
    return this.database.$transaction(
      [
        this.database.project.findMany({
          take: limit,
          skip: offset,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          omit: { workspaceData: true },
        }),
        this.database.project.count(),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
  }
  update(id: string, revision: number, input: ProjectInput) {
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.project.updateMany({
        where: { id, revision },
        data: { ...data(input), revision: { increment: 1 } },
      });
      if (!result.count) await this.failWrite(transaction, id);
      return transaction.project.findUniqueOrThrow({ where: { id } });
    });
  }
  delete(id: string, revision: number) {
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.project.deleteMany({
        where: { id, revision },
      });
      if (!result.count) await this.failWrite(transaction, id);
    });
  }
  private async failWrite(
    transaction: Prisma.TransactionClient,
    id: string,
  ): Promise<never> {
    if (
      !(await transaction.project.findUnique({
        where: { id },
        select: { id: true },
      }))
    )
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projeto não encontrado.');
    throw new ApiError(
      412,
      'REVISION_CONFLICT',
      'O projeto foi alterado. Consulte a versão atual antes de salvar.',
    );
  }
}
