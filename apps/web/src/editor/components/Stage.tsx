import type { ActorState } from '@jyboia/block-engine/runtime';
import jyboiaMascote from '../../assets/jyboia-mascote.svg';
import type { ExecutionState } from '../types';

interface StageProps {
  actor: ActorState;
  executionState: ExecutionState;
  /** Descrição textual do estado atual do palco, atualizada para leitores de tela */
  stageDescription: string;
}

/**
 * Palco visual onde o personagem executa os comandos do programa.
 *
 * A descrição textual do estado é mantida sincronizada com o estado visual
 * para que leitores de tela possam comunicar o resultado da execução.
 */
export function Stage({ actor, executionState, stageDescription }: StageProps) {
  return (
    <section className="stage" aria-label="Palco de execução">
      <div className="stage__canvas" role="img" aria-label={stageDescription}>
        <div className="stage__grid" aria-hidden="true" />

        <div
          className="stage__character"
          aria-hidden="true"
          data-state={executionState}
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
        </div>

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
