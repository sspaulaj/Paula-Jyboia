import { expect, test } from '@playwright/test';

test('fundo da lista, palco e personagem anunciam suas áreas sem repetir nos filhos', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/scratch');
  const palette = page.locator('svg.blocklyFlyout');
  await expect(palette).toHaveAttribute('aria-label', 'Lista de blocos');
  const box = (await palette.boundingBox())!;
  const status = page.getByTestId('editor-announcements');
  await page.mouse.move(box.x + 8, box.y + box.height - 30);
  await expect(status).toHaveText('Lista de blocos.');
  const first = await status.locator('span').elementHandle();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 45);
  await page.clock.runFor(2000);
  expect(await first!.evaluate((node) => node.isConnected)).toBe(true);
  const stage = page.getByRole('region', { name: 'Palco', exact: true });
  const stageBox = (await stage.boundingBox())!;
  await page.mouse.move(stageBox.x + 8, stageBox.y + 8);
  await expect(status).toHaveText('Palco.');
  await page.locator('.stage__character-img').hover();
  await expect(status).toHaveText('Personagem Jyboia.');
  const second = await status.locator('span').elementHandle();
  await page.clock.runFor(2000);
  expect(await second!.evaluate((node) => node.isConnected)).toBe(true);
  await page.mouse.move(box.x + 8, box.y + box.height - 30);
  await expect(status).toHaveText('Lista de blocos.');
  await page.mouse.move(stageBox.x + 8, stageBox.y + 8);
  await expect(status).toHaveText('Palco.');
});

test('lista de blocos tem nome próprio e não pertence à região do workspace', async ({
  page,
}) => {
  await page.goto('/scratch');
  for (const category of ['movimento', 'aparência']) {
    await page
      .getByRole('button', {
        name: `Escolher blocos de ${category}`,
        exact: true,
      })
      .click();
    const list = page.getByRole('listbox', {
      name: 'Lista de blocos',
      exact: true,
    });
    await expect(list).toBeVisible();
    expect(
      await list.evaluate((node) => {
        let parent = node.parentElement;
        while (parent) {
          if (parent.getAttribute('aria-label')?.startsWith('Editor de blocos'))
            return true;
          parent = parent.parentElement;
        }
        return false;
      }),
    ).toBe(false);
    await page
      .getByRole('button', { name: 'Escolher tipos de blocos', exact: true })
      .press('Enter');
    await expect(
      page.getByRole('button', {
        name: `Escolher blocos de ${category}`,
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list.getByRole('option').first()).toBeFocused();
  }
  await expect(
    page.getByRole('region', { name: 'Editor de blocos.', exact: true }),
  ).toBeVisible();
});
