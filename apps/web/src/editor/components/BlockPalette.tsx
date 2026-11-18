import { CATEGORIES } from '../categories';
import type { BlockCategory } from '../types';

interface BlockPaletteProps {
  category: BlockCategory;
  /** Chamado quando o usuário escolhe um bloco da paleta */
  onBlockSelect?: (blockType: string) => void;
}

/**
 * Paleta de blocos disponíveis para a categoria selecionada.
 *
 * Nesta etapa, os blocos da categoria Movimento são fornecidos diretamente
 * pelo Blockly na área central. A paleta aqui serve como área informativa
 * de referência para as demais categorias e ponto de integração futura.
 *
 * A paleta Blockly (flyout) é a fonte de inserção no editor principal;
 * esta área lateral complementa a navegação por categoria.
 */
export function BlockPalette({ category, onBlockSelect }: BlockPaletteProps) {
  const meta = CATEGORIES.find((c) => c.id === category);
  const blocks = BLOCK_CATALOG[category] ?? [];

  return (
    <section
      className="block-palette"
      aria-label={`Blocos de ${meta?.label ?? category}`}
    >
      <h2 className="block-palette__title" style={{ color: meta?.color }}>
        {meta?.label}
      </h2>

      {blocks.length === 0 ? (
        <p className="block-palette__empty">
          Esta categoria ainda não tem blocos disponíveis.
        </p>
      ) : (
        <ul className="block-palette__list" role="list">
          {blocks.map((block) => (
            <li key={block.type}>
              <button
                type="button"
                className="block-palette__block"
                style={{ '--block-color': meta?.color } as React.CSSProperties}
                onClick={() => onBlockSelect?.(block.type)}
                aria-label={`Inserir bloco: ${block.label}`}
              >
                <span className="block-palette__block-notch" aria-hidden="true" />
                <span className="block-palette__block-label">{block.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import React from 'react';

/** Catálogo estático de blocos por categoria para exibição na paleta lateral. */
const BLOCK_CATALOG: Record<BlockCategory, { type: string; label: string }[]> = {
  motion: [
    { type: 'jyboia_move', label: 'mover … passos' },
    { type: 'jyboia_turn', label: 'girar … graus à direita' },
  ],
  appearance: [
    { type: 'jyboia_say', label: 'dizer …' },
  ],
  events: [
    { type: 'jyboia_start', label: 'quando iniciar' },
  ],
  control: [],
  operators: [],
  variables: [],
};
