import { expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { registerBlocks, readBlock } from './blockly-adapter';
import { describeBlock } from './descriptions';
import { announceSequence } from '../editor/execution-description';

it('atualiza as descrições ao editar os parâmetros novos', () => {
  registerBlocks();
  const workspace = new Blockly.Workspace();
  try {
    const block = workspace.newBlock('jyboia_sayFor');
    block.setFieldValue('Bom dia', 'TEXT');
    block.setFieldValue('3.5', 'SECONDS');
    expect(describeBlock(readBlock(block))).toBe(
      'Bloco de aparência: dizer Bom dia por 3.5 segundos.',
    );
    const movement = workspace.newBlock('jyboia_changeY');
    movement.setFieldValue('-20', 'AMOUNT');
    expect(describeBlock(readBlock(movement))).toBe(
      'Bloco de movimento: alterar y por -20.',
    );
  } finally {
    workspace.dispose();
  }
});

it('descreve os dois ramos em ordem antes da continuação, sem incluir blocos soltos', () => {
  const description = announceSequence({
    blocks: [
      { id: 's', kind: 'start', next: 'if' },
      {
        id: 'if',
        kind: 'ifElse',
        condition: 'eq',
        body: 'x',
        elseBody: 'y',
        next: 'say',
      },
      { id: 'eq', kind: 'eq', left: '1', right: '0', next: null },
      { id: 'x', kind: 'changeX', amount: 10, next: null },
      { id: 'y', kind: 'changeY', amount: 20, next: null },
      { id: 'say', kind: 'sayFor', text: 'Fim', seconds: 2, next: null },
      { id: 'loose', kind: 'say', text: 'Não executar', next: null },
    ],
  });
  expect(description).toBe(
    'Quando iniciar programa. Se 1 igual a 0. Então. Alterar x por 10. Senão. Alterar y por 20. Fim da condição. Diga Fim por 2 segundos.',
  );
});
