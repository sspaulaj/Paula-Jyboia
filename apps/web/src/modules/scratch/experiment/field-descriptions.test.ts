import { expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { registerBlocks } from './blockly-adapter';
import { describeField } from './field-descriptions';

it('o campo editável preserva limites, instrução semântica e valor atualizado', () => {
  registerBlocks();
  const workspace = new Blockly.Workspace();
  try {
    const block = workspace.newBlock('jyboia_sayFor');
    const field = block.getField('SECONDS')!;
    expect(field.getAriaTypeName()).toContain('Inserir quantidade de segundos');
    field.setValue(99);
    expect(field.getValue()).toBe(30);
    field.setValue(3.5);
    expect(describeField('SECONDS', field.getText())).toBe(
      'Inserir quantidade de segundos. Valor atual: 3.5.',
    );
    block.setFieldValue('', 'TEXT');
    expect(describeField('TEXT', block.getField('TEXT')!.getText())).toBe(
      'Inserir texto da fala. Valor atual: vazio.',
    );
  } finally {
    workspace.dispose();
  }
});
