import { Ajv } from 'ajv';
import {
  inspectProgram,
  ProgramError,
  type PrototypeProgram,
} from './experimental.js';
import type { DocumentIssue, ProjectDocument } from './document.js';
export interface EditorDocument {
  schemaVersion: 2;
  program: PrototypeProgram & { entryBlockIds: string[] };
  initialState: { x: number; y: number; heading: number };
  layout: { blockId: string; x: number; y: number }[];
}
const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const id = {
  type: 'string',
  minLength: 1,
  maxLength: 128,
  pattern: '^[^\\u0000-\\u001f]+$',
};
const ref = { anyOf: [id, { type: 'null' }] };
const numeric = (minimum: number, maximum: number, integer = true) => ({
  type: integer ? 'integer' : 'number',
  minimum,
  maximum,
});
const text = (maxLength: number, minLength = 0) => ({
  type: 'string',
  minLength,
  maxLength,
  pattern: '^[^\\u0000]*$',
});
const block = (kind: string, properties: Record<string, unknown> = {}) =>
  object({
    id,
    kind: { type: 'string', const: kind },
    next: ref,
    ...properties,
  });
export const editorDocumentSchema = object({
  schemaVersion: { type: 'integer', const: 2 },
  program: object({
    entryBlockIds: {
      type: 'array',
      maxItems: 200,
      uniqueItems: true,
      items: id,
    },
    blocks: {
      type: 'array',
      maxItems: 200,
      items: {
        oneOf: [
          block('start'),
          block('actorClick'),
          block('changeX', { amount: numeric(-480, 480) }),
          block('changeY', { amount: numeric(-480, 480) }),
          block('direction', { degrees: numeric(-360, 360) }),
          block('sayFor', { text: text(120), seconds: numeric(0, 30, false) }),
          block('ifElse', { condition: ref, body: ref, elseBody: ref }),
          block('move', { steps: numeric(-480, 480) }),
          block('turn', { degrees: numeric(-360, 0) }),
          block('goto', { x: numeric(-240, 240), y: numeric(-180, 180) }),
          block('say', { text: text(120) }),
          block('show'),
          block('hide'),
          block('wait', { seconds: numeric(0, 30, false) }),
          block('repeat', { times: numeric(0, 1000), body: ref }),
          block('forever', { body: ref }),
          block('if', { condition: ref, body: ref }),
          ...['gt', 'lt', 'eq'].map((kind) =>
            block(kind, { left: text(32, 1), right: text(32, 1) }),
          ),
          ...['set', 'change'].map((kind) =>
            block(kind, {
              name: text(32, 1),
              value: numeric(-1e9, 1e9, false),
            }),
          ),
        ],
      },
    },
  }),
  initialState: object({
    x: numeric(-240, 240, false),
    y: numeric(-180, 180, false),
    heading: { type: 'number', minimum: 0, exclusiveMaximum: 360 },
  }),
  layout: {
    type: 'array',
    maxItems: 200,
    items: object({
      blockId: id,
      x: numeric(-100000, 100000, false),
      y: numeric(-100000, 100000, false),
    }),
  },
});
const shape = new Ajv({
  coerceTypes: false,
  removeAdditional: false,
  strictNumbers: true,
}).compile<EditorDocument>(editorDocumentSchema);
export function validateEditorDocument(
  input: unknown,
):
  | { valid: true; document: EditorDocument }
  | { valid: false; issues: DocumentIssue[] } {
  if (!shape(input))
    return {
      valid: false,
      issues: [
        {
          code: 'INVALID_STRUCTURE',
          path: shape.errors?.[0]?.instancePath ?? '',
        },
      ],
    };
  const strings: string[] = [];
  for (const block of input.program.blocks)
    for (const value of Object.values(block))
      if (typeof value === 'string') strings.push(value);
  if (
    strings.some((value) =>
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
        value,
      ),
    )
  )
    return {
      valid: false,
      issues: [{ code: 'INVALID_UNICODE', path: '/program/blocks' }],
    };
  try {
    inspectProgram(input.program);
  } catch (error) {
    const issue =
      error instanceof ProgramError
        ? error
        : new ProgramError('INVALID_STRUCTURE');
    return {
      valid: false,
      issues: [
        {
          code: issue.code,
          path: '/program',
          ...(issue.blockId ? { blockId: issue.blockId } : {}),
        },
      ],
    };
  }
  const ids = new Set(input.program.blocks.map((block) => block.id));
  const layoutIds = new Set<string>();
  for (const item of input.layout) {
    if (!ids.has(item.blockId) || layoutIds.has(item.blockId))
      return {
        valid: false,
        issues: [{ code: 'INVALID_LAYOUT', path: '/layout' }],
      };
    layoutIds.add(item.blockId);
  }
  return { valid: true, document: input };
}
/** Conversão explícita v1 → v2. O original no servidor só muda ao salvar. */
export function upgradeDocument(
  document: ProjectDocument | EditorDocument,
): EditorDocument {
  if (document.schemaVersion === 2)
    return {
      ...document,
      initialState: { ...document.initialState },
      layout: document.layout.map((item) => ({ ...item })),
      program: {
        entryBlockIds: [...document.program.entryBlockIds],
        blocks: document.program.blocks.map((block) => ({ ...block })),
      },
    };
  return {
    schemaVersion: 2,
    initialState: { ...document.actors[0]!.initialState },
    layout: document.layout.map((item) => ({ ...item })),
    program: {
      entryBlockIds: document.program.entryBlockId
        ? [document.program.entryBlockId]
        : [],
      blocks: document.program.blocks.map((block) => {
        const base = { id: block.id, next: block.next };
        switch (block.type) {
          case 'start':
            return { ...base, kind: 'start' };
          case 'move':
            return { ...base, kind: 'move', steps: block.parameters.steps };
          case 'turn':
            return {
              ...base,
              kind: 'turn',
              degrees:
                block.parameters.degrees > 0
                  ? block.parameters.degrees - 360
                  : block.parameters.degrees,
            };
          case 'say':
            return { ...base, kind: 'say', text: block.parameters.text };
        }
      }),
    },
  };
}
