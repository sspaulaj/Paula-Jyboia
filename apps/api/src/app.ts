import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthResponseSchema, type HealthResponse } from '@jyboia/shared';
import type { PrismaClient } from './generated/prisma/client.js';
import { registerErrors, ApiError } from './errors.js';
import { ProjectRepository } from './project-repository.js';
import { ProjectService } from './project-service.js';
import { registerProjectRoutes } from './project-routes.js';
import { openApiDocument } from '@jyboia/shared/openapi';

export async function buildApp(options: {
  webOrigin: string;
  logger?: boolean;
  database?: PrismaClient;
}) {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 256 * 1024,
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,
        useDefaults: false,
      },
    },
  });
  await app.register(cors, {
    origin: [options.webOrigin],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'If-Match'],
    exposedHeaders: ['ETag', 'Location'],
    credentials: false,
  });
  registerErrors(app);
  app.get('/openapi.json', async () => openApiDocument);
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (
      ['POST', 'PUT'].includes(request.method) &&
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers['content-type'] ?? '',
      )
    )
      throw new ApiError(
        415,
        'UNSUPPORTED_MEDIA_TYPE',
        'Envie Content-Type application/json.',
      );
    if (
      request.headers['content-encoding'] &&
      request.headers['content-encoding'] !== 'identity'
    )
      throw new ApiError(
        415,
        'UNSUPPORTED_MEDIA_TYPE',
        'Envie JSON sem compressão.',
      );
  });
  await registerProjectRoutes(
    app,
    options.database
      ? new ProjectService(new ProjectRepository(options.database))
      : undefined,
  );
  app.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: { response: { 200: healthResponseSchema } },
    },
    async () => ({ status: 'ok', service: 'jyboia-api' }),
  );
  return app;
}
