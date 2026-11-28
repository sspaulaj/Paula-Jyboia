import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

for (const location of ['palette', 'editor'] as const) {
  test(`campos da fala orientam no hover sem repetir ou mover foco: ${location}`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto('/scratch');
    await insertFromPalette(page, 'Aparência', 3);
    const start = page.getByRole('button', {
      name: 'Iniciar programa',
      exact: true,
    });
    await start.focus();
    const block = page.getByRole(location === 'palette' ? 'option' : 'figure', {
      name: /^Bloco de aparência: dizer Olá por 2 segundos/,
    });
    const fields = block.locator('..').locator('.blocklyFieldRect');
    const status = page.getByTestId('editor-announcements');
    await fields.nth(1).hover();
    await expect(status).toHaveText(
      'Inserir quantidade de segundos. Valor atual: 2.',
    );
    const announcement = await status.locator('span').elementHandle();
    await page.clock.runFor(10000);
    expect(await announcement!.evaluate((node) => node.isConnected)).toBe(true);
    const box = (await fields.nth(1).boundingBox())!;
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.clock.runFor(1000);
    expect(await announcement!.evaluate((node) => node.isConnected)).toBe(true);
    await fields.first().hover();
    await expect(status).toHaveText('Inserir texto da fala. Valor atual: Olá.');
    await fields.nth(1).hover();
    await expect(status).toHaveText(
      'Inserir quantidade de segundos. Valor atual: 2.',
    );
    expect(await announcement!.evaluate((node) => node.isConnected)).toBe(
      false,
    );
    await expect(start).toBeFocused();
  });
}

test('repetição orienta por teclado e hover reflete o valor editado', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Controle', 1);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAccessibleName(
    /Inserir quantidade de vezes/,
  );
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('5');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  const block = page.getByRole('figure', {
    name: /^Bloco de controle: repetir 5 vezes/,
  });
  await expect(block).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .hover();
  await block.locator('..').locator('.blocklyFieldRect').first().hover();
  await expect(page.getByTestId('editor-announcements')).toHaveText(
    'Inserir quantidade de vezes. Valor atual: 5.',
  );
});
