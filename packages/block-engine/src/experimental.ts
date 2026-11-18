/** Modelo do editor local. Não é o ProjectDocument v1 persistido pela API. */
export type PrototypeBlock = { id: string; next: string | null } & (
  | { kind: 'start' }
  | { kind: 'move'; steps: number }
  | { kind: 'turn'; degrees: number }
  | { kind: 'goto'; x: number; y: number }
  | { kind: 'say'; text: string }
  | { kind: 'show' | 'hide' }
  | { kind: 'wait'; seconds: number }
  | { kind: 'repeat'; times: number; body: string | null }
  | { kind: 'forever'; body: string | null }
  | { kind: 'if'; condition: string | null; body: string | null }
  | { kind: 'gt' | 'lt' | 'eq'; left: string; right: string }
  | { kind: 'set' | 'change'; name: string; value: number }
);
export interface PrototypeProgram {
  readonly blocks: readonly PrototypeBlock[];
  readonly entryBlockIds?: readonly string[];
}
export type ConnectionSlot = 'next' | 'body' | 'condition';
export const blockKinds = [
  'start',
  'move',
  'turn',
  'goto',
  'say',
  'show',
  'hide',
  'wait',
  'repeat',
  'forever',
  'if',
  'gt',
  'lt',
  'eq',
  'set',
  'change',
] as const;
export const isOperator = (block: PrototypeBlock) =>
  ['gt', 'lt', 'eq'].includes(block.kind);
export function connections(
  block: PrototypeBlock,
): { slot: ConnectionSlot; id: string }[] {
  const result: { slot: ConnectionSlot; id: string }[] = [];
  if (block.next) result.push({ slot: 'next', id: block.next });
  if ('body' in block && block.body)
    result.push({ slot: 'body', id: block.body });
  if (block.kind === 'if' && block.condition)
    result.push({ slot: 'condition', id: block.condition });
  return result;
}
export function acceptsConnection(
  parent: PrototypeBlock,
  child: PrototypeBlock,
  slot: ConnectionSlot,
) {
  if (parent.id === child.id || child.kind === 'start') return false;
  if (slot === 'condition') return parent.kind === 'if' && isOperator(child);
  if (isOperator(parent) || isOperator(child)) return false;
  return slot === 'next' || (slot === 'body' && 'body' in parent);
}
export class ProgramError extends Error {
  constructor(
    public readonly code: string,
    public readonly blockId?: string,
  ) {
    super(code);
  }
}
export function canConnect(
  program: PrototypeProgram,
  id: string,
  targetId: string,
  slot: ConnectionSlot,
): boolean {
  const child = program.blocks.find((block) => block.id === id);
  const parent = program.blocks.find((block) => block.id === targetId);
  if (
    !child ||
    !parent ||
    !acceptsConnection(parent, child, slot) ||
    connections(parent).some((edge) => edge.slot === slot)
  )
    return false;
  const blocks = program.blocks.map((block) => {
    const copy = { ...block };
    for (const edge of connections(copy))
      if (edge.id === id) Object.assign(copy, { [edge.slot]: null });
    if (copy.id === targetId) Object.assign(copy, { [slot]: id });
    return copy;
  });
  try {
    inspectProgram({ blocks });
    return true;
  } catch {
    return false;
  }
}
const variableName = /^[\p{L}_][\p{L}\p{N}_ ]{0,31}$/u;
export const validOperand = (value: string) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  ((Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 1e9) ||
    variableName.test(value));

/** Valida floresta tipada, sem depender de coordenadas ou da ordem do array. */
export function inspectProgram(program: PrototypeProgram) {
  const byId = new Map(program.blocks.map((block) => [block.id, block]));
  if (byId.size !== program.blocks.length)
    throw new ProgramError('DUPLICATE_ID');
  if (program.blocks.length > 200) throw new ProgramError('BLOCK_LIMIT');
  const predecessors = new Map<string, string>();
  const parents = new Map<string, { id: string; slot: ConnectionSlot }>();
  for (const block of program.blocks) {
    const fail = (code: string): never => {
      throw new ProgramError(code, block.id);
    };
    const number = (value: number, min: number, max: number, integer = true) =>
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (!integer || Number.isInteger(value));
    if (!blockKinds.includes(block.kind)) fail('UNKNOWN_BLOCK_TYPE');
    if (block.kind === 'move' && !number(block.steps, -480, 480))
      fail('INVALID_STEPS');
    if (block.kind === 'turn' && !number(block.degrees, -360, 0))
      fail('INVALID_DEGREES');
    if (
      block.kind === 'goto' &&
      (!number(block.x, -240, 240) || !number(block.y, -180, 180))
    )
      fail('INVALID_POSITION');
    if (
      block.kind === 'say' &&
      (typeof block.text !== 'string' ||
        block.text.length > 120 ||
        block.text.includes('\0'))
    )
      fail('INVALID_TEXT');
    if (block.kind === 'wait' && !number(block.seconds, 0, 30, false))
      fail('INVALID_WAIT');
    if (block.kind === 'repeat' && !number(block.times, 0, 1000))
      fail('INVALID_REPEAT');
    if (
      (block.kind === 'set' || block.kind === 'change') &&
      (!variableName.test(block.name) || !number(block.value, -1e9, 1e9, false))
    )
      fail('INVALID_VARIABLE');
    if (
      (block.kind === 'gt' || block.kind === 'lt' || block.kind === 'eq') &&
      (!validOperand(block.left) || !validOperand(block.right))
    )
      fail('INVALID_OPERAND');
    for (const edge of connections(block)) {
      const target = byId.get(edge.id);
      if (!target) fail('MISSING_TARGET');
      if (!acceptsConnection(block, target!, edge.slot))
        fail('INVALID_CONNECTION');
      if (parents.has(edge.id)) fail('MULTIPLE_PREDECESSORS');
      parents.set(edge.id, { id: block.id, slot: edge.slot });
      predecessors.set(edge.id, block.id);
    }
  }
  const visited = new Set<string>();
  function walk(
    block: PrototypeBlock,
    nesting: number,
    path: Set<string>,
    output: PrototypeBlock[],
  ) {
    if (path.has(block.id)) throw new ProgramError('CYCLE', block.id);
    if (nesting > 20) throw new ProgramError('DEPTH_LIMIT', block.id);
    if (visited.has(block.id)) return;
    visited.add(block.id);
    output.push(block);
    const nextPath = new Set(path).add(block.id);
    const edges = connections(block).sort(
      (a, b) =>
        ({ condition: 0, body: 1, next: 2 })[a.slot] -
        { condition: 0, body: 1, next: 2 }[b.slot],
    );
    for (const edge of edges)
      walk(
        byId.get(edge.id)!,
        nesting + (edge.slot === 'next' ? 0 : 1),
        nextPath,
        output,
      );
  }
  const roots = program.blocks
    .filter((block) => !parents.has(block.id))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const chains = roots.map((root) => {
    const chain: PrototypeBlock[] = [];
    walk(root, 0, new Set(), chain);
    return chain;
  });
  if (visited.size !== program.blocks.length) throw new ProgramError('CYCLE');
  if (
    program.entryBlockIds &&
    (new Set(program.entryBlockIds).size !== program.entryBlockIds.length ||
      program.entryBlockIds.some((id) => byId.get(id)?.kind !== 'start'))
  )
    throw new ProgramError('INVALID_ENTRY');
  const starts = roots.filter(
    (block) =>
      block.kind === 'start' &&
      (!program.entryBlockIds || program.entryBlockIds.includes(block.id)),
  );
  const sequence = chains
    .filter((chain) => starts.some((start) => start.id === chain[0]?.id))
    .flat();
  return {
    chains,
    sequence,
    predecessors,
    parents,
    starts,
    ambiguousStart: starts.length > 1,
  };
}
