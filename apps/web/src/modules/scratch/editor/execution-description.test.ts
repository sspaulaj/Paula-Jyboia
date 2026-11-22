import { expect, it } from 'vitest';
import { announceSequence } from './execution-description';
import type { PrototypeProgram } from '@jyboia/block-engine/experimental';

it('lê evento e fala sem metadados de seleção', () => {
  expect(
    announceSequence({
      blocks: [
        { id: 'say', kind: 'say', text: 'Olá', next: null },
        { id: 'start', kind: 'start', next: 'say' },
        { id: 'loose', kind: 'say', text: 'Não ler', next: null },
      ],
    }),
  ).toBe('Quando iniciar programa. Diga Olá.');
});

it('segue conexões e mantém parâmetros e texto como dados', () => {
  const program: PrototypeProgram = {
    blocks: [
      { id: 'say', kind: 'say', text: '<Olá> & boa tarde', next: null },
      { id: 'move', kind: 'move', steps: 10, next: 'say' },
      { id: 'start', kind: 'start', next: 'move' },
    ],
  };
  expect(announceSequence(program)).toBe(
    'Quando iniciar programa. Mover 10 passos. Diga <Olá> & boa tarde.',
  );
  expect(announceSequence(program)).not.toMatch(
    /posição|coordenadas|selecionado|indisponível/i,
  );
});

it('preserva limites dos comandos internos e parâmetros de coordenadas explícitos', () => {
  expect(
    announceSequence({
      blocks: [
        { id: 's', kind: 'start', next: 'r' },
        { id: 'r', kind: 'repeat', times: 2, body: 'g', next: 'say' },
        { id: 'g', kind: 'goto', x: 10, y: 20, next: null },
        { id: 'say', kind: 'say', text: 'Fim', next: null },
      ],
    }),
  ).toBe(
    'Quando iniciar programa. Repetir 2 vezes. Ir para x 10, y 20. Fim da repetição. Diga Fim.',
  );
});
