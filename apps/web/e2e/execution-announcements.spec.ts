import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

for (const withMovement of [false, true]) {
  for (const input of ['mouse', 'keyboard'] as const) {
    test(`sequência e estados sem concorrência no DOM: movimento=${withMovement}, ${input}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      // Install before Blockly schedules hover timers; swapping clocks after
      // hover would leave real timers that fake clearTimeout cannot cancel.
      await page.clock.install();
      const start = page.getByRole('button', {
        name: 'Iniciar programa',
        exact: true,
      });
      const stop = page.getByRole('button', {
        name: 'Parar programa',
        exact: true,
      });
      await expect(stop).toHaveAttribute('aria-disabled', 'true');
      await stop.focus();
      await expect(stop).toBeFocused();
      await stop.press('Enter');
      await expect(start).toHaveAttribute('aria-disabled', 'false');
      await insertFromPalette(page, 'Eventos');
      if (withMovement) await insertFromPalette(page, 'Movimento');
      await insertFromPalette(page, 'Aparência');
      const say = page.getByRole('figure', {
        name: /^Bloco de aparência: dizer Olá/,
      });
      await expect(say).toHaveAttribute('aria-label', /Conectado/);
      await say.locator('..').locator('text').first().hover();
      const status = page.getByTestId('editor-announcements');
      await expect(status).toContainText('dizer Olá');
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      const box = (await start.boundingBox())!;
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await start.evaluate((element) => {
        const changes: string[] = [];
        const observer = new MutationObserver(() => {
          changes.push(
            `${element.getAttribute('aria-disabled')}:${document.activeElement?.id}`,
          );
          element.setAttribute('data-state-focus-history', changes.join('|'));
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['aria-disabled'],
        });
      });
      if (input === 'mouse') await page.mouse.click(point.x, point.y);
      else await start.press('Enter');
      const sequence = page.locator('#execution-sequence');
      const expected = withMovement
        ? 'Quando iniciar programa. Mover 10 passos. Diga Olá.'
        : 'Quando iniciar programa. Diga Olá.';
      await expect(sequence).toBeFocused();
      await expect(sequence).toHaveCSS('clip-path', 'inset(50%)');
      await expect(sequence).toHaveCSS('position', 'absolute');
      await expect(sequence).toHaveCSS('width', '1px');
      await expect(sequence).toHaveCSS('height', '1px');
      await expect(sequence).toHaveAccessibleName(expected);
      await expect(sequence).toHaveText(expected);
      await expect(sequence).not.toHaveAttribute('aria-live');
      await expect(status).toBeEmpty();
      await expect(start).toHaveAttribute('aria-disabled', 'true');
      await expect(stop).toHaveAttribute('aria-disabled', 'false');
      await expect(start).toHaveAttribute(
        'data-state-focus-history',
        'true:execution-sequence',
      );
      // Repeated activation cannot start another run; it must not steal focus.
      await start.dispatchEvent('click');
      await expect(sequence).toBeFocused();
      await page.clock.runFor(2500);
      await expect(start).toHaveAttribute('aria-disabled', 'false');
      await expect(stop).toHaveAttribute('aria-disabled', 'true');
      await expect(sequence).toBeFocused();
      await expect(sequence).toHaveText(expected);
      await expect(status).toBeEmpty();
      await expect(start).toHaveAttribute(
        'data-state-focus-history',
        'true:execution-sequence|false:execution-sequence',
      );
      await expect(page.locator('.stage__speech')).toHaveText('Olá');
      await expect(page.locator('.stage__character')).toHaveAttribute(
        'data-x',
        withMovement ? '10' : '0',
      );
      const stage = page.getByRole('img', { name: /^Personagem Jyboia\./ });
      await expect(stage).not.toHaveAttribute(
        'aria-label',
        /posição x|posição y|coordenadas/i,
      );
      if (withMovement)
        await expect(stage).toHaveAccessibleName(
          /O personagem avançou 10 passos/,
        );
      if (input === 'mouse') {
        expect(
          await page.evaluate(
            ({ x, y }) =>
              document
                .elementFromPoint(x, y)
                ?.closest('button')
                ?.getAttribute('aria-label'),
            point,
          ),
        ).toBe('Iniciar programa');
      }
      // Restart, Tab directly to Stop, and cancel without losing focus.
      await start.press('Enter');
      await expect(sequence).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(stop).toBeFocused();
      await expect(stop).toHaveAttribute('aria-disabled', 'true');
      await expect(start).toHaveAttribute('aria-disabled', 'false');
      await expect(status).toHaveText('Programa parado.');
      expect(errors).toEqual([]);
    });
  }
}

test('validação mantém foco no início e não apresenta sequência executável', async ({
  page,
}) => {
  await page.goto('/');
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.press('Enter');
  await expect(start).toBeFocused();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#execution-sequence')).toHaveCount(0);
  await expect(page.getByTestId('editor-announcements')).toHaveText(
    'Não foi possível iniciar. Adicione um bloco Quando iniciar.',
  );
  await expect(page.locator('.editor-page__right')).not.toContainText(
    'Não foi possível iniciar.',
  );
  // Commands without a start block also announce the warning without a panel.
  await insertFromPalette(page, 'Movimento');
  const previous = await page
    .getByTestId('editor-announcements')
    .locator('span')
    .elementHandle();
  await start.click();
  await expect
    .poll(() => previous!.evaluate((element) => element.isConnected))
    .toBe(false);
  await expect(page.getByTestId('editor-announcements')).toHaveText(
    'Não foi possível iniciar. Adicione um bloco Quando iniciar.',
  );
  await expect(page.locator('.editor-page__right')).not.toContainText(
    'Não foi possível iniciar.',
  );
  await expect(start).toBeFocused();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
});
