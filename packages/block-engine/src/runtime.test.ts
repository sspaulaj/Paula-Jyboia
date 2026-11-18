import { describe, expect, it } from 'vitest';
import { createExecution, type ExecutionEvent } from './runtime.js';
import type { PrototypeProgram } from './experimental.js';

const program: PrototypeProgram = {
  blocks: [
    { id: 'move', kind: 'move', steps: 10, next: null },
    { id: 'loose', kind: 'move', steps: 100, next: null },
    { id: 'start', kind: 'start', next: 'move' },
  ],
};

describe('execução do programa experimental', () => {
  it('executa uma cópia dos parâmetros e rejeita comandos desconhecidos', () => {
    const move = { id: 'm', kind: 'move' as const, steps: 10, next: null };
    const run = createExecution(
      { blocks: [{ id: 's', kind: 'start', next: 'm' }, move] },
      'snapshot',
      () => 0,
    );
    move.steps = 100;
    run.advance();
    expect(run.advance()[1]).toMatchObject({ state: { x: 10 } });
    const invalid = {
      blocks: [{ id: 's', kind: 'script', next: null }],
    } as unknown as PrototypeProgram;
    expect(() => createExecution(invalid, 'invalid', () => 0)).toThrow(
      'UNKNOWN_BLOCK_TYPE',
    );
  });
  it('segue conexões, ignora blocos soltos e move dez passos', () => {
    const run = createExecution(program, 'run1', () => 0);
    const events = [...run.advance(), ...run.advance(), ...run.advance()];
    expect(events.map((event) => event.type)).toEqual([
      'runStarted',
      'commandStarted',
      'actorStateChanged',
      'runCompleted',
    ]);
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4]);
    expect(events.every((event) => event.runId === 'run1')).toBe(true);
    expect(events[2]).toMatchObject({
      blockId: 'move',
      state: { x: 10, y: 0, heading: 0, message: '' },
    });
    expect(run.advance()).toEqual([]);
    expect(run.cancel()).toEqual([]);
  });

  it('gira à direita, respeita bordas e trata fala como texto', () => {
    const run = createExecution(
      {
        blocks: [
          { id: 's', kind: 'start', next: 't' },
          { id: 't', kind: 'turn', degrees: -90, next: 'm' },
          { id: 'm', kind: 'move', steps: 480, next: 'say' },
          { id: 'say', kind: 'say', text: '<script>Olá</script>', next: null },
        ],
      },
      'run2',
      () => 0,
    );
    const events: ExecutionEvent[] = [];
    for (let i = 0; i < 5; i++) events.push(...run.advance());
    expect(
      events.filter((event) => event.type === 'actorStateChanged').at(-1),
    ).toMatchObject({
      state: { x: 240, y: 0, heading: 270, message: '<script>Olá</script>' },
    });
  });

  it.each([
    { heading: 15, steps: 10, expectedX: 30 },
    { heading: 90, steps: 10, expectedX: 30 },
    { heading: 180, steps: 10, expectedX: 30 },
    { heading: 270, steps: 10, expectedX: 30 },
    { heading: 90, steps: -10, expectedX: 10 },
    { heading: 270, steps: -480, expectedX: -240 },
  ])(
    'mover $steps altera apenas X com direção $heading',
    ({ heading, steps, expectedX }) => {
      const run = createExecution(
        {
          blocks: [
            { id: 'start', kind: 'start', next: 'move' },
            { id: 'move', kind: 'move', steps, next: null },
          ],
        },
        'horizontal',
        () => 0,
        { x: 20, y: 35, heading },
      );
      run.advance();
      expect(run.advance()[1]).toMatchObject({
        state: { x: expectedX, y: 35, heading },
      });
    },
  );

  it('interrompe antes do próximo comando e reinicia do estado inicial', () => {
    const run = createExecution(program, 'first', () => 0);
    run.advance();
    expect(run.cancel()).toEqual([
      { type: 'runCancelled', runId: 'first', sequence: 2 },
    ]);
    expect(run.advance()).toEqual([]);
    const restart = createExecution(program, 'second', () => 0);
    restart.advance();
    expect(restart.advance()[1]).toMatchObject({ state: { x: 10, y: 0 } });
  });

  it('limita duração e não emite eventos depois da falha', () => {
    let time = 0;
    const run = createExecution(program, 'timeout', () => time);
    run.advance();
    time = 30000;
    expect(run.advance()[0]).toMatchObject({
      type: 'runFailed',
      code: 'EXECUTION_LIMIT',
    });
    expect(run.advance()).toEqual([]);
  });

  it('rejeita início ausente e ciclos, aceita múltiplas entradas', () => {
    expect(() => createExecution({ blocks: [] }, 'x', () => 0)).toThrow(
      'INVALID_ENTRY',
    );
    expect(() =>
      createExecution(
        {
          blocks: [
            { id: 'a', kind: 'start', next: null },
            { id: 'b', kind: 'start', next: null },
          ],
        },
        'x',
        () => 0,
      ),
    ).not.toThrow();
    expect(() =>
      createExecution(
        { blocks: [{ id: 'm', kind: 'move', steps: 10, next: 'm' }] },
        'x',
        () => 0,
      ),
    ).toThrow('INVALID_CONNECTION');
  });
});
