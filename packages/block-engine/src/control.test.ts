import { expect, it } from 'vitest';
import {
  canConnect,
  inspectProgram,
  type PrototypeBlock,
  type PrototypeProgram,
} from './experimental.js';
import { createExecution, type ExecutionEvent } from './runtime.js';
const demo: PrototypeProgram = {
  blocks: [
    { id: 's', kind: 'start', next: 'm' },
    { id: 'm', kind: 'move', steps: 10, next: 'r' },
    { id: 'r', kind: 'repeat', times: 3, body: 'inner', next: 'if' },
    { id: 'inner', kind: 'move', steps: 10, next: null },
    { id: 'if', kind: 'if', condition: 'gt', body: 'say', next: null },
    { id: 'gt', kind: 'gt', left: '1', right: '0', next: null },
    { id: 'say', kind: 'say', text: 'Olá', next: null },
  ],
};
function collect(program: PrototypeProgram) {
  const run = createExecution(program, 'test', () => 0);
  const events: ExecutionEvent[] = [];
  for (let i = 0; i < 1100; i++) {
    const batch = run.advance();
    events.push(...batch);
    if (
      batch.some(
        (event) => event.type === 'runCompleted' || event.type === 'runFailed',
      )
    )
      break;
  }
  return events;
}
it('demonstra evento, movimento, repetição e condicional sem expandir estrutura', () => {
  const events = collect(demo);
  expect(
    events
      .filter((event) => event.type === 'commandStarted')
      .map((event) => event.blockId),
  ).toEqual(['m', 'r', 'inner', 'r', 'inner', 'r', 'inner', 'if', 'say']);
  expect(
    events.filter((event) => event.type === 'actorStateChanged').at(-1),
  ).toMatchObject({ state: { x: 40, y: 0, message: 'Olá' } });
  expect(events.at(-1)?.type).toBe('runCompleted');
});
it('zero repetições e condição falsa não executam seus corpos', () => {
  const blocks = demo.blocks.map((block) =>
    block.kind === 'repeat'
      ? { ...block, times: 0 }
      : block.kind === 'gt'
        ? { ...block, left: '0', right: '1' }
        : block,
  );
  expect(
    collect({ blocks })
      .filter((event) => event.type === 'commandStarted')
      .map((event) => event.blockId),
  ).toEqual(['m', 'r', 'if']);
});
it('sempre cede execução a outras sequências e respeita limite de passos', () => {
  const events = collect({
    blocks: [
      { id: 'a', kind: 'start', next: 'loop' },
      { id: 'loop', kind: 'forever', body: null, next: null },
      { id: 'b', kind: 'start', next: 'm' },
      { id: 'm', kind: 'move', steps: 10, next: null },
    ],
  });
  expect(
    events.some(
      (event) => event.type === 'commandStarted' && event.blockId === 'm',
    ),
  ).toBe(true);
  expect(events.at(-1)).toMatchObject({
    type: 'runFailed',
    code: 'EXECUTION_LIMIT',
  });
  expect(
    events.filter((event) => event.type === 'commandStarted'),
  ).toHaveLength(1000);
});
it('esperar usa relógio injetado e permite cancelar sem executar o sucessor', () => {
  let now = 0;
  const run = createExecution(
    {
      blocks: [
        { id: 's', kind: 'start', next: 'w' },
        { id: 'w', kind: 'wait', seconds: 2, next: 'm' },
        { id: 'm', kind: 'move', steps: 10, next: null },
      ],
    },
    'wait',
    () => now,
  );
  run.advance();
  run.advance();
  now = 1999;
  expect(run.advance()).toEqual([]);
  now = 2000;
  expect(run.advance()[0]).toMatchObject({ blockId: 'm' });
  expect(run.cancel().at(-1)?.type).toBe('runCancelled');
  expect(run.advance()).toEqual([]);
});
it('variáveis numéricas afetam comparações; texto não é executado', () => {
  const events = collect({
    blocks: [
      { id: 's', kind: 'start', next: 'set' },
      { id: 'set', kind: 'set', name: 'pontos', value: 1, next: 'change' },
      { id: 'change', kind: 'change', name: 'pontos', value: 2, next: 'if' },
      { id: 'if', kind: 'if', condition: 'eq', body: 'hide', next: 'goto' },
      { id: 'eq', kind: 'eq', left: 'pontos', right: '3', next: null },
      { id: 'hide', kind: 'hide', next: null },
      { id: 'goto', kind: 'goto', x: -20, y: 30, next: 'show' },
      { id: 'show', kind: 'show', next: null },
    ],
  });
  expect(
    events.filter((event) => event.type === 'actorStateChanged').at(-1),
  ).toMatchObject({
    state: { x: -20, y: 30, visible: true, variables: { pontos: 3 } },
  });
  expect(() =>
    inspectProgram({
      blocks: [
        { id: 'bad', kind: 'gt', left: 'alert(1)', right: '0', next: null },
      ],
    }),
  ).toThrow('INVALID_OPERAND');
});
it('valida tipos, pais únicos, profundidade e destinos sem modificar o programa', () => {
  expect(canConnect(demo, 's', 'inner', 'next')).toBe(false);
  expect(canConnect(demo, 'r', 'inner', 'next')).toBe(false);
  expect(canConnect(demo, 'gt', 'inner', 'next')).toBe(false);
  expect(canConnect(demo, 'say', 'inner', 'next')).toBe(true);
  expect(() =>
    inspectProgram({
      blocks: [
        ...demo.blocks,
        { id: 'other', kind: 'repeat', times: 1, body: 'inner', next: null },
      ],
    }),
  ).toThrow('MULTIPLE_PREDECESSORS');
  const deep: PrototypeBlock[] = Array.from({ length: 22 }, (_, i) => ({
    id: `${i}`,
    kind: 'repeat',
    times: 1,
    body: i === 21 ? null : `${i + 1}`,
    next: null,
  }));
  expect(() => inspectProgram({ blocks: deep })).toThrow('DEPTH_LIMIT');
});
