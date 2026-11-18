import jyboiaMascote from '../../assets/jyboia-mascote.svg';

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
}

interface CharacterPanelProps {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const DEFAULT_CHARACTERS: Character[] = [
  { id: 'jyboia', name: 'Jyboia', imageUrl: jyboiaMascote },
];

/**
 * Painel de seleção de personagens.
 *
 * Usa role="radiogroup" com botões de rádio semânticos para que
 * leitores de tela anunciem corretamente a seleção.
 */
export function CharacterPanel({
  characters = DEFAULT_CHARACTERS,
  selectedId,
  onSelect,
}: CharacterPanelProps) {
  return (
    <section className="character-panel" aria-label="Personagens">
      <h2 className="character-panel__title">Personagens</h2>

      <div
        className="character-panel__list"
        role="radiogroup"
        aria-label="Selecionar personagem"
      >
        {characters.map((character) => {
          const isSelected = character.id === selectedId;
          return (
            <button
              key={character.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className="character-panel__item"
              data-selected={isSelected}
              onClick={() => onSelect(character.id)}
            >
              <img
                src={character.imageUrl}
                alt=""
                aria-hidden="true"
                className="character-panel__image"
                width={48}
                height={48}
                draggable={false}
              />
              <span className="character-panel__name">{character.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { DEFAULT_CHARACTERS };
