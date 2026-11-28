import { expect, test } from '@playwright/test';
import { buildMovementProgram, insertFromPalette } from './editor-helpers';

test('hover de categoria volta a anunciar após terminar a execução', async ({
  page,
}) => {
  await page.goto('/scratch');
  await buildMovementProgram(page);
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.click();
  await expect(page.locator('.stage__character[data-x="10"]')).toBeVisible();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  await page.getByRole('link', { name: 'Python', exact: true }).hover();
  await page
    .getByRole('button', { name: 'Escolher blocos de aparência', exact: true })
    .hover();
  await expect(page.getByTestId('editor-announcements')).toHaveText(
    'Escolher blocos de aparência.',
  );
});

test('repetição diferencia encaixe interno e continuação externa', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Controle', 1);
  await page
    .getByRole('button', { name: 'Escolher blocos de movimento', exact: true })
    .click();
  const source = (await page
    .getByRole('option', { name: /^Bloco de movimento: mover/ })
    .boundingBox())!;
  const repeat = page.getByRole('figure', {
    name: /^Bloco de controle: repetir/,
  });
  const box = (await repeat.boundingBox())!;
  const status = page.getByTestId('editor-announcements');
  await page.mouse.move(source.x + 30, source.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y + box.height + 10, { steps: 12 });
  await expect(status).toContainText('Encaixe depois de');
  // Read real connection coordinates rather than guessing the renderer's
  // internal indentation. Only the mouse performs the connection.
  const delta = await page.evaluate(async () => {
    const url = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => /\/blockly_core\.js/.test(name));
    if (!url) throw new Error('Blockly module was not loaded');
    const imported = (await import(url)) as typeof import('blockly/core') & {
      default?: typeof import('blockly/core');
    };
    const Blockly = imported.default ?? imported;
    const workspace =
      Blockly.getMainWorkspace() as import('blockly/core').WorkspaceSvg;
    const blocks = workspace.getAllBlocks(false);
    const body = blocks
      .find((block) => block.type === 'jyboia_repeat')!
      .getInput('BODY')!.connection!;
    const moving = blocks.find(
      (block) => block.type === 'jyboia_move' && !block.isInsertionMarker(),
    )!.previousConnection!;
    if (!(body instanceof Blockly.RenderedConnection))
      throw new Error('The loop body must have a rendered connection');
    const screenPoint = (
      connection: import('blockly/core').RenderedConnection,
    ) => {
      const offset = connection.getOffsetInBlock();
      return new DOMPoint(offset.x, offset.y).matrixTransform(
        connection.getSourceBlock().getSvgRoot().getScreenCTM()!,
      );
    };
    const to = screenPoint(body);
    const from = screenPoint(moving);
    return { x: to.x - from.x, y: to.y - from.y };
  });
  await page.mouse.move(
    box.x + 30 + delta.x,
    box.y + box.height + 10 + delta.y,
    { steps: 10 },
  );
  await expect(status).toContainText('Encaixe dentro de');
  await page.mouse.up();
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Dentro/);
});

test('categorias anunciam pela área inteira sem clique ou repetição nos filhos', async ({
  page,
}) => {
  await page.goto('/scratch');
  const button = page.getByRole('button', {
    name: 'Escolher blocos de aparência',
    exact: true,
  });
  await expect(button).toBeVisible();
  const box = (await button.boundingBox())!;
  const status = page.getByTestId('editor-announcements');
  await page.mouse.move(box.x + box.width - 5, box.y + 5);
  await expect(status).toHaveText('Escolher blocos de aparência.');
  const first = await status.locator('span').elementHandle();
  await button.locator('.category-panel__label').hover();
  expect(await first!.evaluate((node) => node.isConnected)).toBe(true);
  await page.getByRole('link', { name: 'Python', exact: true }).hover();
  await button.locator('.category-panel__label').hover();
  await expect
    .poll(() => first!.evaluate((node) => node.isConnected))
    .toBe(false);
});

test('paleta anuncia blocos por hover antes de selecionar ou inserir', async ({
  page,
}) => {
  await page.goto('/scratch');
  const block = page.getByRole('option', {
    name: /^Bloco de movimento: mover/,
  });
  await expect(block).toBeVisible();
  const box = (await block.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await expect(page.getByTestId('editor-announcements')).toContainText(
    'Bloco de movimento: mover 10 passos. Na paleta',
  );
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento/ }),
  ).toHaveCount(0);
});

test('arraste anuncia área e encaixe sequencial antes de soltar', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await page
    .getByRole('button', { name: 'Escolher blocos de movimento', exact: true })
    .click();
  const source = (await page
    .getByRole('option', { name: /^Bloco de movimento: mover/ })
    .boundingBox())!;
  const event = (await page
    .getByRole('figure', { name: /^Bloco de evento/ })
    .boundingBox())!;
  const host = (await page.getByTestId('editor-host').boundingBox())!;
  const status = page.getByTestId('editor-announcements');
  await page.mouse.move(source.x + 30, source.y + 15);
  await page.mouse.down();
  await page.mouse.move(host.x + host.width - 80, host.y + 200, { steps: 12 });
  await expect(status).toContainText('Área de edição. Solte para adicionar à sequência');
  const stage = (await page.locator('.editor-page__right').boundingBox())!;
  await page.mouse.move(stage.x + 60, stage.y + 100, { steps: 10 });
  await expect(status).toContainText('Área do palco');
  await page.mouse.move(event.x + 30, event.y + event.height + 10, {
    steps: 12,
  });
  await expect(status).toContainText('Encaixe depois de');
  await page.mouse.up();
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Conectado/);
});
