import * as Blockly from 'blockly/core';

/** Uses the actual Blockly preview: speech never invents a different snap target. */
export function createDragPreviewer(
  container: HTMLElement,
  announce: (message: string, newPointerEntry?: boolean) => void,
  onDrop: (id: string) => void,
) {
  return class AccessiblePreviewer extends Blockly.InsertionMarkerPreviewer {
    private candidate = '';
    private previous = '';
    private timer: ReturnType<typeof setTimeout> | undefined;
    private point: { x: number; y: number } | null = null;
    private ended = false;
    private releasedInside = false;
    private blockId: string;

    constructor(block: Blockly.BlockSvg) {
      super(block);
      this.blockId = block.id;
      document.addEventListener('pointermove', this.move, true);
      document.addEventListener('pointerup', this.release, true);
    }

    private release = (event: PointerEvent) => {
      this.point = { x: event.clientX, y: event.clientY };
      this.releasedInside =
        this.inside(container) &&
        !this.inside(container.querySelector('.blocklyFlyout'));
    };

    private move = (event: PointerEvent) => {
      this.point = { x: event.clientX, y: event.clientY };
      this.schedule();
    };

    private inside(element: Element | null) {
      if (!element || !this.point) return false;
      const rect = element.getBoundingClientRect();
      return (
        this.point.x >= rect.left &&
        this.point.x <= rect.right &&
        this.point.y >= rect.top &&
        this.point.y <= rect.bottom
      );
    }

    private schedule() {
      if (this.ended || this.timer !== undefined) return;
      this.timer = setTimeout(() => {
        this.timer = undefined;
        if (this.ended) return;
        const page = container.closest('.editor-page');
        let message: string;
        if (this.inside(container.querySelector('.blocklyFlyout'))) {
          message = 'Paleta de blocos. Leve o bloco para a área de edição.';
        } else if (this.point && !this.inside(container)) {
          message = this.inside(
            page?.querySelector('.editor-page__right') ?? null,
          )
            ? 'Área do palco. Volte para a área de edição para encaixar o bloco.'
            : this.inside(page?.querySelector('.category-panel') ?? null)
              ? 'Categorias de blocos. Volte para a área de edição.'
              : 'Fora da área de edição. Volte para encaixar o bloco.';
        } else {
          message =
            this.candidate ||
            'Área de edição. Solte para adicionar à sequência, se houver um encaixe compatível.';
        }
        if (message !== this.previous) {
          this.previous = message;
          announce(message, true);
        }
      }, 80);
    }

    private describe(
      target: Blockly.RenderedConnection,
      replaced?: Blockly.BlockSvg,
    ) {
      const block = target.getSourceBlock();
      const name = block.toString(100, '').trim();
      const body = block.getInput('BODY')?.connection === target;
      const condition = block.getInput('CONDITION')?.connection === target;
      const position = body
        ? `dentro de ${name}`
        : block.getInput('ELSE')?.connection === target
          ? `no senão de ${name}`
          : condition
            ? `na condição de ${name}`
            : block.nextConnection === target
              ? `depois de ${name}`
              : `antes de ${name}`;
      this.candidate = `Área de edição. Encaixe ${position}. Solte para conectar.${replaced ? ` O bloco ${replaced.toString()} ficará desconectado.` : ''}`;
      this.schedule();
    }

    override previewConnection(
      dragged: Blockly.RenderedConnection,
      target: Blockly.RenderedConnection,
    ) {
      super.previewConnection(dragged, target);
      this.describe(target);
    }

    override previewReplacement(
      dragged: Blockly.RenderedConnection,
      target: Blockly.RenderedConnection,
      replaced: Blockly.BlockSvg,
    ) {
      super.previewReplacement(dragged, target, replaced);
      this.describe(target, replaced);
    }

    override hidePreview() {
      super.hidePreview();
      this.candidate = '';
      this.schedule();
    }

    override dispose() {
      this.ended = true;
      clearTimeout(this.timer);
      document.removeEventListener('pointermove', this.move, true);
      document.removeEventListener('pointerup', this.release, true);
      super.dispose();
      if (this.releasedInside) onDrop(this.blockId);
    }
  };
}
