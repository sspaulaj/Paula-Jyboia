import { CATEGORIES } from '../categories';
import type { BlockCategory } from '../types';

interface CategoryPanelProps {
  selected: BlockCategory;
  onSelect: (category: BlockCategory) => void;
  onAnnounce: (message: string, newPointerEntry?: boolean) => void;
}

export function CategoryPanel({
  selected,
  onSelect,
  onAnnounce,
}: CategoryPanelProps) {
  return (
    <nav
      className="category-panel"
      aria-label="Tipos de blocos"
      onKeyDown={(event) => {
        const keys = [
          'ArrowDown',
          'ArrowRight',
          'ArrowUp',
          'ArrowLeft',
          'Home',
          'End',
        ];
        if (!keys.includes(event.key)) return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll('button'),
        );
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (index < 0) return;
        event.preventDefault();
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (index +
                  (event.key === 'ArrowDown' || event.key === 'ArrowRight'
                    ? 1
                    : -1) +
                  buttons.length) %
                buttons.length;
        buttons[next]?.focus();
      }}
    >
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
                onPointerEnter={(event) => {
                  if (!event.buttons)
                    onAnnounce(
                      `Escolher blocos de ${cat.label.toLocaleLowerCase('pt-BR')}.`,
                      true,
                    );
                }}
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
