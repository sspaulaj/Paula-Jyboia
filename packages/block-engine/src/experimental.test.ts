import { describe, expect, it } from 'vitest';
import { inspectProgram, type PrototypeBlock } from './experimental.js';

describe('estrutura experimental independente do editor', () => {
  it('segue conexões em vez da ordem de armazenamento e identifica cadeias soltas', () => {
    const blocks: PrototypeBlock[] = [
      { id: 'say', kind: 'say', text: 'Olá', next: null },
      { id: 'loose', kind: 'turn', degrees: -15, next: null },
      { id: 'start', kind: 'start', next: 'move' },
      { id: 'move', kind: 'move', steps: 10, next: 'say' },
    ];
    const result = inspectProgram({ blocks });
    expect(result.sequence.map((block) => block.id)).toEqual([
      'start',
      'move',
      'say',
    ]);
    expect(result.predecessors.get('say')).toBe('move');
    expect(result.chains).toHaveLength(2);
  });
  it('ordena duas sequências por ID para agendamento determinístico', () => {
    const result = inspectProgram({
      blocks: [
        { id: 'a', kind: 'start', next: null },
        { id: 'b', kind: 'start', next: null },
      ],
    });
    expect(result.ambiguousStart).toBe(true);
    expect(result.starts.map((block) => block.id)).toEqual(['a', 'b']);
  });
  it('rejeita ciclos mesmo quando todos os blocos estão soltos da entrada', () => {
    expect(() =>
      inspectProgram({
        blocks: [
          { id: 'a', kind: 'move', steps: 10, next: 'b' },
          { id: 'b', kind: 'turn', degrees: -15, next: 'a' },
        ],
      }),
    ).toThrow('CYCLE');
  });
  it('rejeita referência quebrada, entrada incompatível e parâmetros inválidos', () => {
    expect(() =>
      inspectProgram({ blocks: [{ id: 'a', kind: 'start', next: 'missing' }] }),
    ).toThrow('MISSING_TARGET');
    expect(() =>
      inspectProgram({
        blocks: [
          { id: 'a', kind: 'move', steps: 10, next: 'b' },
          { id: 'b', kind: 'start', next: null },
        ],
      }),
    ).toThrow('INVALID_CONNECTION');
    expect(() =>
      inspectProgram({
        blocks: [{ id: 'a', kind: 'move', steps: NaN, next: null }],
      }),
    ).toThrow('INVALID_STEPS');
    expect(() =>
      inspectProgram({
        blocks: [{ id: 'a', kind: 'say', text: 'a'.repeat(121), next: null }],
      }),
    ).toThrow('INVALID_TEXT');
  });
});
