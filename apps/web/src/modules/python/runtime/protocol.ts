import type { ProgramId } from '../programs';

export const limits = {
  inputBytes: 4096,
  outputCharacters: 8000,
  outputLines: 200,
  loadingMs: 30000,
  executionMs: 5000,
  inputWaitMs: 120000,
} as const;

// [ready flag, byte length, request ID], followed by UTF-8 bytes.
export const inputHeaderBytes = 3 * Int32Array.BYTES_PER_ELEMENT;
export function createInputBuffer() {
  return new SharedArrayBuffer(inputHeaderBytes + limits.inputBytes);
}

export function writeInput(
  buffer: SharedArrayBuffer,
  inputId: number,
  text: string,
) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > limits.inputBytes || /[\r\n\0]/.test(text)) return false;
  const header = new Int32Array(buffer, 0, 3);
  if (Atomics.load(header, 2) !== inputId || Atomics.load(header, 0) !== 0)
    return false;
  new Uint8Array(buffer, inputHeaderBytes).set(bytes);
  Atomics.store(header, 1, bytes.length);
  Atomics.store(header, 0, 1);
  Atomics.notify(header, 0);
  return true;
}

export type RunRequest = {
  type: 'run';
  version: 1;
  runId: number;
  programId: ProgramId;
  inputBuffer: SharedArrayBuffer;
};
export type RuntimeEvent = { runId: number } & (
  | { type: 'running' }
  | { type: 'output'; text: string }
  | { type: 'input'; inputId: number; prompt: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
);
export type RuntimeState =
  'idle' | 'loading' | 'running' | 'input' | 'done' | 'stopped' | 'error';
export type WorkerEvent = RuntimeEvent extends infer Event
  ? Event extends { runId: number }
    ? Omit<Event, 'runId'>
    : never
  : never;
export interface RuntimeSnapshot {
  state: RuntimeState;
  output: string;
  message: string;
  input: { id: number; prompt: string } | null;
}
export const initialSnapshot: RuntimeSnapshot = {
  state: 'idle',
  output: '',
  message: 'Escolha um exemplo e inicie o programa.',
  input: null,
};
export function isBusy(state: RuntimeState) {
  return state === 'loading' || state === 'running' || state === 'input';
}
