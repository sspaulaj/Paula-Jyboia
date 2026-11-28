import { expect, it } from 'vitest';
import {
  canConnect,
  selectEvent,
  type PrototypeProgram,
} from './experimental.js';
import { createExecution } from './runtime.js';

const program: PrototypeProgram = {
  blocks: [
    { id: 'start', kind: 'start', next: 'move' },
    { id: 'move', kind: 'move', steps: 10, next: null },
    { id: 'click', kind: 'actorClick', next: 'say' },
    { id: 'say', kind: 'say', text: 'Olá!', next: null },
  ],
};

it('seleciona somente as sequências do evento disparado', () => {
  for (const trigger of ['start', 'actorClick'] as const) {
    const run = createExecution(
      program,
      trigger,
      () => 0,
      { x: 42, y: 12, heading: 90 },
      trigger,
    );
    const events = Array.from({ length: 4 }, () => run.advance()).flat();
    expect(
      events
        .filter((event) => event.type === 'commandStarted')
        .map((event) => event.blockId),
    ).toEqual([trigger === 'start' ? 'move' : 'say']);
    expect(
      events.find((event) => event.type === 'actorStateChanged'),
    ).toMatchObject({
      state: {
        x: trigger === 'start' ? 52 : 42,
        y: 12,
        heading: 90,
        message: trigger === 'start' ? '' : 'Olá!',
      },
    });
  }
});

it('evento de clique não encaixa após comandos e respeita eventos desativados', () => {
  expect(canConnect(program, 'click', 'move', 'next')).toBe(false);
  expect(
    selectEvent({ ...program, entryBlockIds: ['start'] }, 'actorClick')
      .entryBlockIds,
  ).toEqual([]);
  expect(() =>
    createExecution(
      {
        blocks: program.blocks.filter(
          (block) => block.id === 'click' || block.id === 'say',
        ),
      },
      'run',
      () => 0,
    ),
  ).toThrow('INVALID_ENTRY');
});
