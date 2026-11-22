import { CATEGORIES } from '../categories';
import type { BlockCategory } from '../types';

interface CategoryPanelProps {
  selected: BlockCategory;
  onSelect: (category: BlockCategory) => void;
}

export function CategoryPanel({ selected, onSelect }: CategoryPanelProps) {
  return (
    <nav className="category-panel" aria-label="Categorias de blocos">
      <ul className="category-panel__list" role="list">
        {CATEGORIES.map((cat) => {
          const isSelected = cat.id === selected;
          return (
            <li key={cat.id}>
              <button
                type="button"
                className="category-panel__item"
                aria-label={`Escolher blocos de ${cat.label.toLocaleLowerCase('pt-BR')}`}
                aria-controls="block-editor"
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(cat.id)}
                style={
                  {
                    '--cat-color': cat.color,
                  } as React.CSSProperties
                }
              >
                <span
                  className="category-panel__icon"
                  aria-hidden="true"
                  style={{ color: cat.color }}
                >
                  {cat.icon}
                </span>
                <span className="category-panel__label">{cat.label}</span>
                {isSelected && (
                  <span
                    className="category-panel__indicator"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Import necessário para o tipo CSSProperties no estilo inline
import React from 'react';
