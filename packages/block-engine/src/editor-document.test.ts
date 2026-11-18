import { expect, it } from 'vitest';
import {
  validateEditorDocument,
  upgradeDocument,
  type EditorDocument,
} from './editor-document.js';
import { createExecution } from './runtime.js';
const document: EditorDocument = {
  schemaVersion: 2,
  initialState: { x: 5, y: 0, heading: 0 },
  layout: [{ blockId: 's:1', x: 10, y: 20 }],
  program: {
    entryBlockIds: ['s:1'],
    blocks: [
      { id: 's:1', kind: 'start', next: 'r' },
      { id: 'r', kind: 'repeat', times: 2, body: 'move', next: 'if' },
      { id: 'move', kind: 'move', steps: 15, next: null },
      { id: 'if', kind: 'if', condition: 'gt', body: 'say', next: null },
      { id: 'gt', kind: 'gt', left: '1', right: '0', next: null },
      { id: 'say', kind: 'say', text: 'Olá', next: null },
    ],
  },
};
it('round-trip preserva IDs, parâmetros, corpos e ordem executada', () => {
  const decoded: unknown = JSON.parse(JSON.stringify(document));
  const result = validateEditorDocument(decoded);
  expect(result.valid).toBe(true);
  if (!result.valid) throw new Error('invalid');
  expect(result.document).toEqual(document);
  const run = createExecution(
    result.document.program,
    'roundtrip',
    () => 0,
    result.document.initialState,
  );
  const events = Array.from({ length: 10 }, () => run.advance()).flat();
  expect(
    events.filter((event) => event.type === 'actorStateChanged').at(-1),
  ).toMatchObject({ state: { x: 35, message: 'Olá' } });
});
it('rejeita versões, campos extras, entrada quebrada e conexões inválidas sem modificar dados', () => {
  for (const input of [
    { ...document, schemaVersion: 99 },
    { ...document, script: 'alert(1)' },
    {
      ...document,
      program: { ...document.program, entryBlockIds: ['missing'] },
    },
    {
      ...document,
      program: {
        ...document.program,
        blocks: document.program.blocks.map((block) =>
          block.id === 'r' ? { ...block, body: 'gt' } : block,
        ),
      },
    },
  ]) {
    const previous = JSON.stringify(input);
    expect(validateEditorDocument(input).valid).toBe(false);
    expect(JSON.stringify(input)).toBe(previous);
  }
});
it('migração v1 preserva entrada explícita e orientação sem ativar eventos soltos', () => {
  const converted = upgradeDocument({
    schemaVersion: 1,
    actors: [
      {
        id: 'actor1',
        name: 'Jyboia',
        initialState: { x: 10, y: 20, heading: 0 },
      },
    ],
    layout: [],
    program: {
      entryBlockId: 's',
      blocks: [
        { id: 's', type: 'start', parameters: {}, next: 't' },
        {
          id: 't',
          type: 'turn',
          parameters: { actorId: 'actor1', degrees: 90 },
          next: null,
        },
        { id: 'loose', type: 'start', parameters: {}, next: null },
      ],
    },
  });
  expect(converted.program.entryBlockIds).toEqual(['s']);
  expect(validateEditorDocument(converted).valid).toBe(true);
  const run = createExecution(
    converted.program,
    'legacy',
    () => 0,
    converted.initialState,
  );
  run.advance();
  expect(run.advance()[1]).toMatchObject({
    state: { x: 10, y: 20, heading: 90 },
  });
});
