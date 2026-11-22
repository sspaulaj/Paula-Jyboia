import * as Blockly from 'blockly/core';
import { expect, it } from 'vitest';
import type { EditorDocument } from '@jyboia/block-engine/editor-document';
import { readProgram, registerBlocks } from './blockly-adapter';
import { normalizeBlocks, verifyImport, writeBlocks } from './project-adapter';

it('reconstrói todos os tipos com os mesmos IDs, valores e conexões', () => {
  registerBlocks();
  const document: EditorDocument = {
    schemaVersion: 2,
    initialState: { x: 0, y: 0, heading: 0 },
    layout: [],
    program: {
      entryBlockIds: ['start'],
      blocks: [
        { id: 'start', kind: 'start', next: 'repeat' },
        { id: 'repeat', kind: 'repeat', times: 4, body: 'move', next: 'if' },
        { id: 'move', kind: 'move', steps: -20, next: 'turn' },
        { id: 'turn', kind: 'turn', degrees: -75, next: 'goto' },
        { id: 'goto', kind: 'goto', x: 12, y: -30, next: null },
        { id: 'if', kind: 'if', condition: 'gt', body: 'say', next: 'forever' },
        { id: 'gt', kind: 'gt', left: 'score', right: '12', next: null },
        { id: 'say', kind: 'say', text: 'Olá, ação!', next: 'show' },
        { id: 'show', kind: 'show', next: 'hide' },
        { id: 'hide', kind: 'hide', next: 'wait' },
        { id: 'wait', kind: 'wait', seconds: 1.5, next: null },
        { id: 'forever', kind: 'forever', body: 'set', next: null },
        { id: 'set', kind: 'set', name: 'score', value: 2.5, next: 'change' },
        {
          id: 'change',
          kind: 'change',
          name: 'score',
          value: -1.5,
          next: null,
        },
        { id: 'lt', kind: 'lt', left: '2', right: 'score', next: null },
        { id: 'eq', kind: 'eq', left: 'score', right: '1', next: null },
      ],
    },
  };
  const workspace = new Blockly.Workspace();
  try {
    writeBlocks(workspace, verifyImport(JSON.parse(JSON.stringify(document))));
    const recovered = readProgram(workspace);
    expect(normalizeBlocks(recovered.blocks)).toEqual(
      normalizeBlocks(document.program.blocks),
    );
    expect(recovered.entryBlockIds).toEqual(['start']);
  } finally {
    workspace.dispose();
  }
});
