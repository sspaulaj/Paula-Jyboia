import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { TopBar } from './components/TopBar';
import { CategoryPanel } from './components/CategoryPanel';
import { BlockEditor } from './components/BlockEditor';
import { Stage } from './components/Stage';
import {
  CharacterPanel,
  DEFAULT_CHARACTERS,
} from './components/CharacterPanel';
import { ExecutionControls } from './components/ExecutionControls';
import { useProgramExecution } from './useProgramExecution';
import { connections } from '@jyboia/block-engine/experimental';
import { createAnnouncements } from './announcements';
import type {
  EditorSnapshot,
  mountEditor,
} from '../experiment/blockly-adapter';
import type { BlockCategory } from './types';
import './editor-page.css';

/**
 * Página principal do editor Jyboia.
 *
 * Layout em 3 zonas:
 * - Barra superior: marca, nome do projeto e controles do editor
 * - Esquerda: categorias de blocos + paleta
 * - Centro: área do editor Blockly (ocupa todo o espaço entre paleta e coluna direita)
 * - Direita: palco, personagens e controles de execução
 *
 * Um único editor serve a todos os usuários.
 */
export function EditorPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<BlockCategory>('motion');
  const [selectedCharacter, setSelectedCharacter] = useState('jyboia');
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    program: { blocks: [] },
    selection: 'Nenhum bloco selecionado.',
    selectedId: null,
  });
  const editorRef = useRef<ReturnType<typeof mountEditor> | null>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [sequenceDescription, setSequenceDescription] = useState('');
  const presentSequence = (text: string) => {
    // Commit the reading target before the start button becomes unavailable.
    // Focus conveys the sequence; do not also send it to a live region.
    flushSync(() => setSequenceDescription(text));
    sequenceRef.current?.focus({ preventScroll: true });
  };
  const [executionAnnouncement, setExecutionAnnouncement] = useState({
    text: '',
    count: 0,
  });
  const [announcements] = useState(() =>
    createAnnouncements((text) =>
      setExecutionAnnouncement((previous) => ({
        text,
        count: previous.count + 1,
      })),
    ),
  );
  useEffect(() => () => announcements.dispose(), [announcements]);
  const {
    actor,
    movementDescription,
    error,
    executionState,
    start: handleStartExecution,
    stop: handleStopExecution,
  } = useProgramExecution(editorRef, announcements, presentSequence);
  const stageDescription =
    'Personagem Jyboia. ' +
    movementDescription +
    ' ' +
    (actor.visible ? 'Visível.' : 'Escondido.') +
    (actor.message ? ' Diz: ' + actor.message + '.' : '');

  // "Desconectar bloco" só fica ativo quando o bloco selecionado tem um predecessor
  const isDisconnectEnabled = Boolean(
    snapshot.selectedId &&
    snapshot.program.blocks.some((b) =>
      connections(b).some((edge) => edge.id === snapshot.selectedId),
    ),
  );

  const handleDisconnect = () => {
    if (!snapshot.selectedId) return;
    editorRef.current?.disconnect(snapshot.selectedId);
  };

  return (
    <div
      className="editor-page"
      onPointerMoveCapture={announcements.resumeEditing}
      onPointerDownCapture={announcements.resumeEditing}
      onKeyDownCapture={announcements.resumeEditing}
    >
      <TopBar
        isDisconnectEnabled={
          isDisconnectEnabled && executionState !== 'running'
        }
        onEnterEditor={() => {
          if (executionState !== 'running') editorRef.current?.enter();
        }}
        onOpenPalette={() => {
          if (executionState !== 'running') editorRef.current?.palette();
        }}
        onDisconnect={handleDisconnect}
      />

      <div className="editor-page__body">
        {/* Coluna esquerda: categorias de blocos */}
        <aside
          inert={executionState === 'running'}
          className="editor-page__left"
          aria-label="Categorias de blocos"
        >
          <CategoryPanel
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </aside>

        {/* Centro: editor de blocos — ocupa todo o espaço restante */}
        <main
          inert={executionState === 'running'}
          className="editor-page__center"
        >
          <BlockEditor
            onAnnounce={announcements.edit}
            category={selectedCategory}
            editorRef={editorRef}
            onSnapshotChange={setSnapshot}
          />
        </main>

        {/* Direita: palco + personagens + controles */}
        <aside className="editor-page__right" aria-label="Palco e personagens">
          <ExecutionControls
            state={executionState}
            sequenceRef={sequenceRef}
            sequenceDescription={sequenceDescription}
            onStart={handleStartExecution}
            onStop={handleStopExecution}
          />
          <Stage
            actor={actor}
            executionState={executionState}
            stageDescription={stageDescription}
          />
          {error && (
            <div>
              <p>{error.message}</p>
              {error.blockId && (
                <button
                  type="button"
                  onClick={() =>
                    error.blockId && editorRef.current?.focus(error.blockId)
                  }
                >
                  Ir ao bloco com erro
                </button>
              )}
            </div>
          )}
          <CharacterPanel
            characters={DEFAULT_CHARACTERS}
            selectedId={selectedCharacter}
            onSelect={setSelectedCharacter}
          />
        </aside>
      </div>

      {/* Anúncio de execução para leitores de tela (inclui sequência ao iniciar) */}
      <p
        role="status"
        data-testid="editor-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="screen-reader-only"
      >
        <span key={executionAnnouncement.count}>
          {executionAnnouncement.text}
        </span>
      </p>
    </div>
  );
}
