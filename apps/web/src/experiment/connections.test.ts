import * as Blockly from 'blockly/core';
import { afterEach, expect, it } from 'vitest';
import { readProgram, registerBlocks } from './blockly-adapter';
import { inspectProgram } from '@jyboia/block-engine/experimental';

registerBlocks();
const workspaces: Blockly.Workspace[] = [];
function workspace() {
  const ws = new Blockly.Workspace();
  workspaces.push(ws);
  return ws;
}
afterEach(() => workspaces.splice(0).forEach((ws) => ws.dispose()));

it('conecta comandos, corpo e booleanos; desconecta sem perder filhos', () => {
  const ws = workspace();
  const start = ws.newBlock('jyboia_start'),
    repeat = ws.newBlock('jyboia_repeat'),
    move = ws.newBlock('jyboia_move'),
    conditional = ws.newBlock('jyboia_if'),
    compare = ws.newBlock('jyboia_gt');
  start.nextConnection!.connect(repeat.previousConnection!);
  repeat.getInput('BODY')!.connection!.connect(move.previousConnection!);
  repeat.nextConnection!.connect(conditional.previousConnection!);
  conditional
    .getInput('CONDITION')!
    .connection!.connect(compare.outputConnection!);
  const before = readProgram(ws);
  expect(inspectProgram(before).sequence.map((block) => block.kind)).toEqual([
    'start',
    'repeat',
    'move',
    'if',
    'gt',
  ]);
  repeat.unplug(false);
  expect(repeat.getInputTargetBlock('BODY')?.id).toBe(move.id);
  expect(repeat.getNextBlock()?.id).toBe(conditional.id);
  expect(
    inspectProgram(readProgram(ws)).sequence.map((block) => block.kind),
  ).toEqual(['start']);
  start.nextConnection!.connect(repeat.previousConnection!);
  expect(
    inspectProgram(readProgram(ws)).sequence.map((block) => block.kind),
  ).toEqual(['start', 'repeat', 'move', 'if', 'gt']);
  repeat.dispose(true);
  expect(ws.getBlockById(move.id)).toBeNull();
  expect(start.getNextBlock()?.id).toBe(conditional.id);
  expect(
    inspectProgram(readProgram(ws)).sequence.map((block) => block.kind),
  ).toEqual(['start', 'if', 'gt']);
});

it('impede comandos em condição e operadores em sequência ou corpo', () => {
  const ws = workspace();
  const conditional = ws.newBlock('jyboia_if'),
    move = ws.newBlock('jyboia_move'),
    compare = ws.newBlock('jyboia_eq'),
    start = ws.newBlock('jyboia_start');
  const checker = ws.connectionChecker;
  expect(start.previousConnection).toBeNull();
  expect(
    checker.canConnect(
      conditional.getInput('CONDITION')!.connection!,
      move.previousConnection!,
      false,
    ),
  ).toBe(false);
  expect(
    checker.canConnect(
      conditional.getInput('BODY')!.connection!,
      compare.outputConnection!,
      false,
    ),
  ).toBe(false);
  expect(
    checker.canConnect(start.nextConnection!, compare.outputConnection!, false),
  ).toBe(false);
  expect(
    checker.canConnect(
      conditional.getInput('CONDITION')!.connection!,
      compare.outputConnection!,
      false,
    ),
  ).toBe(true);
});
