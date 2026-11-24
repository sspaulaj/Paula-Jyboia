import type { loadPyodide as loadRuntime } from 'pyodide';
import { findProgram } from '../programs';
import { inputHeaderBytes, limits } from './protocol';
import type { RunRequest, WorkerEvent } from './protocol';

// A fresh worker handles exactly one reviewed example. No arbitrary source arrives here.
let started = false;
self.onmessage = async ({ data }: MessageEvent<RunRequest>) => {
  if (started || data.type !== 'run' || data.version !== 1) return;
  started = true;
  const send = (event: WorkerEvent) =>
    self.postMessage({ ...event, runId: data.runId });
  const program = findProgram(data.programId);
  if (
    !program ||
    !(data.inputBuffer instanceof SharedArrayBuffer) ||
    data.inputBuffer.byteLength !== inputHeaderBytes + limits.inputBytes
  ) {
    send({ type: 'error', message: 'Exemplo de programa inválido.' });
    return;
  }
  let pending = '';
  let characters = 0;
  let lines = 0;
  let outputExceeded = false;
  let ready = false;
  try {
    const indexURL = new URL('/python-runtime/314.0.8/', self.location.origin)
      .href;
    const { loadPyodide } = (await import(
      /* @vite-ignore */ `${indexURL}pyodide.mjs`
    )) as { loadPyodide: typeof loadRuntime };
    const pyodide = await loadPyodide({
      indexURL,
      stdout: () => {},
      stderr: () => {},
    });
    const decoder = new TextDecoder();
    const write = (bytes: Uint8Array) => {
      const text = decoder.decode(bytes, { stream: true });
      characters += text.length;
      lines += text.split('\n').length - 1;
      if (characters > limits.outputCharacters || lines > limits.outputLines) {
        outputExceeded = true;
        throw new Error('Output limit');
      }
      pending += text;
      const end = pending.lastIndexOf('\n');
      if (end >= 0) {
        send({ type: 'output', text: pending.slice(0, end + 1) });
        pending = pending.slice(end + 1);
      }
      return bytes.length;
    };
    pyodide.setStdout({ write });
    pyodide.setStderr({ write });
    let inputId = 0;
    const header = new Int32Array(data.inputBuffer, 0, 3);
    pyodide.setStdin({
      stdin: () => {
        ++inputId;
        Atomics.store(header, 0, 0);
        Atomics.store(header, 1, 0);
        Atomics.store(header, 2, inputId);
        const prompt = pending || 'Digite uma resposta:';
        pending = '';
        send({ type: 'input', inputId, prompt });
        // Only this worker waits. The UI writes to shared memory and wakes it;
        // postMessage alone could not deliver a response to a blocked event loop.
        while (Atomics.load(header, 0) === 0) Atomics.wait(header, 0, 0, 1000);
        const length = Atomics.load(header, 1);
        if (length < 0 || length > limits.inputBytes)
          throw new Error('Invalid input');
        // Browser TextDecoder rejects SharedArrayBuffer-backed views. Copy after
        // the atomic ready flag guarantees that the UI finished writing the line.
        return new TextDecoder().decode(
          new Uint8Array(data.inputBuffer, inputHeaderBytes, length).slice(),
        );
      },
    });
    ready = true;
    send({ type: 'running' });
    // Synchronous Python is safe for UI responsiveness because it stays in the worker.
    pyodide.runPython(program.code);
    if (pending) send({ type: 'output', text: pending });
    send({ type: 'done' });
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    let message = 'O programa encontrou um erro de execução.';
    if (!ready)
      message =
        'Não foi possível carregar Python. Verifique os arquivos do runtime e tente novamente.';
    else if (outputExceeded)
      message = 'Programa interrompido: limite de saída atingido.';
    else if (detail.includes('SyntaxError'))
      message = 'Erro de sintaxe: confira a escrita e a estrutura do programa.';
    else if (detail.includes('ZeroDivisionError'))
      message = 'Erro de execução: não é possível dividir por zero.';
    else if (detail.includes('ValueError'))
      message =
        'Erro de conversão: a resposta não representa o número solicitado.';
    send({ type: 'error', message });
  }
};
