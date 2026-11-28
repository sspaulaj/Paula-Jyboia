import type { ActorState } from '@jyboia/block-engine/runtime';
import jyboiaMascote from '../../../../assets/jyboia-mascote.svg';
import type { ExecutionState } from '../types';

interface StageProps {
  actor: ActorState;
  executionState: ExecutionState;
  /** Descrição textual do estado atual do palco, atualizada para leitores de tela */
  stageDescription: string;
  onAnnounceArea: (text: string) => void;
  onActivateCharacter: () => void;
}

/**
 * Palco visual onde o personagem executa os comandos do programa.
 *
 * A descrição textual do estado é mantida sincronizada com o estado visual
 * para que leitores de tela possam comunicar o resultado da execução.
 */
export function Stage({
  actor,
  executionState,
  stageDescription,
  onAnnounceArea,
  onActivateCharacter,
}: StageProps) {
  return (
    <section
      className="stage"
      aria-label="Palco"
      onPointerEnter={(event) => {
        if (
          !event.buttons &&
          !(event.target as Element).closest('.stage__character')
        )
          onAnnounceArea('Palco.');
      }}
    >
      <div className="stage__canvas">
        <span
          className="screen-reader-only"
          role="img"
          aria-label={stageDescription}
        />
        <div className="stage__grid" aria-hidden="true" />

        <button
          type="button"
          className="stage__character"
          aria-label="Personagem Jyboia"
          aria-disabled={executionState === 'running'}
          onClick={() => {
            if (executionState !== 'running') onActivateCharacter();
          }}
          onPointerEnter={(event) => {
            if (!event.buttons) onAnnounceArea('Personagem Jyboia.');
          }}
          onPointerLeave={(event) => {
            if (
              !event.buttons &&
              event.relatedTarget instanceof Node &&
              event.currentTarget
                .closest('.stage')
                ?.contains(event.relatedTarget)
            )
              onAnnounceArea('Palco.');
          }}
          data-state={executionState}
          data-x={actor.x}
          data-y={actor.y}
          data-heading={actor.heading}
          style={{
            visibility: actor.visible ? 'visible' : 'hidden',
            left: `${((actor.x + 240) / 480) * 100}%`,
            top: `${((180 - actor.y) / 360) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${-actor.heading}deg)`,
          }}
        >
          <img
            src={jyboiaMascote}
            alt=""
            className="stage__character-img"
            draggable={false}
          />
        </button>

        {actor.message && (
          <p className="stage__speech" aria-hidden="true">
            {actor.message}
          </p>
        )}

        {executionState === 'running' && (
          <div className="stage__running-indicator" aria-hidden="true">
            ▶
          </div>
        )}
      </div>
    </section>
  );
}
