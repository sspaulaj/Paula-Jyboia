import { describe, expect, it } from 'vitest';
import { validateDocument, type ProjectDocument } from './document.js';
const draft = (): ProjectDocument => ({
  schemaVersion: 1,
  program: { entryBlockId: null, blocks: [] },
  actors: [
    { id: 'actor1', name: 'Jyboia', initialState: { x: 0, y: 0, heading: 0 } },
  ],
  layout: [],
});
describe('documento persistível', () => {
  it('aceita rascunho e preserva identidade, parâmetros e ordem do array', () => {
    const value = draft();
    value.program = {
      entryBlockId: 'start1',
      blocks: [
        {
          id: 'say1',
          type: 'say',
          parameters: { actorId: 'actor1', text: 'Olá' },
          next: null,
        },
        { id: 'start1', type: 'start', parameters: {}, next: 'say1' },
      ],
    };
    expect(validateDocument(value)).toEqual({ valid: true, document: value });
    expect(validateDocument(draft()).valid).toBe(true);
  });
  it.each([
    null,
    [],
    {},
    { ...draft(), extra: true },
    { ...draft(), schemaVersion: 2 },
    { ...draft(), actors: [] },
  ])('rejeita formato inválido %j', (value) => {
    expect(validateDocument(value).valid).toBe(false);
  });
  it.each([
    'missing',
    'cycle',
    'duplicate',
    'entry',
    'actor',
    'layout',
    'parameter',
    'unknownType',
    'unicode',
    'limit',
    'multipleParents',
    'startTarget',
  ])('rejeita %s', (scenario) => {
    const value = draft();
    const move = {
      id: 'move1',
      type: 'move' as const,
      parameters: { actorId: 'actor1', steps: 10 },
      next: null as string | null,
    };
    value.program.blocks = [move];
    if (scenario === 'missing') move.next = 'missing';
    if (scenario === 'cycle') move.next = 'move1';
    if (scenario === 'duplicate') value.program.blocks.push({ ...move });
    if (scenario === 'entry') value.program.entryBlockId = 'move1';
    if (scenario === 'actor') move.parameters.actorId = 'missing';
    if (scenario === 'layout')
      value.layout.push({ blockId: 'missing', x: 0, y: 0 });
    if (scenario === 'parameter') move.parameters.steps = 481;
    if (scenario === 'unknownType') Object.assign(move, { type: 'eval' });
    if (scenario === 'unicode') value.actors[0]!.name = '\ud800';
    if (scenario === 'limit')
      value.program.blocks = Array.from({ length: 201 }, (_, index) => ({
        ...move,
        id: `m${index}`,
      }));
    if (scenario === 'multipleParents')
      value.program.blocks.push(
        { id: 's1', type: 'start', parameters: {}, next: 'move1' },
        { id: 's2', type: 'start', parameters: {}, next: 'move1' },
      );
    if (scenario === 'startTarget') {
      move.next = 's1';
      value.program.blocks.push({
        id: 's1',
        type: 'start',
        parameters: {},
        next: null,
      });
    }
    expect(validateDocument(value).valid).toBe(false);
  });
});
