import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPythonController } from './controller';
import type { RuntimeWorker } from './controller';
import {
  createInputBuffer,
  inputHeaderBytes,
  limits,
  writeInput,
} from './protocol';
import type {
  RunRequest,
  RuntimeEvent,
  RuntimeSnapshot,
  WorkerEvent,
} from './protocol';

function setup(supported = true) {
  const workers: RuntimeWorker[] = [];
  const requests: RunRequest[] = [];
  let latest: RuntimeSnapshot | undefined;
  const controller = createPythonController(
    () => {
      const worker: RuntimeWorker = {
        onmessage: null,
        onerror: null,
        postMessage: (request) => requests.push(request),
        terminate: vi.fn(),
      };
      workers.push(worker);
      return worker;
    },
    (snapshot) => {
      latest = snapshot;
    },
    () => supported,
  );
  const emit = (event: WorkerEvent) => {
    workers.at(-1)!.onmessage?.({
      data: { ...event, runId: requests.at(-1)!.runId },
    } as MessageEvent<RuntimeEvent>);
  };
  return { controller, workers, requests, emit, latest: () => latest! };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Python controller lifecycle', () => {
  it('terminates blocked workers and rejects old events after restart', () => {
    const run = setup();
    run.controller.start('infinite');
    const previousHandler = run.workers[0]!.onmessage!;
    const previousRun = run.requests[0]!.runId;
    run.emit({ type: 'running' });
    run.controller.stop();
    expect(run.workers[0]!.terminate).toHaveBeenCalledOnce();
    expect(run.latest().state).toBe('stopped');
    run.controller.start('hello');
    previousHandler({
      data: { runId: previousRun, type: 'output', text: 'stale' },
    } as MessageEvent<RuntimeEvent>);
    expect(run.latest().output).toBe('');
    run.emit({ type: 'running' });
    run.emit({ type: 'output', text: 'Olá' });
    run.emit({ type: 'done' });
    expect(run.latest().state).toBe('done');
    expect(run.latest().output).toBe('Olá');
    expect(run.workers[1]!.terminate).toHaveBeenCalledOnce();
  });

  it('pauses the active time budget for input without replenishing it', () => {
    const run = setup();
    run.controller.start('name');
    run.emit({ type: 'running' });
    vi.advanceTimersByTime(4000);
    const buffer = run.requests[0]!.inputBuffer;
    Atomics.store(new Int32Array(buffer, 0, 3), 2, 1);
    run.emit({ type: 'input', inputId: 1, prompt: 'Nome?' });
    vi.advanceTimersByTime(10000);
    expect(run.latest().state).toBe('input');
    expect(run.controller.respond(2, 'stale')).toBe(false);
    expect(run.controller.respond(1, 'Ana')).toBe(true);
    expect(run.controller.respond(1, 'duplicate')).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(run.latest().state).toBe('error');
    expect(run.latest().message).toContain('5 segundos');
    expect(run.workers[0]!.terminate).toHaveBeenCalledOnce();
  });

  it('times out loading and input and supports stopping before runtime readiness', () => {
    const run = setup();
    run.controller.start('hello');
    vi.advanceTimersByTime(limits.loadingMs);
    expect(run.latest().message).toContain('carregar Python');
    run.controller.start('name');
    run.emit({ type: 'running' });
    run.emit({ type: 'input', inputId: 1, prompt: 'Nome?' });
    vi.advanceTimersByTime(limits.inputWaitMs);
    expect(run.latest().message).toContain('espera da resposta');
    run.controller.start('hello');
    run.controller.stop();
    expect(run.latest().state).toBe('stopped');
    expect(
      run.workers.every(
        (worker) => vi.mocked(worker.terminate).mock.calls.length === 1,
      ),
    ).toBe(true);
  });

  it('rejects unavailable isolation without creating a worker', () => {
    const run = setup(false);
    run.controller.start('hello');
    expect(run.workers).toHaveLength(0);
    expect(run.latest().message).toContain('isolamento');
  });

  it('bounds incoming output and cleans up when the page unmounts', () => {
    const run = setup();
    run.controller.start('hello');
    run.controller.start('name');
    expect(run.workers).toHaveLength(1);
    run.emit({ type: 'output', text: 'x'.repeat(limits.outputCharacters + 1) });
    expect(run.latest().output).toBe('');
    expect(run.latest().state).toBe('error');
    run.controller.start('name');
    run.controller.dispose();
    expect(run.workers[1]!.terminate).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(limits.loadingMs);
    expect(run.latest().state).toBe('loading'); // no publications after disposal
  });
});

describe('input shared-memory protocol', () => {
  it('preserves UTF-8, rejects overflow and stale/duplicate requests', () => {
    const buffer = createInputBuffer();
    const header = new Int32Array(buffer, 0, 3);
    Atomics.store(header, 2, 7);
    expect(writeInput(buffer, 6, 'stale')).toBe(false);
    expect(writeInput(buffer, 7, '🐍'.repeat(1025))).toBe(false);
    expect(writeInput(buffer, 7, 'two\nlines')).toBe(false);
    expect(writeInput(buffer, 7, 'João 🐍')).toBe(true);
    const bytes = new Uint8Array(
      buffer,
      inputHeaderBytes,
      Atomics.load(header, 1),
    ).slice();
    expect(new TextDecoder().decode(bytes)).toBe('João 🐍');
    expect(writeInput(buffer, 7, 'duplicate')).toBe(false);
  });
  it('distinguishes an empty line from no response', () => {
    const buffer = createInputBuffer();
    const header = new Int32Array(buffer, 0, 3);
    Atomics.store(header, 2, 1);
    expect(writeInput(buffer, 1, '')).toBe(true);
    expect(Atomics.load(header, 0)).toBe(1);
    expect(Atomics.load(header, 1)).toBe(0);
  });
});
