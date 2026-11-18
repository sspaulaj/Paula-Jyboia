import { Ajv } from 'ajv';

export type ProgramBlock = { id: string; next: string | null } & (
  | { type: 'start'; parameters: Record<string, never> }
  | { type: 'move'; parameters: { actorId: string; steps: number } }
  | { type: 'turn'; parameters: { actorId: string; degrees: number } }
  | { type: 'say'; parameters: { actorId: string; text: string } }
);
export interface ProjectDocument {
  schemaVersion: 1;
  program: { entryBlockId: string | null; blocks: ProgramBlock[] };
  actors: {
    id: string;
    name: string;
    initialState: { x: number; y: number; heading: number };
  }[];
  layout: { blockId: string; x: number; y: number }[];
}
export interface DocumentIssue {
  code: string;
  path: string;
  blockId?: string;
}
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: 'object', properties, required, additionalProperties: false });
export const textSchema = (maxLength: number, minLength = 0) => ({
  type: 'string',
  minLength,
  maxLength,
  pattern: '^[^\\u0000]*$',
});
const id = { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_-]{0,63}$' };
const nullableId = { anyOf: [id, { type: 'null' }] };
const number = (minimum: number, maximum: number, integer = false) => ({
  type: integer ? 'integer' : 'number',
  minimum,
  maximum,
});
const block = (type: string, parameters: Record<string, unknown>) =>
  object({
    id,
    type: { const: type, type: 'string' },
    parameters: object(parameters),
    next: nullableId,
  });
export const documentSchema = object({
  schemaVersion: { type: 'integer', const: 1 },
  program: object({
    entryBlockId: nullableId,
    blocks: {
      type: 'array',
      maxItems: 200,
      items: {
        oneOf: [
          block('start', {}),
          block('move', { actorId: id, steps: number(-480, 480, true) }),
          block('turn', { actorId: id, degrees: number(-360, 360, true) }),
          block('say', { actorId: id, text: textSchema(120) }),
        ],
      },
    },
  }),
  actors: {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: object({
      id,
      name: textSchema(80, 1),
      initialState: object({
        x: number(-240, 240),
        y: number(-180, 180),
        heading: { type: 'number', minimum: 0, exclusiveMaximum: 360 },
      }),
    }),
  },
  layout: {
    type: 'array',
    maxItems: 200,
    items: object({
      blockId: id,
      x: number(-100000, 100000),
      y: number(-100000, 100000),
    }),
  },
});
const validateShape = new Ajv({
  allErrors: false,
  coerceTypes: false,
  removeAdditional: false,
  strictNumbers: true,
}).compile<ProjectDocument>(documentSchema);

/** Valida dados não confiáveis sem executá-los; complexidade limitada a 200 blocos. */
export function validateDocument(
  input: unknown,
):
  | { valid: true; document: ProjectDocument }
  | { valid: false; issues: DocumentIssue[] } {
  if (!validateShape(input))
    return {
      valid: false,
      issues: (validateShape.errors ?? []).slice(0, 20).map((error) => ({
        code: 'INVALID_STRUCTURE',
        path: error.instancePath,
      })),
    };
  const issues: DocumentIssue[] = [];
  // JSON pode conter surrogates isolados que PostgreSQL JSONB não aceita.
  const strings = [
    input.actors[0]!.name,
    ...input.program.blocks.flatMap((item) =>
      item.type === 'say' ? [item.parameters.text] : [],
    ),
  ];
  if (
    strings.some((value) =>
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
        value,
      ),
    )
  )
    issues.push({ code: 'INVALID_UNICODE', path: '' });
  const blocks = input.program.blocks;
  const byId = new Map(blocks.map((item) => [item.id, item]));
  if (byId.size !== blocks.length)
    issues.push({ code: 'DUPLICATE_ID', path: '/program/blocks' });
  const predecessors = new Set<string>();
  blocks.forEach((item, index) => {
    const path = `/program/blocks/${index}`;
    if (
      item.type !== 'start' &&
      item.parameters.actorId !== input.actors[0]!.id
    )
      issues.push({
        code: 'UNKNOWN_ACTOR',
        path: `${path}/parameters/actorId`,
        blockId: item.id,
      });
    if (item.next !== null) {
      const target = byId.get(item.next);
      if (!target)
        issues.push({
          code: 'MISSING_TARGET',
          path: `${path}/next`,
          blockId: item.id,
        });
      else if (target.type === 'start')
        issues.push({
          code: 'INVALID_CONNECTION',
          path: `${path}/next`,
          blockId: item.id,
        });
      if (predecessors.has(item.next))
        issues.push({
          code: 'MULTIPLE_PREDECESSORS',
          path: `${path}/next`,
          blockId: item.id,
        });
      predecessors.add(item.next);
    }
  });
  const visited = new Set<string>();
  for (const item of blocks) {
    const chain = new Set<string>();
    let current: ProgramBlock | undefined = item;
    while (current && !visited.has(current.id)) {
      if (chain.has(current.id)) {
        issues.push({
          code: 'CYCLE',
          path: '/program/blocks',
          blockId: current.id,
        });
        break;
      }
      chain.add(current.id);
      current = current.next === null ? undefined : byId.get(current.next);
    }
    for (const key of chain) visited.add(key);
  }
  if (
    input.program.entryBlockId !== null &&
    byId.get(input.program.entryBlockId)?.type !== 'start'
  )
    issues.push({ code: 'INVALID_ENTRY', path: '/program/entryBlockId' });
  const layoutIds = new Set<string>();
  input.layout.forEach((position, index) => {
    if (!byId.has(position.blockId) || layoutIds.has(position.blockId))
      issues.push({ code: 'INVALID_LAYOUT', path: `/layout/${index}/blockId` });
    layoutIds.add(position.blockId);
  });
  return issues.length
    ? { valid: false, issues: issues.slice(0, 20) }
    : { valid: true, document: input };
}
