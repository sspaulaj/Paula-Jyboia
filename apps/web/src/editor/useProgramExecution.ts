import { useEffect, useRef, useState } from 'react';
import {
  createExecution,
  initialActorState,
} from '@jyboia/block-engine/runtime';
import type { mountEditor } from '../experiment/blockly-adapter';
import { describeSequence } from '../experiment/descriptions';
import type { ExecutionState } from './types';
import { ProgramError } from '@jyboia/block-engine/experimental';
import type { createAnnouncements } from './announcements';

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    INVALID_ENTRY: 'Adicione um bloco Quando iniciar.',
    MISSING_CONDITION: 'Encaixe um operador na condição do bloco Se.',
    UNKNOWN_VARIABLE:
      'Defina a variável antes de consultar ou alterar seu valor.',
    NUMERIC_LIMIT: 'O valor da variável ultrapassou o limite de um bilhão.',
    EXECUTION_LIMIT: 'Limite de 1.000 passos ou 30 segundos atingido.',
    DEPTH_LIMIT: 'Use no máximo 20 níveis de comandos internos.',
  };
  return messages[code] ?? 'Confira os parâmetros e as conexões do programa.';
}

export function useProgramExecution(
  editorRef: React.RefObject<ReturnType<typeof mountEditor> | null>,
  announcements: ReturnType<typeof createAnnouncements>,
) {
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [actor, setActor] = useState(initialActorState);
  const [error, setError] = useState<{
    message: string;
    blockId?: string;
  } | null>(null);
  const [initialDescription, setInitialDescription] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const execution = useRef<ReturnType<typeof createExecution> | null>(null);
  const announce = announcements.execution;

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      execution.current?.cancel();
    },
    [],
  );

  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    execution.current?.cancel();
    execution.current = null;
    editorRef.current?.workspace.highlightBlock(null);
    setExecutionState('stopped');
    announcements.setExecuting(false);
    announce('Programa parado.');
  };

  const start = () => {
    const editor = editorRef.current;
    if (!editor || execution.current) return;
    setError(null);
    try {
      const program = editor.read();
      const initial = { x: actor.x, y: actor.y, heading: actor.heading };
      const run = createExecution(
        program,
        crypto.randomUUID(),
        () => performance.now(),
        initial,
      );
      execution.current = run;
      setActor({ ...initialActorState(), ...initial });
      setExecutionState('running');
      const description = describeSequence(program);
      setInitialDescription(description);
      announcements.setExecuting(true);
      announce(`Programa iniciado. ${description}`);
      const advance = () => {
        if (execution.current !== run) return;
        for (const event of run.advance()) {
          if (event.type === 'runStarted') {
            editor.workspace.highlightBlock(
              program.blocks.find((block) => block.kind === 'start')!.id,
            );
          } else if (event.type === 'commandStarted') {
            editor.workspace.highlightBlock(event.blockId);
          } else if (event.type === 'actorStateChanged') {
            setActor(event.state);
          } else {
            execution.current = null;
            editor.workspace.highlightBlock(null);
            setExecutionState('idle');
            announcements.setExecuting(false);
            if (event.type === 'runFailed') {
              announce(`Programa interrompido. ${errorMessage(event.code)}`);
              setError({
                message: `Programa interrompido. ${errorMessage(event.code)}`,
                ...(event.blockId ? { blockId: event.blockId } : {}),
              });
            }
            return;
          }
        }
        timer.current = setTimeout(advance, 300);
      };
      advance();
    } catch (failure) {
      const diagnostic =
        failure instanceof ProgramError
          ? failure
          : new ProgramError('INVALID_PROGRAM');
      setError({
        message: `Não foi possível iniciar. ${errorMessage(diagnostic.code)}`,
        ...(diagnostic.blockId ? { blockId: diagnostic.blockId } : {}),
      });
      announce(`Não foi possível iniciar. ${errorMessage(diagnostic.code)}`);
    }
  };

  const reset = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    execution.current?.cancel();
    execution.current = null;
    announcements.setExecuting(false);
    setActor({
      ...initialActorState(),
      ...editorRef.current?.readInitialState(),
    });
    setInitialDescription('');
    setError(null);
    setExecutionState('idle');
  };
  return {
    actor,
    executionState,
    initialDescription,
    start,
    stop,
    error,
    reset,
  };
}
