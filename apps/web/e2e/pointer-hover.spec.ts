import { expect, test } from '@playwright/test';
import { buildMovementProgram } from './editor-helpers';

for (const location of ['editor', 'palette'] as const) {
  test(`uma leitura por entrada, sem loop parado no ${location}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto('/');
    await buildMovementProgram(page);
    const start = page.getByRole('button', {
      name: 'Iniciar programa',
      exact: true,
    });
    await start.focus();
    const block = page.getByRole(location === 'editor' ? 'figure' : 'option', {
      name: /^Bloco de movimento: mover 10 passos/,
    });
    if (location === 'editor')
      await expect(block).toHaveAttribute('aria-label', /Conectado/);
    const text = block.locator('..').locator('text').first();
    const box = (await text.boundingBox())!;
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(point.x, point.y);
    const status = page.getByTestId('editor-announcements');
    await expect(status).toHaveText(
      location === 'palette'
        ? 'Bloco de movimento: mover 10 passos. Na paleta. Enter para inserir.'
        : 'Bloco de movimento: mover 10 passos. Conectado. Posição 2 de 2 na sequência de início. Depois de Bloco de evento: quando iniciar.',
    );
    const first = await status.locator('span').elementHandle();
    await page.clock.runFor(10000);
    // Boundary events from rendering at unchanged coordinates must not re-read.
    for (let i = 0; i < 3; i++) {
      await text.dispatchEvent('pointerout', {
        clientX: point.x,
        clientY: point.y,
        relatedTarget: null,
      });
      await text.dispatchEvent('pointerover', {
        clientX: point.x,
        clientY: point.y,
        relatedTarget: null,
      });
      await page.clock.runFor(1000);
    }
    await expect
      .poll(() => first!.evaluate((element) => element.isConnected))
      .toBe(true);
    await block.locator('..').locator('text').last().hover();
    await page.clock.runFor(1000);
    await expect
      .poll(() => first!.evaluate((element) => element.isConnected))
      .toBe(true);
    await expect(start).toBeFocused();
    await start.hover();
    await expect(page.locator('.jyboia-pointer-block')).toHaveCount(0);
    await text.hover();
    await page.clock.runFor(400);
    await expect
      .poll(() => first!.evaluate((element) => element.isConnected))
      .toBe(false);
    await expect(status).toContainText('Bloco de movimento: mover 10 passos');
    await expect(start).toBeFocused();
    expect(errors).toEqual([]);
  });
}
