import { useEffect, useRef, useState } from 'react';
import { mountEditor, type EditorSnapshot } from './blockly-adapter';
import { describeSequence } from './descriptions';
import './editor.css';

export default function EditorExperiment() {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<ReturnType<typeof mountEditor> | null>(null);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    program: { blocks: [] },
    selection: 'Nenhum bloco selecionado.',
    selectedId: null,
  });
  const [announcement, setAnnouncement] = useState({
    text: 'Editor pronto para construir.',
    count: 0,
  });
  const [activityAnnouncement, setActivityAnnouncement] = useState({
    text: '',
    count: 0,
  });
  const announce = (text: string) =>
    setAnnouncement((previous) => ({ text, count: previous.count + 1 }));
  useEffect(() => {
    if (!host.current) return;
    const mounted = mountEditor(host.current, setSnapshot, announce);
    editor.current = mounted;
    return () => {
      editor.current = null;
      mounted.dispose();
    };
  }, []);

  const current = snapshot.program.blocks.find(
    (block) => block.id === snapshot.selectedId,
  );
  return (
    <main className="experiment">
      <header>
        <a href="/">Jyboia</a>
        <p className="eyebrow">Laboratório de blocos · prova de conceito</p>
        <h1>Conecte suas ideias</h1>
        <p>
          Escolha um bloco, encaixe os comandos e confira a sequência
          construída.
        </p>
      </header>
      <details className="help" open>
        <summary>Como usar o editor com teclado</summary>
        <p>
          Entre no editor e pressione <kbd>T</kbd> para ir à paleta. Use as
          setas para escolher um bloco e <kbd>Enter</kbd> para inserir. Use as
          setas para escolher o encaixe e <kbd>Enter</kbd> para confirmar;{' '}
          <kbd>Esc</kbd> cancela.
        </p>
        <p>
          No editor, percorra os blocos com ↑ e ↓ e seus campos com ← e →.{' '}
          <kbd>Enter</kbd> edita o campo; <kbd>M</kbd> move o bloco;{' '}
          <kbd>Delete</kbd> exclui. <kbd>I</kbd> repete a descrição.{' '}
          <kbd>Tab</kbd> sai para os controles da página.
        </p>
        <p>
          Com leitor de tela, os atalhos dependem do modo de interação. As
          combinações com NVDA e VoiceOver ainda precisam de validação manual.
        </p>
      </details>
      <nav className="editor-actions" aria-label="Controles do editor">
        <button onClick={() => editor.current?.enter()}>
          Entrar no editor
        </button>
        <button onClick={() => editor.current?.palette()}>
          Escolher tipos de blocos
        </button>
        <button
          disabled={
            !current ||
            !snapshot.program.blocks.some((block) => block.next === current.id)
          }
          onClick={() => current && editor.current?.disconnect(current.id)}
        >
          Desconectar bloco
        </button>
        <button
          onClick={() =>
            editor.current &&
            setActivityAnnouncement((previous) => ({
              text: describeSequence(editor.current!.read()),
              count: previous.count + 1,
            }))
          }
        >
          Iniciar atividade
        </button>
      </nav>
      <div className="editor-host" ref={host} data-testid="editor-host" />
      <p
        role="status"
        aria-label="Alterações do programa"
        aria-live="polite"
        aria-atomic="true"
        className="screen-reader-only"
      >
        <span key={announcement.count}>{announcement.text}</span>
      </p>
      <p
        role="status"
        aria-label="Sequência da atividade"
        aria-live="polite"
        aria-atomic="true"
        className="screen-reader-only"
      >
        <span key={activityAnnouncement.count}>
          {activityAnnouncement.text}
        </span>
      </p>
    </main>
  );
}
