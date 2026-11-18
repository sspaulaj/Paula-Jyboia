import { expect, it } from 'vitest';
import {
  describeBlock,
  describeConnection,
  describeSequence,
} from './descriptions';
import type { PrototypeProgram } from '@jyboia/block-engine/experimental';

it('descreve aninhamento com limites explícitos e exclui blocos soltos', () => {
  const program: PrototypeProgram = {
    blocks: [
      { id: 's', kind: 'start', next: 'repeat' },
      { id: 'repeat', kind: 'repeat', times: 5, body: 'if', next: null },
      { id: 'if', kind: 'if', condition: 'gt', body: 'say', next: null },
      { id: 'gt', kind: 'gt', left: 'pontos', right: '260', next: null },
      { id: 'say', kind: 'say', text: 'Olá', next: null },
      { id: 'loose', kind: 'say', text: 'NÃO EXECUTAR', next: null },
    ],
  };
  const description = describeSequence(program);
  expect(description).toMatch(
    /Bloco 1: quando iniciar.*Bloco 2: repetir 5 vezes.*Dentro da repetição:.*se pontos maior que 260.*Dentro da condição:.*dizer Olá.*Fim da condição.*Fim da repetição.*Fim da sequência/,
  );
  expect(description).not.toContain('NÃO EXECUTAR');
  expect(describeBlock(program.blocks[2]!, program)).toContain(
    'se pontos maior que 260',
  );
  const changed = {
    blocks: program.blocks.map((block) =>
      block.kind === 'gt' ? { ...block, right: '300' } : block,
    ),
  };
  expect(describeBlock(changed.blocks[2]!, changed)).toContain('maior que 300');
});

it('descrições refletem valores atuais e texto é tratado como dado', () => {
  expect(describeBlock({ id: 'a', kind: 'move', steps: 27, next: null })).toBe(
    'Bloco de movimento: mover 27 passos.',
  );
  expect(
    describeBlock({ id: 'a', kind: 'turn', degrees: -15, next: null }),
  ).toContain('15 graus para a direita');
  expect(
    describeBlock({ id: 'a', kind: 'say', text: '<Olá>', next: null }),
  ).toContain('<Olá>');
});

it('distingue bloco solto e cadeia sem evento inicial', () => {
  const program = {
    blocks: [{ id: 'a', kind: 'move' as const, steps: 10, next: null }],
  };
  expect(describeConnection(program.blocks[0]!, program)).toContain('Solto.');
  expect(describeSequence(program)).toContain('Adicione');
});
