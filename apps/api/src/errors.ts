import type { FastifyInstance, FastifyError } from 'fastify';
import type { DocumentIssue } from '@jyboia/shared/projects';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues: DocumentIssue[] = [],
  ) {
    super(message);
  }
}
export function registerErrors(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Rota não encontrada.',
        requestId: request.id,
        issues: [],
      },
    }),
  );
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    let failure: ApiError;
    if (error instanceof ApiError) failure = error;
    else if (error.validation)
      failure = new ApiError(
        400,
        'INVALID_REQUEST',
        'Revise os dados enviados.',
        error.validation.slice(0, 20).map((issue) => ({
          code: 'INVALID_FIELD',
          path: issue.instancePath ?? '',
        })),
      );
    else if (error.statusCode === 413)
      failure = new ApiError(
        413,
        'PAYLOAD_TOO_LARGE',
        'O projeto excede o limite de 256 KiB.',
      );
    else if (error.statusCode === 415)
      failure = new ApiError(
        415,
        'UNSUPPORTED_MEDIA_TYPE',
        'Envie JSON sem compressão.',
      );
    else if (error.statusCode === 400)
      failure = new ApiError(
        400,
        'INVALID_REQUEST',
        'A requisição é inválida.',
      );
    else if (
      [
        'P1001',
        'P1002',
        'P1017',
        'P2024',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ].includes(error.code ?? '')
    )
      failure = new ApiError(
        503,
        'SERVICE_UNAVAILABLE',
        'O banco está indisponível. Tente novamente.',
      );
    else {
      failure = new ApiError(
        500,
        'INTERNAL_ERROR',
        'Não foi possível concluir a operação.',
      );
      app.log.error(
        { requestId: request.id, code: error.code },
        'Falha interna na API',
      );
    }
    return reply.code(failure.status).send({
      error: {
        code: failure.code,
        message: failure.message,
        requestId: request.id,
        issues: failure.issues,
      },
    });
  });
}
