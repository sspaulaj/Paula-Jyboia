import {
  createInputBuffer,
  initialSnapshot,
  isBusy,
  limits,
  writeInput,
} from './protocol';
import type { RunRequest, RuntimeEvent, RuntimeSnapshot } from './protocol';
import type { ProgramId } from '../programs';

export interface RuntimeWorker {
  onmessage: ((event: MessageEvent<RuntimeEvent>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: RunRequest): void;
  terminate(): void;
}

/** Browser-only execution orchestration, independent of React and Scratch. */
export function createPythonController(
  createWorker: () => RuntimeWorker,
  publish: (snapshot: RuntimeSnapshot) => void,
  supported = () =>
    globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined',
) {
  let worker: RuntimeWorker | null = null;
  let snapshot = { ...initialSnapshot };
  let runId = 0;
  let inputBuffer: SharedArrayBuffer | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let remaining = Number(limits.executionMs);
  let activeSince = 0;
  let disposed = false;
  const clearTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const update = (patch: Partial<RuntimeSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    if (!disposed) publish(snapshot);
  };
  const terminate = () => {
    clearTimer();
    ++runId;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
    worker = null;
    inputBuffer = null;
  };
  const finish = (state: 'done' | 'error' | 'stopped', message: string) => {
    terminate();
    update({ state, message, input: null });
  };
  const arm = (ms: number, message: string) => {
    clearTimer();
    timer = setTimeout(() => finish('error', message), Math.max(0, ms));
  };
  const runTimer = () => {
    activeSince = performance.now();
    arm(
      remaining,
      'Programa interrompido: limite de 5 segundos de execução atingido.',
    );
  };
  return {
    start(programId: ProgramId) {
      if (disposed || isBusy(snapshot.state)) return;
      terminate();
      if (!supported()) {
        update({
          state: 'error',
          output: '',
          input: null,
          message:
            'Execução indisponível: este navegador ou a hospedagem não oferece o isolamento necessário. Use um navegador compatível e os cabeçalhos configurados para /python.',
        });
        return;
      }
      const currentRun = runId;
      remaining = limits.executionMs;
      update({
        state: 'loading',
        output: '',
        input: null,
        message: 'Preparando Python…',
      });
      try {
        inputBuffer = createInputBuffer();
        worker = createWorker();
        worker.onerror = () => {
          if (currentRun === runId)
            finish(
              'error',
              'Não foi possível executar Python. Verifique o carregamento dos arquivos e tente novamente.',
            );
        };
        worker.onmessage = ({ data }) => {
          if (
            currentRun !== runId ||
            data.runId !== currentRun ||
            !isBusy(snapshot.state)
          )
            return;
          switch (data.type) {
            case 'running':
              update({ state: 'running', message: 'Programa em execução.' });
              runTimer();
              break;
            case 'output':
              if (
                snapshot.output.length + data.text.length >
                limits.outputCharacters
              ) {
                finish(
                  'error',
                  'Programa interrompido: limite de saída atingido.',
                );
              } else update({ output: snapshot.output + data.text });
              break;
            case 'input':
              remaining -= performance.now() - activeSince;
              update({
                state: 'input',
                input: { id: data.inputId, prompt: data.prompt },
                message: 'Aguardando sua resposta.',
              });
              arm(
                limits.inputWaitMs,
                'Programa interrompido: tempo de espera da resposta esgotado.',
              );
              break;
            case 'done':
              finish('done', 'Programa concluído.');
              break;
            case 'error':
              finish('error', data.message);
              break;
          }
        };
        arm(
          limits.loadingMs,
          'Não foi possível carregar Python em 30 segundos. Tente novamente.',
        );
        worker.postMessage({
          type: 'run',
          version: 1,
          runId: currentRun,
          programId,
          inputBuffer,
        });
      } catch {
        finish('error', 'Não foi possível iniciar Python. Tente novamente.');
      }
    },
    respond(inputId: number, text: string) {
      if (
        snapshot.state !== 'input' ||
        snapshot.input?.id !== inputId ||
        !inputBuffer
      )
        return false;
      if (!writeInput(inputBuffer, inputId, text)) return false;
      update({
        state: 'running',
        input: null,
        message: 'Programa em execução.',
      });
      runTimer();
      return true;
    },
    stop() {
      if (isBusy(snapshot.state)) finish('stopped', 'Programa interrompido.');
    },
    dispose() {
      disposed = true;
      terminate();
    },
  };
}
