import {
  inspectProgram,
  ProgramError,
  type PrototypeBlock,
  type PrototypeProgram,
} from './experimental.js';

export interface ActorState {
  x: number;
  y: number;
  heading: number;
  message: string;
  visible: boolean;
  variables: Record<string, number>;
}
export const initialActorState = (): ActorState => ({
  x: 0,
  y: 0,
  heading: 0,
  message: '',
  visible: true,
  variables: {},
});
type EventData =
  | { type: 'runStarted' | 'runCompleted' | 'runCancelled' }
  | { type: 'runFailed'; code: string; blockId?: string }
  | { type: 'commandStarted'; blockId: string }
  | {
      type: 'actorStateChanged';
      blockId: string;
      actorId: 'actor1';
      state: ActorState;
    };
export type ExecutionEvent = EventData & { runId: string; sequence: number };

/** Interpretador cooperativo: um comando por avanço; nenhuma geração de código. */
export function createExecution(
  program: PrototypeProgram,
  runId: string,
  now: () => number,
  initial: Pick<ActorState, 'x' | 'y' | 'heading'> = { x: 0, y: 0, heading: 0 },
) {
  const inspected = inspectProgram(program);
  if (!inspected.starts.length) throw new ProgramError('INVALID_ENTRY');
  for (const block of inspected.sequence) {
    if (block.kind === 'if' && !block.condition)
      throw new ProgramError('MISSING_CONDITION', block.id);
  }
  const byId = new Map(program.blocks.map((block) => [block.id, { ...block }]));
  let state = { ...initialActorState(), ...initial };
  const variables = new Map<string, number>();
  const operand = (text: string, blockId: string) => {
    if (Number.isFinite(Number(text))) return Number(text);
    if (!variables.has(text))
      throw new ProgramError('UNKNOWN_VARIABLE', blockId);
    return variables.get(text)!;
  };
  const condition = (id: string) => {
    const block = byId.get(id)!;
    if (block.kind !== 'gt' && block.kind !== 'lt' && block.kind !== 'eq')
      throw new ProgramError('INVALID_CONDITION', id);
    const left = operand(block.left, id),
      right = operand(block.right, id);
    return block.kind === 'gt'
      ? left > right
      : block.kind === 'lt'
        ? left < right
        : left === right;
  };
  function* commands(id: string | null): Generator<PrototypeBlock> {
    while (id) {
      const block = byId.get(id)!;
      yield block;
      if (block.kind === 'repeat') {
        for (let i = 0; i < block.times; i++) {
          if (i > 0) yield block;
          yield* commands(block.body);
        }
      } else if (block.kind === 'forever') {
        while (true) {
          yield* commands(block.body);
          yield block;
        }
      } else if (block.kind === 'if' && condition(block.condition!)) {
        yield* commands(block.body);
      }
      id = block.next;
    }
  }
  const fibers = inspected.starts.map((start) => ({
    iterator: commands(start.next),
    readyAt: 0,
    done: false,
  }));
  let cursor = 0,
    steps = 0,
    sequence = 0;
  let started = false,
    finished = false;
  const startedAt = now();
  const emit = (event: EventData): ExecutionEvent => ({
    ...event,
    runId,
    sequence: ++sequence,
  });
  const round = (value: number) => Math.round(value * 1e6) / 1e6 || 0;
  return {
    advance(): ExecutionEvent[] {
      if (finished) return [];
      if (!started) {
        started = true;
        return [emit({ type: 'runStarted' })];
      }
      if (now() - startedAt >= 30000 || steps >= 1000) {
        finished = true;
        return [emit({ type: 'runFailed', code: 'EXECUTION_LIMIT' })];
      }
      try {
        for (let checked = 0; checked < fibers.length; checked++) {
          const fiber = fibers[cursor++ % fibers.length]!;
          if (fiber.done || fiber.readyAt > now()) continue;
          const command = fiber.iterator.next();
          if (command.done) {
            fiber.done = true;
            continue;
          }
          const block = command.value;
          steps++;
          switch (block.kind) {
            case 'move': {
              state = {
                ...state,
                x: round(Math.max(-240, Math.min(240, state.x + block.steps))),
              };
              break;
            }
            case 'turn':
              state = {
                ...state,
                heading: (((state.heading + block.degrees) % 360) + 360) % 360,
              };
              break;
            case 'goto':
              state = { ...state, x: block.x, y: block.y };
              break;
            case 'say':
              state = { ...state, message: block.text };
              break;
            case 'show':
            case 'hide':
              state = { ...state, visible: block.kind === 'show' };
              break;
            case 'wait':
              fiber.readyAt = now() + block.seconds * 1000;
              break;
            case 'set':
            case 'change': {
              if (block.kind === 'change' && !variables.has(block.name))
                throw new ProgramError('UNKNOWN_VARIABLE', block.id);
              const value =
                block.kind === 'set'
                  ? block.value
                  : variables.get(block.name)! + block.value;
              if (!Number.isFinite(value) || Math.abs(value) > 1e9)
                throw new ProgramError('NUMERIC_LIMIT', block.id);
              variables.set(block.name, value);
              state = { ...state, variables: Object.fromEntries(variables) };
              break;
            }
          }
          return [
            emit({ type: 'commandStarted', blockId: block.id }),
            emit({
              type: 'actorStateChanged',
              blockId: block.id,
              actorId: 'actor1',
              state: { ...state, variables: { ...state.variables } },
            }),
          ];
        }
        if (fibers.every((fiber) => fiber.done)) {
          finished = true;
          return [emit({ type: 'runCompleted' })];
        }
        return [];
      } catch (error) {
        finished = true;
        const diagnostic =
          error instanceof ProgramError
            ? error
            : new ProgramError('EXECUTION_FAILED');
        return [
          emit({
            type: 'runFailed',
            code: diagnostic.code,
            ...(diagnostic.blockId ? { blockId: diagnostic.blockId } : {}),
          }),
        ];
      }
    },
    cancel(): ExecutionEvent[] {
      if (finished) return [];
      finished = true;
      const events: ExecutionEvent[] = [];
      if (!started) {
        started = true;
        events.push(emit({ type: 'runStarted' }));
      }
      events.push(emit({ type: 'runCancelled' }));
      return events;
    },
  };
}
