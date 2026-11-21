import type { ExecutionState } from '../types';

interface ExecutionControlsProps {
  state: ExecutionState;
  onStart: () => void;
  onStop: () => void;
  sequenceRef: React.RefObject<HTMLDivElement | null>;
  sequenceDescription: string;
}

/**
 * Controles de execução do programa: Iniciar e Parar.
 *
 * Os botões são habilitados/desabilitados conforme o estado de execução
 * e comunicam o estado atual para leitores de tela via aria-disabled.
 */
export function ExecutionControls({
  state,
  onStart,
  onStop,
  sequenceRef,
  sequenceDescription,
}: ExecutionControlsProps) {
  const isRunning = state === 'running';
  const isIdle = state === 'idle' || state === 'stopped';

  return (
    <div
      className="execution-controls"
      role="group"
      aria-label="Controles de execução"
    >
      <button
        type="button"
        className="execution-controls__btn execution-controls__btn--start"
        onClick={() => {
          if (isIdle) onStart();
        }}
        aria-disabled={!isIdle}
        aria-label="Iniciar programa"
        aria-controls={sequenceDescription ? 'execution-sequence' : undefined}
      >
        {/* Ícone visual decorativo */}
        <span className="execution-controls__icon" aria-hidden="true">
          ▶
        </span>
        <span>Iniciar programa</span>
      </button>

      {sequenceDescription && (
        <div
          id="execution-sequence"
          ref={sequenceRef}
          role="region"
          tabIndex={-1}
          aria-label={sequenceDescription}
          className="execution-sequence screen-reader-only"
        >
          {sequenceDescription}
        </div>
      )}

      <button
        type="button"
        className="execution-controls__btn execution-controls__btn--stop"
        onClick={() => {
          if (isRunning) onStop();
        }}
        aria-disabled={!isRunning}
        aria-label="Parar programa"
      >
        <span className="execution-controls__icon" aria-hidden="true">
          ■
        </span>
        <span>Parar programa</span>
      </button>
    </div>
  );
}
