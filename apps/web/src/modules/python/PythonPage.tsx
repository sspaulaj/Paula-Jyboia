import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { programs } from './programs';
import type { ProgramId } from './programs';
import { createPythonController } from './runtime/controller';
import { initialSnapshot, isBusy, limits } from './runtime/protocol';
import './python-page.css';

export function PythonPage() {
  const [programId, setProgramId] = useState<ProgramId>('hello');
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [answer, setAnswer] = useState('');
  const [inputError, setInputError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLInputElement>(null);
  const previousInput = useRef(false);
  const controllerRef = useRef<ReturnType<
    typeof createPythonController
  > | null>(null);
  const busy = isBusy(snapshot.state);
  const program = programs.find((item) => item.id === programId)!;
  useEffect(() => {
    const controller = createPythonController(
      () =>
        new Worker(new URL('./runtime/python.worker.ts', import.meta.url), {
          type: 'module',
        }),
      setSnapshot,
    );
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    if (snapshot.input) {
      setAnswer('');
      setInputError('');
      setAnnouncement('');
      answerRef.current?.focus();
    } else if (
      previousInput.current &&
      document.activeElement === document.body
    ) {
      // A timeout can remove a focused input without a submit/stop action.
      terminalRef.current?.focus();
    }
    previousInput.current = Boolean(snapshot.input);
  }, [snapshot.input]);
  useEffect(() => {
    if (['done', 'error', 'stopped'].includes(snapshot.state)) {
      // One summary instead of competing announcements for every output chunk.
      const output =
        snapshot.output.length <= 600
          ? snapshot.output
          : 'Há resultados no terminal. Consulte a saída do programa.';
      setAnnouncement(
        `${snapshot.message}${output ? ` Saída: ${output}` : ''}`,
      );
    }
  }, [snapshot.state, snapshot.message, snapshot.output]);
  const focusTerminal = () => {
    flushSync(() => setAnnouncement(''));
    terminalRef.current?.focus();
  };
  const start = () => {
    if (busy) return;
    focusTerminal();
    controllerRef.current?.start(programId);
  };
  const stop = () => {
    if (!busy) return;
    focusTerminal();
    controllerRef.current?.stop();
  };
  return (
    <main className="python-page" aria-labelledby="python-title">
      <h1 id="python-title">Python por blocos</h1>
      <p>
        Laboratório de execução: escolha um exemplo para testar o terminal. O
        editor de blocos será desenvolvido depois.
      </p>
      <label htmlFor="python-example">Exemplo de programa</label>
      <select
        id="python-example"
        value={programId}
        disabled={busy}
        onChange={(event) => setProgramId(event.target.value as ProgramId)}
      >
        {programs.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <details>
        <summary>Consultar código Python do exemplo</summary>
        <pre tabIndex={0} aria-label="Código Python do exemplo">
          <code>{program.code}</code>
        </pre>
      </details>
      <div className="python-controls">
        <button type="button" aria-disabled={busy} onClick={start}>
          Iniciar programa
        </button>
        <button type="button" aria-disabled={!busy} onClick={stop}>
          Parar programa
        </button>
      </div>
      <section
        aria-labelledby="python-terminal-title"
        data-state={snapshot.state}
      >
        <h2 id="python-terminal-title">Terminal</h2>
        <div
          ref={terminalRef}
          tabIndex={-1}
          role="group"
          aria-label="Terminal Python"
          className="python-focus-target"
        >
          <p>{snapshot.message}</p>
        </div>
        <pre
          tabIndex={0}
          aria-label="Saída do programa"
          className="python-output"
        >
          {snapshot.output || 'Ainda não há saída.'}
        </pre>
        {snapshot.input && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const input = snapshot.input;
              if (!input) return;
              // Move focus before the submitted input is removed from the DOM.
              focusTerminal();
              if (!controllerRef.current?.respond(input.id, answer)) {
                setInputError('Use uma linha de texto de até 4096 bytes.');
                answerRef.current?.focus();
              }
            }}
          >
            <label htmlFor="python-answer">{snapshot.input.prompt}</label>
            <input
              ref={answerRef}
              id="python-answer"
              maxLength={limits.inputBytes}
              autoComplete="off"
              value={answer}
              aria-describedby={
                inputError
                  ? 'python-input-help python-input-error'
                  : 'python-input-help'
              }
              aria-invalid={Boolean(inputError)}
              onChange={(event) => setAnswer(event.target.value)}
            />
            <p id="python-input-help">
              Digite a resposta e pressione Enter. Para interromper, use Parar
              programa.
            </p>
            {inputError && (
              <p id="python-input-error" role="alert">
                {inputError}
              </p>
            )}
            <button type="submit">Enviar resposta</button>
          </form>
        )}
      </section>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="python-sr-only"
      >
        {announcement}
      </p>
      <a href="/scratch">Abrir editor Scratch</a>
    </main>
  );
}
