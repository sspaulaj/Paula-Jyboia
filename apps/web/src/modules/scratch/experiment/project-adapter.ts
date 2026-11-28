import * as Blockly from 'blockly/core';
import {
  connections,
  inspectProgram,
  isEvent,
  type PrototypeBlock,
} from '@jyboia/block-engine/experimental';
import {
  validateEditorDocument,
  type EditorDocument,
} from '@jyboia/block-engine/editor-document';

export const inactiveStarts = new WeakMap<Blockly.Workspace, Set<string>>();
export function writeBlocks(
  workspace: Blockly.Workspace,
  document: EditorDocument,
) {
  const blocks = new Map<string, Blockly.Block>();
  for (const item of document.program.blocks) {
    const block = workspace.newBlock(`jyboia_${item.kind}`, item.id);
    const fields: Record<string, string | number> = {};
    switch (item.kind) {
      case 'changeX':
      case 'changeY':
        fields.AMOUNT = item.amount;
        break;
      case 'direction':
        fields.DIRECTION = item.degrees;
        break;
      case 'sayFor':
        fields.TEXT = item.text;
        fields.SECONDS = item.seconds;
        break;
      case 'move':
        fields.STEPS = item.steps;
        break;
      case 'turn':
        fields.DEGREES = -item.degrees;
        break;
      case 'goto':
        fields.X = item.x;
        fields.Y = item.y;
        break;
      case 'say':
        fields.TEXT = item.text;
        break;
      case 'wait':
        fields.SECONDS = item.seconds;
        break;
      case 'repeat':
        fields.TIMES = item.times;
        break;
      case 'gt':
      case 'lt':
      case 'eq':
        fields.LEFT = item.left;
        fields.RIGHT = item.right;
        break;
      case 'set':
      case 'change':
        fields.NAME = item.name;
        fields.VALUE = item.value;
        break;
    }
    for (const [name, value] of Object.entries(fields))
      block.setFieldValue(String(value), name);
    blocks.set(item.id, block);
  }
  for (const item of document.program.blocks) {
    const parent = blocks.get(item.id)!;
    for (const edge of connections(item)) {
      const child = blocks.get(edge.id)!;
      const destination =
        edge.slot === 'next'
          ? parent.nextConnection
          : parent.getInput(
              edge.slot === 'body'
                ? 'BODY'
                : edge.slot === 'elseBody'
                  ? 'ELSE'
                  : 'CONDITION',
            )!.connection;
      destination!.connect(
        edge.slot === 'condition'
          ? child.outputConnection!
          : child.previousConnection!,
      );
    }
  }
  for (const position of document.layout) {
    const block = blocks.get(position.blockId)!;
    if (!block.getParent()) block.moveBy(position.x, position.y);
  }
  inactiveStarts.set(
    workspace,
    new Set(
      document.program.blocks
        .filter(
          (block) =>
            isEvent(block) &&
            !document.program.entryBlockIds.includes(block.id),
        )
        .map((block) => block.id),
    ),
  );
}
export function verifyImport(input: unknown): EditorDocument {
  const result = validateEditorDocument(input);
  if (!result.valid)
    throw new Error('O projeto contém blocos ou conexões inválidos.');
  return structuredClone(result.document);
}
export function normalizeBlocks(blocks: readonly PrototypeBlock[]) {
  return [...blocks]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((block) =>
      Object.fromEntries(
        Object.entries(block).sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
}
export function documentKey(document: EditorDocument) {
  inspectProgram(document.program);
  return JSON.stringify({
    ...document,
    program: {
      blocks: normalizeBlocks(document.program.blocks),
      entryBlockIds: [...document.program.entryBlockIds].sort(),
    },
    layout: [...document.layout].sort((a, b) =>
      a.blockId < b.blockId ? -1 : 1,
    ),
  });
}
