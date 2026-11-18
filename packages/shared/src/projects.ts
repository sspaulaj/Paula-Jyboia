import {
  documentSchema as legacyDocumentSchema,
  validateDocument as validateLegacyDocument,
  type ProjectDocument as LegacyDocument,
  type DocumentIssue,
} from '@jyboia/block-engine/validation';
import {
  editorDocumentSchema,
  validateEditorDocument,
  type EditorDocument,
} from '@jyboia/block-engine/editor-document';
type ProjectDocument = LegacyDocument | EditorDocument;
export const documentSchema = {
  oneOf: [legacyDocumentSchema, editorDocumentSchema],
};
export function validateDocument(input: unknown) {
  return input &&
    typeof input === 'object' &&
    'schemaVersion' in input &&
    input.schemaVersion === 2
    ? validateEditorDocument(input)
    : validateLegacyDocument(input);
}
export type { ProjectDocument, DocumentIssue };
export interface ProjectInput {
  name: string;
  description: string;
  workspaceData: ProjectDocument;
  formatVersion: 1 | 2;
}
export interface ProjectResource extends ProjectInput {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export type ProjectSummary = Omit<ProjectResource, 'workspaceData'>;
export interface ProjectPage {
  items: ProjectSummary[];
  total: number;
  limit: number;
  offset: number;
}
export const projectInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'workspaceData', 'formatVersion'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      pattern: '^[^\\u0000]*$',
    },
    description: { type: 'string', maxLength: 2000, pattern: '^[^\\u0000]*$' },
    workspaceData: { type: 'object' },
    formatVersion: { type: 'integer' },
  },
} as const;
export const idParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;
export const projectSummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'name',
    'description',
    'formatVersion',
    'revision',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: projectInputSchema.properties.name,
    description: projectInputSchema.properties.description,
    formatVersion: { type: 'integer', enum: [1, 2] },
    revision: { type: 'integer', minimum: 1 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;
export const projectResourceSchema = {
  ...projectSummarySchema,
  required: [...projectSummarySchema.required, 'workspaceData'],
  properties: {
    ...projectSummarySchema.properties,
    workspaceData: documentSchema,
  },
};
export const listProjectsSchema = {
  type: 'object',
  required: ['items', 'limit', 'offset', 'total'],
  additionalProperties: false,
  properties: {
    items: { type: 'array', items: projectSummarySchema },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    total: { type: 'integer' },
  },
};
export const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  additionalProperties: false,
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message', 'requestId', 'issues'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['code', 'path'],
            additionalProperties: false,
            properties: {
              code: { type: 'string' },
              path: { type: 'string' },
              blockId: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
export const projectExample: ProjectInput & { workspaceData: LegacyDocument } =
  {
    name: 'Meu primeiro programa',
    description: '',
    formatVersion: 1,
    workspaceData: {
      schemaVersion: 1,
      program: {
        entryBlockId: 'start1',
        blocks: [
          { id: 'start1', type: 'start', parameters: {}, next: 'move1' },
          {
            id: 'move1',
            type: 'move',
            parameters: { actorId: 'actor1', steps: 10 },
            next: 'say1',
          },
          {
            id: 'say1',
            type: 'say',
            parameters: { actorId: 'actor1', text: 'Olá' },
            next: null,
          },
        ],
      },
      actors: [
        {
          id: 'actor1',
          name: 'Jyboia',
          initialState: { x: 0, y: 0, heading: 0 },
        },
      ],
      layout: [{ blockId: 'start1', x: 24, y: 24 }],
    },
  };
