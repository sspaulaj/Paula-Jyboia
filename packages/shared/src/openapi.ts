import { healthResponseSchema } from './index.js';
import {
  projectInputSchema,
  projectResourceSchema,
  listProjectsSchema,
  errorResponseSchema,
  documentSchema,
  projectExample,
} from './projects.js';
const json = (schema: unknown) => ({ 'application/json': { schema } });
const error = {
  description: 'Erro padronizado.',
  content: json(errorResponseSchema),
};
const errors = Object.fromEntries(
  [400, 404, 412, 413, 415, 422, 428, 500, 503].map((code) => [code, error]),
);
const etag = {
  ETag: {
    description: 'Revisão entre aspas para If-Match.',
    schema: { type: 'string', example: '"1"' },
  },
};
const id = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const revision = {
  name: 'If-Match',
  in: 'header',
  required: true,
  schema: { type: 'string', pattern: '^"[1-9][0-9]*"$' },
  description: 'ETag da última consulta; não aceita *.',
};
const body = {
  required: true,
  content: {
    'application/json': {
      schema: {
        ...projectInputSchema,
        properties: {
          ...projectInputSchema.properties,
          formatVersion: { type: 'integer', enum: [1, 2] },
          workspaceData: documentSchema,
        },
      },
      example: projectExample,
    },
  },
};
const projectResponse = {
  description: 'Projeto completo.',
  headers: etag,
  content: json(projectResourceSchema),
};
export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Jyboia API local',
    version: '0.1.0',
    description:
      'Sem autenticação ou proprietários: todos os projetos da instalação são acessíveis. Somente desenvolvimento local em loopback. Não expor publicamente sem política de acesso. Corpos até 256 KiB; até 200 blocos. O servidor não executa programas.',
  },
  servers: [{ url: 'http://127.0.0.1:3001' }],
  paths: {
    '/health': {
      get: {
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Liveness sem banco.',
            content: json(healthResponseSchema),
          },
        },
      },
    },
    '/api/projects': {
      post: {
        operationId: 'createProject',
        requestBody: body,
        responses: {
          201: {
            ...projectResponse,
            headers: {
              ...etag,
              Location: {
                schema: { type: 'string' },
                description: 'URL relativa do projeto criado.',
              },
            },
          },
          ...errors,
        },
      },
      get: {
        operationId: 'listProjects',
        description:
          'Metadados de todos os projetos da instalação. Ordenação por createdAt decrescente e id crescente; paginação por offset não é snapshot entre requisições.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 0,
              maximum: 999999,
              default: 0,
            },
          },
        ],
        responses: {
          200: {
            description: 'Página de metadados, sem workspaceData.',
            content: json(listProjectsSchema),
          },
          ...errors,
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        operationId: 'getProject',
        parameters: [id],
        responses: { 200: projectResponse, ...errors },
      },
      put: {
        operationId: 'replaceProject',
        parameters: [id, revision],
        requestBody: body,
        responses: { 200: projectResponse, ...errors },
      },
      delete: {
        operationId: 'deleteProject',
        parameters: [id, revision],
        responses: {
          204: { description: 'Projeto excluído, sem corpo.' },
          ...errors,
        },
      },
    },
  },
};
