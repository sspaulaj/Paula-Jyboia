import * as Blockly from 'blockly/core';
import * as portuguese from 'blockly/msg/pt-br';
import {
  inspectProgram,
  isEvent,
  canConnect,
  validOperand,
  type ConnectionSlot,
  type PrototypeBlock,
  type PrototypeProgram,
} from '@jyboia/block-engine/experimental';
import { describeBlock, describeConnection } from './descriptions';
import { describeField, fieldInstructions } from './field-descriptions';
import { accessibilityMessages } from './locale';
import { createDragPreviewer } from './drag-feedback';
import { extendedDefinitions } from './extended-blocks';
import {
  inactiveStarts,
  writeBlocks,
  verifyImport,
  normalizeBlocks,
  documentKey,
} from './project-adapter';
import type { EditorDocument } from '@jyboia/block-engine/editor-document';

export function readBlock(block: Blockly.Block): PrototypeBlock {
  const base = { id: block.id, next: block.getNextBlock()?.id ?? null };
  switch (block.type) {
    case 'jyboia_changeX':
    case 'jyboia_changeY':
      return {
        ...base,
        kind: block.type === 'jyboia_changeX' ? 'changeX' : 'changeY',
        amount: Number(block.getFieldValue('AMOUNT')),
      };
    case 'jyboia_direction':
      return {
        ...base,
        kind: 'direction',
        degrees: Number(block.getFieldValue('DIRECTION')),
      };
    case 'jyboia_sayFor':
      return {
        ...base,
        kind: 'sayFor',
        text: String(block.getFieldValue('TEXT')),
        seconds: Number(block.getFieldValue('SECONDS')),
      };
    case 'jyboia_ifElse':
      return {
        ...base,
        kind: 'ifElse',
        condition: block.getInputTargetBlock('CONDITION')?.id ?? null,
        body: block.getInputTargetBlock('BODY')?.id ?? null,
        elseBody: block.getInputTargetBlock('ELSE')?.id ?? null,
      };
    case 'jyboia_goto':
      return {
        ...base,
        kind: 'goto',
        x: Number(block.getFieldValue('X')),
        y: Number(block.getFieldValue('Y')),
      };
    case 'jyboia_show':
      return { ...base, kind: 'show' };
    case 'jyboia_hide':
      return { ...base, kind: 'hide' };
    case 'jyboia_wait':
      return {
        ...base,
        kind: 'wait',
        seconds: Number(block.getFieldValue('SECONDS')),
      };
    case 'jyboia_repeat':
      return {
        ...base,
        kind: 'repeat',
        times: Number(block.getFieldValue('TIMES')),
        body: block.getInputTargetBlock('BODY')?.id ?? null,
      };
    case 'jyboia_forever':
      return {
        ...base,
        kind: 'forever',
        body: block.getInputTargetBlock('BODY')?.id ?? null,
      };
    case 'jyboia_if':
      return {
        ...base,
        kind: 'if',
        condition: block.getInputTargetBlock('CONDITION')?.id ?? null,
        body: block.getInputTargetBlock('BODY')?.id ?? null,
      };
    case 'jyboia_gt':
    case 'jyboia_lt':
    case 'jyboia_eq':
      return {
        ...base,
        kind: block.type.slice(7) as 'gt' | 'lt' | 'eq',
        left: String(block.getFieldValue('LEFT')),
        right: String(block.getFieldValue('RIGHT')),
      };
    case 'jyboia_set':
    case 'jyboia_change':
      return {
        ...base,
        kind: block.type.slice(7) as 'set' | 'change',
        name: String(block.getFieldValue('NAME')),
        value: Number(block.getFieldValue('VALUE')),
      };
    case 'jyboia_start':
      return { ...base, kind: 'start' };
    case 'jyboia_actorClick':
      return { ...base, kind: 'actorClick' };
    case 'jyboia_move':
      return {
        ...base,
        kind: 'move',
        steps: Number(block.getFieldValue('STEPS')),
      };
    case 'jyboia_turn':
      return {
        ...base,
        kind: 'turn',
        degrees: -Number(block.getFieldValue('DEGREES')),
      };
    case 'jyboia_say':
      return {
        ...base,
        kind: 'say',
        text: String(block.getFieldValue('TEXT')),
      };
    default:
      throw new Error('Tipo de bloco não suportado nesta experiência.');
  }
}

export function readProgram(
  workspace: Blockly.Workspace,
  validate = true,
): PrototypeProgram {
  const program = {
    blocks: workspace
      .getAllBlocks(false)
      .filter((block) => !block.isInsertionMarker())
      .map(readBlock),
    ...(inactiveStarts.has(workspace)
      ? {
          entryBlockIds: workspace
            .getAllBlocks(false)
            .filter(
              (block) =>
                (block.type === 'jyboia_start' ||
                  block.type === 'jyboia_actorClick') &&
                !block.isInsertionMarker() &&
                !inactiveStarts.get(workspace)!.has(block.id),
            )
            .map((block) => block.id),
        }
      : {}),
  };
  if (validate) inspectProgram(program);
  return program;
}

let registered = false;
export function registerBlocks() {
  if (registered) return;
  registered = true;
  const messages: Record<string, string> = {};
  for (const [key, value] of Object.entries(portuguese)) {
    if (typeof value === 'string') messages[key] = value;
  }
  Blockly.setLocale({ ...messages, ...accessibilityMessages });
  const definitions = [
    {
      type: 'jyboia_actorClick',
      message0: 'quando o personagem for clicado',
      args0: [],
      colour: '#9b6500',
      nextStatement: 'Command',
      hat: 'cap',
    },
    {
      type: 'jyboia_start',
      message0: 'quando iniciar',
      args0: [],
      colour: '#9b6500',
      nextStatement: 'Command',
      hat: 'cap',
    },
    {
      type: 'jyboia_move',
      message0: 'mover %1 passos',
      args0: [
        {
          type: 'field_number',
          name: 'STEPS',
          value: 10,
          min: -480,
          max: 480,
          precision: 1,
        },
      ],
      colour: '#285cba',
      previousStatement: 'Command',
      nextStatement: 'Command',
    },
    {
      type: 'jyboia_turn',
      message0: 'girar %1 graus à direita',
      args0: [
        {
          type: 'field_number',
          name: 'DEGREES',
          value: 15,
          min: 0,
          max: 360,
          precision: 1,
        },
      ],
      colour: '#285cba',
      previousStatement: 'Command',
      nextStatement: 'Command',
    },
    {
      type: 'jyboia_say',
      message0: 'dizer %1',
      args0: [{ type: 'field_input', name: 'TEXT', text: 'Olá' }],
      colour: '#7542a6',
      previousStatement: 'Command',
      nextStatement: 'Command',
    },
  ];
  for (const definition of [...definitions, ...extendedDefinitions]) {
    Blockly.Blocks[definition.type] = {
      init(this: Blockly.BlockSvg) {
        this.jsonInit(definition);
        this.setAriaRoleDescriptionProvider('bloco de programação');
        this.setTooltip(() => describeBlock(readBlock(this)));
        this.getInput('BODY')?.setAriaLabelProvider(() => 'Comandos internos');
        this.getInput('ELSE')?.setAriaLabelProvider(
          () => 'Comandos do senão, quando a condição for falsa',
        );
        this.getInput('CONDITION')?.setAriaLabelProvider(
          () => 'Condição: encaixe um operador booleano',
        );
        for (const [field, label] of Object.entries({
          STEPS: 'passos, número inteiro entre -480 e 480',
          DEGREES: 'graus para a direita, número inteiro entre 0 e 360',
          TEXT: 'mensagem, até 120 caracteres',
          AMOUNT: 'alteração de posição, de -480 a 480',
          DIRECTION: 'direção em graus, zero aponta para a direita',
          X: 'posição horizontal, de -240 a 240',
          Y: 'posição vertical, de -180 a 180',
          SECONDS: 'segundos, de 0 a 30',
          TIMES: 'repetições, inteiro de 0 a 1000',
          NAME: 'nome da variável',
          VALUE: 'valor numérico',
          LEFT: 'primeiro valor: número ou nome de variável',
          RIGHT: 'segundo valor: número ou nome de variável',
        }))
          this.getField(field)?.setAriaTypeName(
            `${fieldInstructions[field]}. ${label}`,
          );
        this.getField('NAME')?.setValidator((value: string) =>
          /^[\p{L}_][\p{L}\p{N}_ ]{0,31}$/u.test(value.trim())
            ? value.trim()
            : null,
        );
        for (const field of ['LEFT', 'RIGHT'])
          this.getField(field)?.setValidator((value: string) =>
            validOperand(value.trim()) ? value.trim() : null,
          );
        this.getField('TEXT')?.setValidator((value: string) =>
          value.replaceAll('\0', '').slice(0, 120),
        );
      },
      // Sobrescrita por definição customizada; preserva foco e navegação do Blockly.
      getAriaLabel(this: Blockly.BlockSvg) {
        const block = readBlock(this);
        const description = describeBlock(
          block,
          readProgram(this.workspace, false),
        );
        if (this.isInFlyout)
          return `${description} Na paleta. Enter para inserir.`;
        try {
          return `${description} ${describeConnection(block, readProgram(this.workspace))}`;
        } catch {
          return `${description} Estrutura fora dos limites; revise os encaixes internos antes de executar.`;
        }
      },
    };
  }
}

export const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'flyoutToolbox',
  contents: ['start', 'move', 'turn', 'say'].map((kind) => ({
    kind: 'block',
    type: `jyboia_${kind}`,
  })),
};

export interface EditorSnapshot {
  program: PrototypeProgram;
  selection: string;
  selectedId: string | null;
  contentKey?: string;
}

export function mountEditor(
  container: HTMLDivElement,
  update: (snapshot: EditorSnapshot) => void,
  announce: (message: string, newPointerEntry?: boolean) => void,
) {
  registerBlocks();
  const workspace = Blockly.inject(container, {
    plugins: {
      connectionPreviewer: createDragPreviewer(container, announce, (id) => {
        const anchor = dragAnchorId;
        cancelAnimationFrame(autoDropFrame);
        autoDropFrame = requestAnimationFrame(() =>
          autoConnectDrop(id, anchor),
        );
      }),
    },
    toolbox,
    renderer: 'zelos',
    sounds: false,
    trashcan: false,
    maxBlocks: 200,
    comments: false,
    collapse: false,
    disable: false,
    move: { scrollbars: true, drag: true, wheel: true },
    zoom: { controls: false, wheel: false, startScale: 1 },
    grid: { spacing: 24, length: 2, colour: '#d6dfd9', snap: false },
  });
  // Blockly injects its own aria-live region (#blocklyAriaAnnounce) and uses
  // it to announce focus changes (e.g. "3 of 6 level 1"). All accessibility
  // announcements in Jyboia go through the editor's own aria-live region in
  // EditorPage, so silence Blockly's region to avoid duplicate and confusing
  // screen reader output.
  document
    .getElementById('blocklyAriaAnnounce')
    ?.setAttribute('aria-live', 'off');
  // The listbox canvas covers its items; name the full flyout surface too,
  // including the background below the last block and around the scrollbar.
  const paletteSurface = workspace.getFlyout()?.getWorkspace().getParentSvg();
  paletteSurface?.setAttribute('role', 'region');
  paletteSurface?.setAttribute('aria-label', 'Lista de blocos');
  let disposed = false;
  let frame = 0;
  let selectedId: string | null = null;
  let dragAnchorId: string | null = null;
  let autoDropFrame = 0;
  const captureDropAnchor = () => {
    dragAnchorId = selectedId;
  };
  container.addEventListener('pointerdown', captureDropAnchor, true);
  function autoConnectDrop(id: string, anchorId: string | null) {
    if (disposed || loading) return;
    const block = workspace.getBlockById(id);
    // Native/explicit connections win. Event hats always start new sequences.
    if (!block || block.getParent() || isEvent(readBlock(block))) return;
    const descendants = new Set(
      block.getDescendants(false).map((child) => child.id),
    );
    let target = anchorId ? workspace.getBlockById(anchorId) : null;
    if (!target || descendants.has(target.id)) {
      target =
        workspace
          .getTopBlocks(false)
          .filter(
            (item) => isEvent(readBlock(item)) && !descendants.has(item.id),
          )
          .at(-1) ?? null;
      if (target) while (target.getNextBlock()) target = target.getNextBlock()!;
    }
    if (!target) return;
    let slot: ConnectionSlot = block.outputConnection
      ? 'condition'
      : target.getInput('BODY')
        ? 'body'
        : 'next';
    let destination =
      slot === 'condition'
        ? target.getInput('CONDITION')?.connection
        : slot === 'body'
          ? target.getInput('BODY')?.connection
          : target.nextConnection;
    // Append inside the chosen body/sequence, preserving every existing block.
    if (slot !== 'condition' && destination?.targetBlock()) {
      target = destination.targetBlock() as Blockly.BlockSvg;
      while (target.getNextBlock()) target = target.getNextBlock()!;
      slot = 'next';
      destination = target.nextConnection;
    }
    const source =
      slot === 'condition' ? block.outputConnection : block.previousConnection;
    if (
      !source ||
      !destination ||
      !canConnect(readProgram(workspace, false), id, target.id, slot)
    )
      return;
    Blockly.Events.setGroup(true);
    try {
      destination.connect(source);
    } finally {
      Blockly.Events.setGroup(false);
    }
    selectedId = id;
    synchronize();
  }
  let initialState = { x: 0, y: 0, heading: 0 };
  let loading = false;
  const exportDocument = (): EditorDocument => {
    const program = readProgram(workspace);
    return {
      schemaVersion: 2,
      program: {
        ...program,
        entryBlockIds: inspectProgram(program).starts.map((block) => block.id),
      },
      initialState: { ...initialState },
      layout: workspace
        .getTopBlocks(false)
        .filter((block) => !block.isInsertionMarker())
        .map((block) => {
          const point = block.getRelativeToSurfaceXY();
          return {
            blockId: block.id,
            x: Math.round(point.x * 1e6) / 1e6,
            y: Math.round(point.y * 1e6) / 1e6,
          };
        }),
    };
  };
  let invalidStructure = false;
  let pendingDisconnect: { group: string; message: string } | null = null;
  // Pending move announcement: accumulates across events of the same gesture
  // and flushes once via requestAnimationFrame, so only one message fires per
  // connect/disconnect action regardless of how many BlockMove events Blockly
  // emits for the same group.
  let pendingMoveAnnouncement: string | null = null;
  let moveFrame = 0;
  const flushMoveAnnouncement = () => {
    if (pendingMoveAnnouncement !== null) {
      announce(pendingMoveAnnouncement);
      pendingMoveAnnouncement = null;
    }
  };
  const synchronize = () => {
    if (disposed || loading) return;
    const program = readProgram(workspace, false);
    try {
      inspectProgram(program);
      invalidStructure = false;
    } catch {
      if (!invalidStructure)
        announce(
          'Estrutura fora dos limites. Use no máximo 20 níveis internos e confira as conexões. Você pode desconectar ou excluir blocos para corrigir.',
        );
      invalidStructure = true;
    }
    for (const block of workspace.getAllBlocks(false)) {
      if (block.isInsertionMarker()) continue;
      // Mantém nome atualizado inclusive antes do próximo foco; nunca muda aria-hidden/tabindex da biblioteca.
      block
        .getFocusableElement()
        .setAttribute(
          'aria-label',
          block.getAriaLabel(Blockly.utils.aria.Verbosity.STANDARD),
        );
    }
    const selected = Blockly.getSelected();
    if (
      selected instanceof Blockly.BlockSvg &&
      selected.workspace === workspace &&
      !selected.isInsertionMarker()
    )
      selectedId = selected.id;
    const inspected = selectedId ? workspace.getBlockById(selectedId) : null;
    if (!inspected) selectedId = null;
    const selection = inspected
      ? inspected.getAriaLabel(Blockly.utils.aria.Verbosity.STANDARD)
      : 'Nenhum bloco selecionado.';
    update({
      program,
      selection,
      selectedId,
      contentKey: invalidStructure ? 'invalid' : documentKey(exportDocument()),
    });
    if (pendingDisconnect) {
      announce(pendingDisconnect.message);
      pendingDisconnect = null;
    }
  };
  const onChange = (event: Blockly.Events.Abstract) => {
    if (loading) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(synchronize);
    if (
      event instanceof Blockly.Events.BlockMove &&
      event.oldParentId !== event.newParentId &&
      event.group !== pendingDisconnect?.group
    ) {
      const block = event.blockId
        ? workspace.getBlockById(event.blockId)
        : null;
      if (block && !block.isInsertionMarker()) {
        // Only keep the first block of the group; subsequent BlockMove events
        // from the same gesture (child blocks being dragged along) are ignored.
        if (pendingMoveAnnouncement === null) {
          pendingMoveAnnouncement = `${event.newParentId ? 'Conexão confirmada.' : 'Bloco desconectado.'} ${describeBlock(readBlock(block))}`;
          cancelAnimationFrame(moveFrame);
          moveFrame = requestAnimationFrame(flushMoveAnnouncement);
        }
      }
    }
    if (event.type === Blockly.Events.BLOCK_DELETE)
      announce('Bloco excluído. A sequência foi atualizada.');
    if (
      event instanceof Blockly.Events.BlockChange &&
      event.element === 'field'
    ) {
      const block = event.blockId
        ? workspace.getBlockById(event.blockId)
        : null;
      if (block)
        announce(`Parâmetro atualizado. ${describeBlock(readBlock(block))}`);
    }
  };
  workspace.addChangeListener(onChange);
  // Resolve the innermost block, including fields and connected SVG children.
  const blockUnderPointer = (
    target: EventTarget | null,
    x: number,
    y: number,
  ) => {
    if (!(target instanceof Element)) return null;
    const blocks = [
      ...workspace.getAllBlocks(false),
      ...(workspace.getFlyout()?.getWorkspace().getAllBlocks(false) ?? []),
    ].filter((block) => !block.isInsertionMarker());
    for (
      let element: Element | null = target;
      element && element !== container;
      element = element.parentElement
    ) {
      const block = blocks.find(
        (candidate) => candidate.getSvgRoot() === element,
      );
      if (block) return block;
    }
    // Flyout hit rectangles can be siblings of the SVG block, not its children.
    if (target.closest('.blocklyFlyout')) {
      return (
        blocks.find((block) => {
          if (!block.isInFlyout) return false;
          const box = block.getSvgRoot().getBoundingClientRect();
          return (
            x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
          );
        }) ?? null
      );
    }
    return null;
  };
  let pointerTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerBlock: Blockly.BlockSvg | null = null;
  let pointerField: Blockly.Field | null = null;
  let pointerListBackground = false;
  let pointerPosition: { x: number; y: number } | null = null;
  const clearPointer = () => {
    if (pointerTimer !== undefined) clearTimeout(pointerTimer);
    pointerTimer = undefined;
  };
  const updatePointer = (event: PointerEvent, target: EventTarget | null) => {
    // Layout/SVG updates can emit boundary events without physical movement.
    if (
      pointerPosition?.x === event.clientX &&
      pointerPosition.y === event.clientY
    )
      return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    const block = event.buttons
      ? null
      : blockUnderPointer(target, event.clientX, event.clientY);
    // Coordinates also cover flyout hit rectangles layered over field SVGs.
    // Never treat static labels as editable values.
    const field =
      block?.inputList
        .flatMap((input) => input.fieldRow)
        .find((candidate) => {
          if (!candidate.name || !fieldInstructions[candidate.name])
            return false;
          const root = candidate.getSvgRoot();
          if (!root) return false;
          const box = root.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom
          );
        }) ?? null;
    const listBackground =
      !event.buttons &&
      !block &&
      target instanceof Element &&
      paletteSurface?.contains(target) === true;
    if (
      block === pointerBlock &&
      field === pointerField &&
      listBackground === pointerListBackground
    )
      return;
    clearPointer();
    pointerBlock?.getSvgRoot()?.classList.remove('jyboia-pointer-block');
    pointerBlock = block;
    pointerField = field;
    pointerListBackground = listBackground;
    if (!block && !listBackground) return;
    block?.getSvgRoot().classList.add('jyboia-pointer-block');
    pointerTimer = setTimeout(() => {
      pointerTimer = undefined;
      if (!disposed && !block && pointerListBackground) {
        announce('Lista de blocos.', true);
        return;
      }
      if (
        !disposed &&
        block &&
        pointerBlock === block &&
        block.workspace.getBlockById(block.id)
      )
        announce(
          field?.name
            ? describeField(field.name, field.getText())
            : block.getAriaLabel(Blockly.utils.aria.Verbosity.STANDARD),
          true,
        );
    }, 180);
  };
  const onPointerOver = (event: PointerEvent) =>
    updatePointer(event, event.target);
  const onPointerOut = (event: PointerEvent) => {
    // Internal out/over pairs share coordinates. Do not consume the new
    // position on out, or the following over event would be ignored.
    if (
      !(event.relatedTarget instanceof Node) ||
      !container.contains(event.relatedTarget)
    )
      updatePointer(event, null);
  };
  container.addEventListener('pointerover', onPointerOver, true);
  container.addEventListener('pointermove', onPointerOver, true);
  container.addEventListener('pointerout', onPointerOut, true);
  // Reparenting SVG during a keyboard drop can clear native browser focus.
  // Restore only that keyboard target, never after a pointer action or Tab.
  const preserveDropFocus = (event: KeyboardEvent) => {
    const node = Blockly.getFocusManager().getFocusedNode();
    if (
      event.key !== 'Enter' ||
      !(node instanceof Blockly.BlockSvg) ||
      node.workspace !== workspace
    )
      return;
    const id = node.id;
    requestAnimationFrame(() => {
      if (disposed || document.activeElement !== document.body) return;
      const block = workspace.getBlockById(id);
      if (block) Blockly.getFocusManager().focusNode(block);
    });
  };
  container.addEventListener('keydown', preserveDropFocus, true);
  const observer = new ResizeObserver(() => Blockly.svgResize(workspace));
  observer.observe(container);
  let focusFrame = 0;
  let insertionVersion = 0;
  synchronize();
  return {
    workspace,
    prepareExecution() {
      clearPointer();
      Blockly.Tooltip.hide();
      cancelAnimationFrame(moveFrame);
      pendingMoveAnnouncement = null;
      pendingDisconnect = null;
      ++insertionVersion;
      cancelAnimationFrame(focusFrame);
    },
    exportDocument,
    readInitialState: () => ({ ...initialState }),
    loadDocument(input: unknown) {
      const document = verifyImport(input);
      const staging = new Blockly.Workspace();
      let serialized: ReturnType<typeof Blockly.serialization.workspaces.save>;
      Blockly.Events.disable();
      try {
        writeBlocks(staging, document);
        if (
          JSON.stringify(normalizeBlocks(readProgram(staging).blocks)) !==
          JSON.stringify(normalizeBlocks(document.program.blocks))
        )
          throw new Error(
            'Um parâmetro do projeto não é compatível com o editor.',
          );
        serialized = Blockly.serialization.workspaces.save(staging);
      } finally {
        staging.dispose();
        Blockly.Events.enable();
      }
      const previous = Blockly.serialization.workspaces.save(workspace);
      const previousState = initialState;
      const previousInactive = inactiveStarts.get(workspace);
      loading = true;
      cancelAnimationFrame(frame);
      clearPointer();
      Blockly.Events.disable();
      try {
        Blockly.serialization.workspaces.load(serialized!, workspace);
        initialState = { ...document.initialState };
        inactiveStarts.set(
          workspace,
          new Set(
            document.program.blocks
              .filter(
                (block) =>
                  isEvent(block) &&
                  !document.program.entryBlockIds.includes(block.id),
              )
              .map((block) => block.id),
          ),
        );
        selectedId = null;
        pendingDisconnect = null;
        workspace.clearUndo();
      } catch (error) {
        Blockly.serialization.workspaces.load(previous, workspace);
        initialState = previousState;
        if (previousInactive) inactiveStarts.set(workspace, previousInactive);
        else inactiveStarts.delete(workspace);
        throw error;
      } finally {
        Blockly.Events.enable();
        loading = false;
      }
      synchronize();
      workspace.scrollCenter();
    },
    focus(id: string) {
      const block = workspace.getBlockById(id);
      if (block) Blockly.getFocusManager().focusNode(block);
    },
    insert(kind: PrototypeBlock['kind']) {
      if (workspace.remainingCapacity() < 1) {
        announce('Limite de 200 blocos atingido.');
        return null;
      }
      const block = workspace.newBlock(`jyboia_${kind}`);
      block.initSvg();
      block.render();
      block.moveBy(
        320 + (workspace.getTopBlocks(false).length % 4) * 35,
        50 + (workspace.getTopBlocks(false).length % 6) * 50,
      );
      selectedId = block.id;
      synchronize();
      // Focar somente após a renderização: o SVG é reanexado durante o layout.
      const origin = document.activeElement;
      const version = ++insertionVersion;
      void Blockly.renderManagement.finishQueuedRenders().then(() => {
        if (disposed || version !== insertionVersion) return;
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(() => {
          if (
            !disposed &&
            version === insertionVersion &&
            workspace.getBlockById(block.id) === block &&
            (document.activeElement === origin ||
              document.activeElement === document.body)
          )
            Blockly.getFocusManager().focusNode(block);
        });
      });
      announce(`Bloco inserido. ${describeBlock(readBlock(block))}`);
      return block.id;
    },
    connect(id: string, targetId: string, slot: ConnectionSlot) {
      if (!canConnect(readProgram(workspace, false), id, targetId, slot)) {
        announce(
          'Encaixe incompatível, ocupado ou circular. Escolha outro destino.',
        );
        return false;
      }
      const block = workspace.getBlockById(id)!;
      const target = workspace.getBlockById(targetId)!;
      const destination =
        slot === 'next'
          ? target.nextConnection
          : target.getInput(
              slot === 'body'
                ? 'BODY'
                : slot === 'elseBody'
                  ? 'ELSE'
                  : 'CONDITION',
            )?.connection;
      const source =
        slot === 'condition'
          ? block.outputConnection
          : block.previousConnection;
      if (!destination || !source) return false;
      Blockly.Events.setGroup(true);
      try {
        block.unplug(false);
        destination.connect(source);
      } finally {
        Blockly.Events.setGroup(false);
      }
      selectedId = block.id;
      synchronize();
      Blockly.getFocusManager().focusNode(block);
      return true;
    },
    remove(id: string) {
      const block = workspace.getBlockById(id);
      if (!block) return;
      const focus = block.getNextBlock() ?? block.getParent();
      block.dispose(true);
      selectedId = focus?.id ?? null;
      synchronize();
      if (focus && workspace.getBlockById(focus.id))
        Blockly.getFocusManager().focusNode(focus);
      else Blockly.getFocusManager().focusTree(workspace);
    },
    setPalette(kinds: readonly PrototypeBlock['kind'][]) {
      workspace.updateToolbox({
        kind: 'flyoutToolbox',
        contents: kinds.length
          ? kinds.map((kind) => ({ kind: 'block', type: `jyboia_${kind}` }))
          : [{ kind: 'label', text: 'Sem blocos disponíveis.' }],
      });
      Blockly.svgResize(workspace);
    },
    enter() {
      Blockly.getFocusManager().focusTree(workspace);
    },
    palette() {
      const first = workspace.getFlyout()?.getWorkspace().getTopBlocks(true)[0];
      if (first) Blockly.getFocusManager().focusNode(first);
    },
    read() {
      return readProgram(workspace);
    },
    connectAfter(id: string, targetId: string) {
      const block = workspace.getBlockById(id);
      const target = workspace.getBlockById(targetId);
      if (
        !block?.previousConnection ||
        !target?.nextConnection ||
        target.getNextBlock() ||
        block.getDescendants(false).includes(target)
      )
        return;
      Blockly.Events.setGroup(true);
      try {
        block.unplug(true);
        target.nextConnection.connect(block.previousConnection);
      } finally {
        Blockly.Events.setGroup(false);
      }
      Blockly.getFocusManager().focusNode(block);
    },
    disconnect(id: string) {
      const block = workspace.getBlockById(id);
      if (!block?.getParent()) return;
      Blockly.Events.setGroup(true);
      pendingDisconnect = {
        group: Blockly.Events.getGroup(),
        message: `Bloco desconectado. ${describeBlock(readBlock(block))}`,
      };
      try {
        block.unplug(true);
        block.moveBy(40, 40);
      } finally {
        Blockly.Events.setGroup(false);
      }
      Blockly.getFocusManager().focusNode(block);
    },
    dispose() {
      cancelAnimationFrame(autoDropFrame);
      container.removeEventListener('pointerdown', captureDropAnchor, true);
      clearPointer();
      Blockly.Tooltip.hide();
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(moveFrame);
      pendingMoveAnnouncement = null;
      observer.disconnect();
      cancelAnimationFrame(focusFrame);
      container.removeEventListener('pointerover', onPointerOver, true);
      container.removeEventListener('pointermove', onPointerOver, true);
      container.removeEventListener('pointerout', onPointerOut, true);
      container.removeEventListener('keydown', preserveDropFocus, true);
      workspace.removeChangeListener(onChange);
      workspace.dispose();
    },
  };
}
