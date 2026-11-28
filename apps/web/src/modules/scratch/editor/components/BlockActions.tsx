import { useState } from 'react';
import {
  canConnect,
  connections,
  type ConnectionSlot,
  type PrototypeBlock,
} from '@jyboia/block-engine/experimental';
import type {
  EditorSnapshot,
  mountEditor,
} from '../../experiment/blockly-adapter';
import { describeBlock } from '../../experiment/descriptions';
import { BLOCKS_BY_CATEGORY } from '../categories';
import type { BlockCategory } from '../types';

const labels: Record<PrototypeBlock['kind'], string> = {
  changeX: 'Alterar X',
  changeY: 'Alterar Y',
  direction: 'Apontar direção',
  sayFor: 'Dizer por N segundos',
  ifElse: 'Se condição, então, senão',
  start: 'Quando iniciar',
  actorClick: 'Quando o personagem for clicado',
  move: 'Mover N passos',
  turn: 'Girar N graus',
  goto: 'Ir para X, Y',
  say: 'Dizer texto',
  show: 'Mostrar',
  hide: 'Esconder',
  wait: 'Esperar N segundos',
  repeat: 'Repetir N vezes',
  forever: 'Sempre',
  if: 'Se condição, então',
  gt: 'Maior que',
  lt: 'Menor que',
  eq: 'Igual a',
  set: 'Definir variável',
  change: 'Alterar variável',
};
const slots: Record<ConnectionSlot, string> = {
  elseBody: 'Dentro do senão',
  next: 'Depois',
  body: 'Dentro',
  condition: 'Na condição',
};

export function BlockActions({
  category,
  snapshot,
  editorRef,
}: {
  category: BlockCategory;
  snapshot: EditorSnapshot;
  editorRef: React.RefObject<ReturnType<typeof mountEditor> | null>;
}) {
  const [sourceId, setSourceId] = useState('');
  const [destination, setDestination] = useState('');
  const [kind, setKind] = useState<PrototypeBlock['kind']>('move');
  const available = BLOCKS_BY_CATEGORY[category];
  const insertKind = available.includes(kind) ? kind : available[0]!;
  const source =
    snapshot.program.blocks.find((block) => block.id === sourceId) ??
    snapshot.program.blocks.find((block) => block.id === snapshot.selectedId);
  const destinations = source
    ? snapshot.program.blocks.flatMap((block, index) =>
        (['next', 'body', 'elseBody', 'condition'] as const)
          .filter((slot) =>
            canConnect(snapshot.program, source.id, block.id, slot),
          )
          .map((slot) => ({
            id: block.id,
            slot,
            key: JSON.stringify([block.id, slot]),
            label: `${slots[slot]} do bloco ${index + 1}: ${describeBlock(block)}`,
          })),
      )
    : [];
  const target =
    destinations.find((item) => item.key === destination) ?? destinations[0];
  const addExample = () => {
    const editor = editorRef.current;
    if (!editor || editor.workspace.remainingCapacity() < 7) return;
    const start = editor.insert('start')!,
      move = editor.insert('move')!,
      repeat = editor.insert('repeat')!,
      inner = editor.insert('move')!,
      conditional = editor.insert('if')!,
      comparison = editor.insert('gt')!,
      say = editor.insert('say')!;
    editor.connect(move, start, 'next');
    editor.connect(repeat, move, 'next');
    editor.connect(inner, repeat, 'body');
    editor.connect(conditional, repeat, 'next');
    editor.connect(comparison, conditional, 'condition');
    editor.connect(say, conditional, 'body');
    setSourceId(start);
    editor.workspace.scrollCenter();
  };
  return (
    <section
      className="block-actions"
      aria-label="Organizar blocos sem arrastar"
    >
      <div className="block-actions__controls">
        <label>
          Bloco para adicionar
          <select
            value={insertKind}
            onChange={(event) =>
              setKind(event.target.value as PrototypeBlock['kind'])
            }
          >
            {available.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            const id = editorRef.current?.insert(insertKind);
            if (id) setSourceId(id);
          }}
        >
          Adicionar bloco
        </button>
        <label>
          Bloco para organizar
          <select
            value={source?.id ?? ''}
            onChange={(event) => {
              setSourceId(event.target.value);
              setDestination('');
            }}
          >
            <option value="">Selecione um bloco</option>
            {snapshot.program.blocks.map((block, index) => (
              <option key={block.id} value={block.id}>
                {index + 1}. {describeBlock(block)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Encaixe disponível
          <select
            value={target?.key ?? ''}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">Selecione um encaixe</option>
            {destinations.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!source || !target}
          onClick={() =>
            source &&
            target &&
            editorRef.current?.connect(source.id, target.id, target.slot)
          }
        >
          Conectar sequência
        </button>
        <button
          type="button"
          disabled={
            !source ||
            !snapshot.program.blocks.some((block) =>
              connections(block).some((edge) => edge.id === source.id),
            )
          }
          onClick={() => source && editorRef.current?.disconnect(source.id)}
        >
          Soltar bloco escolhido
        </button>
        <button
          type="button"
          disabled={!source}
          onClick={() => {
            if (source) editorRef.current?.remove(source.id);
            setSourceId('');
          }}
        >
          Excluir bloco escolhido
        </button>
        <button
          type="button"
          disabled={snapshot.program.blocks.length > 193}
          onClick={addExample}
        >
          Adicionar exemplo com repetição e condição
        </button>
      </div>
      <p>
        Conectar sequência move o bloco com seus sucessores e comandos internos.
        Excluir remove também os comandos internos; a sequência seguinte é
        preservada. No editor: setas percorrem blocos, campos e entradas; Enter
        confirma; M move; Esc cancela; Delete exclui; Tab sai.
      </p>
    </section>
  );
}
