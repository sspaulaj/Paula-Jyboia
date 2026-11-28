import { expect, it } from 'vitest';
import {
  canConnect,
  inspectProgram,
  type PrototypeBlock,
} from './experimental.js';
import { createExecution, type ExecutionEvent } from './runtime.js';

const start: PrototypeBlock = { id: 'start', kind: 'start', next: 'command' };
const actorEvents = (events: ExecutionEvent[]) =>
  events.filter((event) => event.type === 'actorStateChanged');

it('altera os eixos independentemente da direção e respeita os limites do palco', () => {
  const execution = createExecution(
    {
      blocks: [
        start,
        { id: 'command', kind: 'direction', degrees: -90, next: 'x' },
        { id: 'x', kind: 'changeX', amount: 480, next: 'y' },
        { id: 'y', kind: 'changeY', amount: -480, next: 'move' },
        { id: 'move', kind: 'move', steps: -10, next: null },
      ],
    },
    'run',
    () => 0,
  );
  const events = Array.from({ length: 6 }, () => execution.advance()).flat();
  expect(actorEvents(events).at(-1)?.state).toMatchObject({
    x: 230,
    y: -180,
    heading: 270,
  });
});

it.each(['1', '0'])(
  'executa somente o ramo escolhido (%s) e depois a continuação',
  (left) => {
    const execution = createExecution(
      {
        blocks: [
          start,
          {
            id: 'command',
            kind: 'ifElse',
            condition: 'condition',
            body: 'yes',
            elseBody: 'no',
            next: 'end',
          },
          { id: 'condition', kind: 'eq', left, right: '1', next: null },
          { id: 'yes', kind: 'changeX', amount: 12, next: null },
          { id: 'no', kind: 'changeY', amount: 18, next: null },
          { id: 'end', kind: 'say', text: 'Fim', next: null },
        ],
      },
      'run',
      () => 0,
    );
    const events = Array.from({ length: 6 }, () => execution.advance()).flat();
    expect(
      events
        .filter((event) => event.type === 'commandStarted')
        .map((event) => event.blockId),
    ).toEqual(['command', left === '1' ? 'yes' : 'no', 'end']);
    expect(actorEvents(events).at(-1)?.state).toMatchObject({
      x: left === '1' ? 12 : 0,
      y: left === '0' ? 18 : 0,
      message: 'Fim',
    });
  },
);

it('aguarda a fala temporizada, limpa a mensagem e permite cancelar a espera', () => {
  let clock = 0;
  const program = {
    blocks: [
      start,
      { id: 'command', kind: 'sayFor', text: 'Olá', seconds: 2, next: 'end' },
      { id: 'end', kind: 'move', steps: 10, next: null },
    ] as PrototypeBlock[],
  };
  const execution = createExecution(program, 'run', () => clock);
  execution.advance();
  expect(actorEvents(execution.advance())[0]?.state.message).toBe('Olá');
  clock = 1999;
  expect(execution.advance()).toEqual([]);
  clock = 2000;
  expect(actorEvents(execution.advance())[0]?.state.message).toBe('');
  expect(actorEvents(execution.advance())[0]?.state.x).toBe(10);
  const cancelled = createExecution(program, 'cancel', () => clock);
  cancelled.advance();
  cancelled.advance();
  expect(cancelled.cancel().at(-1)?.type).toBe('runCancelled');
  clock += 3000;
  expect(cancelled.advance()).toEqual([]);
});

it('uma fala temporizada antiga não apaga a fala de outra sequência', () => {
  let clock = 0;
  const execution = createExecution(
    {
      blocks: [
        start,
        {
          id: 'command',
          kind: 'sayFor',
          text: 'Antiga',
          seconds: 1,
          next: null,
        },
        { id: 'start2', kind: 'start', next: 'new' },
        { id: 'new', kind: 'say', text: 'Nova', next: null },
      ],
    },
    'run',
    () => clock,
  );
  execution.advance();
  execution.advance();
  expect(actorEvents(execution.advance())[0]?.state.message).toBe('Nova');
  clock = 1000;
  expect(actorEvents(execution.advance())).toEqual([]);
});

it('valida conexões do senão, ciclos e parâmetros dos novos blocos', () => {
  const blocks: PrototypeBlock[] = [
    {
      id: 'if',
      kind: 'ifElse',
      condition: null,
      body: null,
      elseBody: null,
      next: null,
    },
    { id: 'move', kind: 'move', steps: 10, next: null },
    { id: 'operator', kind: 'eq', left: '1', right: '1', next: null },
  ];
  expect(canConnect({ blocks }, 'move', 'if', 'elseBody')).toBe(true);
  expect(canConnect({ blocks }, 'operator', 'if', 'elseBody')).toBe(false);
  expect(() =>
    inspectProgram({
      blocks: [{ ...blocks[0]!, elseBody: 'if' } as PrototypeBlock],
    }),
  ).toThrow();
  for (const block of [
    { id: 'x', kind: 'changeX', amount: Infinity, next: null },
    { id: 'd', kind: 'direction', degrees: 361, next: null },
    { id: 's', kind: 'sayFor', text: 'Olá', seconds: -1, next: null },
  ] as PrototypeBlock[])
    expect(() => inspectProgram({ blocks: [block] })).toThrow();
});
