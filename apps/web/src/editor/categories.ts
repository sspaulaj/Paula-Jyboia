import type { CategoryMeta } from './types';
import type { BlockCategory } from './types';
import type { PrototypeBlock } from '@jyboia/block-engine/experimental';

export const BLOCKS_BY_CATEGORY: Record<
  BlockCategory,
  readonly PrototypeBlock['kind'][]
> = {
  motion: ['move', 'turn', 'goto'],
  appearance: ['say', 'show', 'hide'],
  events: ['start'],
  control: ['wait', 'repeat', 'forever', 'if'],
  operators: ['gt', 'lt', 'eq'],
  variables: ['set', 'change'],
};

/**
 * Catálogo de categorias de blocos com cores inspiradas no Scratch.
 * As cores são usadas como indicadores visuais complementares —
 * os rótulos textuais garantem que a informação não dependa apenas da cor.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'motion',
    label: 'Movimento',
    color: '#285cba',
    icon: '↗',
  },
  {
    id: 'appearance',
    label: 'Aparência',
    color: '#7542a6',
    icon: '✦',
  },
  {
    id: 'events',
    label: 'Eventos',
    color: '#9b6500',
    icon: '⚡',
  },
  {
    id: 'control',
    label: 'Controle',
    color: '#c26000',
    icon: '⊙',
  },
  {
    id: 'operators',
    label: 'Operadores',
    color: '#2a8a3e',
    icon: '±',
  },
  {
    id: 'variables',
    label: 'Variáveis',
    color: '#c03c5a',
    icon: 'x',
  },
];
