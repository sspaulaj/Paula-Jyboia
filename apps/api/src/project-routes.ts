import type { FastifyInstance } from 'fastify';
import {
  idParamsSchema,
  projectInputSchema,
  projectResourceSchema,
  listProjectsSchema,
  errorResponseSchema,
  type ProjectInput,
} from '@jyboia/shared/projects';
import type { ProjectService } from './project-service.js';
import { ApiError } from './errors.js';
const errors = Object.fromEntries(
  [400, 404, 412, 413, 415, 422, 428, 500, 503].map((status) => [
    status,
    errorResponseSchema,
  ]),
);
const metadata = <T extends { createdAt: Date; updatedAt: Date }>(row: T) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
export async function registerProjectRoutes(
  app: FastifyInstance,
  service?: ProjectService,
) {
  const projects = () => {
    if (!service)
      throw new ApiError(
        503,
        'SERVICE_UNAVAILABLE',
        'O banco está indisponível.',
      );
    return service;
  };
  app.post<{ Body: ProjectInput }>(
    '/api/projects',
    {
      schema: {
        body: projectInputSchema,
        response: { 201: projectResourceSchema, ...errors },
      },
    },
    async (request, reply) => {
      const row = await projects().create(request.body);
      return reply
        .code(201)
        .header('Location', `/api/projects/${row.id}`)
        .header('ETag', `"${row.revision}"`)
        .send(metadata(row));
    },
  );
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/api/projects',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            limit: { type: 'string', pattern: '^(?:[1-9]|[1-9][0-9]|100)$' },
            offset: { type: 'string', pattern: '^(?:0|[1-9][0-9]{0,5})$' },
          },
        },
        response: { 200: listProjectsSchema, ...errors },
      },
    },
    async (request) => {
      const limit = Number(request.query.limit ?? 20),
        offset = Number(request.query.offset ?? 0);
      const [items, total] = await projects().list(limit, offset);
      return { items: items.map(metadata), total, limit, offset };
    },
  );
  app.get<{ Params: { id: string } }>(
    '/api/projects/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: projectResourceSchema, ...errors },
      },
    },
    async (request, reply) => {
      const row = await projects().get(request.params.id);
      return reply.header('ETag', `"${row.revision}"`).send(metadata(row));
    },
  );
  app.put<{ Params: { id: string }; Body: ProjectInput }>(
    '/api/projects/:id',
    {
      schema: {
        params: idParamsSchema,
        body: projectInputSchema,
        response: { 200: projectResourceSchema, ...errors },
      },
    },
    async (request, reply) => {
      const row = await projects().update(
        request.params.id,
        request.headers['if-match'],
        request.body,
      );
      return reply.header('ETag', `"${row.revision}"`).send(metadata(row));
    },
  );
  app.delete<{ Params: { id: string } }>(
    '/api/projects/:id',
    { schema: { params: idParamsSchema, response: errors } },
    async (request, reply) => {
      await projects().delete(request.params.id, request.headers['if-match']);
      return reply.code(204).send();
    },
  );
}
