import { useEffect, useRef } from 'react';
import {
  mountEditor,
  type EditorSnapshot,
} from '../../experiment/blockly-adapter';
import '../../experiment/editor.css';
import { BLOCKS_BY_CATEGORY } from '../categories';
import type { BlockCategory } from '../types';

interface BlockEditorProps {
  onAnnounce: (text: string) => void;
  category: BlockCategory;
  /** Chamado quando o snapshot do programa muda */
  onSnapshotChange?: (snapshot: EditorSnapshot) => void;
  /** Referência externa para acionar operações no editor (enter, palette, disconnect) */
  editorRef?: React.MutableRefObject<ReturnType<typeof mountEditor> | null>;
}

/**
 * Área central de programação com o editor Blockly.
 *
 * Preserva toda a PoC existente: blocos, encaixes, teclado,
 * acessibilidade e anúncios. Os controles do editor (Entrar, Paleta,
 * Desconectar) foram movidos para a TopBar — este componente expõe
 * a referência do editor para que os controles possam acioná-lo.
 */
export function BlockEditor({
  category,
  onSnapshotChange,
  editorRef,
  onAnnounce,
}: BlockEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const internalRef = useRef<ReturnType<typeof mountEditor> | null>(null);
  const announce = onAnnounce;

  useEffect(() => {
    if (!host.current) return;
    const mounted = mountEditor(
      host.current,
      (s) => {
        onSnapshotChange?.(s);
      },
      announce,
    );
    internalRef.current = mounted;
    if (editorRef) editorRef.current = mounted;
    return () => {
      internalRef.current = null;
      if (editorRef) editorRef.current = null;
      mounted.dispose();
    };
    // editorRef e onSnapshotChange são referências estáveis passadas uma vez
  }, []);

  useEffect(() => {
    internalRef.current?.setPalette(BLOCKS_BY_CATEGORY[category]);
  }, [category]);

  return (
    <section id="block-editor" className="block-editor">
      <div className="editor-host" ref={host} data-testid="editor-host" />
    </section>
  );
}

import React from 'react';
