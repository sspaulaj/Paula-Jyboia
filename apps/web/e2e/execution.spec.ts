import { expect, test, type Page } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

test('girar e mover dez passos avança em X sem alterar Y', async ({ page }) => {
  await page.goto('/');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Movimento', 1);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('90');
  await page.keyboard.press('Enter');
  await expect(page.locator('input.blocklyHtmlInput')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await insertFromPalette(page, 'Movimento');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Depois de Bloco de movimento: girar 90/);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('img', { name: /posição x 10, y 0; direção 270 graus/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('mover 10 passos');
});

async function insertBlock(page: Page, category: string) {
  await page
    .locator('.category-panel')
    .getByRole('button', { name: category, exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
}

test('cada início mantém a posição atual e move mais dez passos', async ({
  page,
}) => {
  await page.goto('/');
  await insertBlock(page, 'Eventos');
  await insertBlock(page, 'Movimento');
  const move = page.getByRole('figure', { name: /^Bloco de movimento: mover/ });
  await expect(move).toHaveAttribute('aria-label', /Conectado/i);
  const character = page.locator('.stage__character');
  const before = (await character.boundingBox())!;
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.click();
  await expect(
    page.getByRole('img', { name: /Personagem Jyboia: posição x 10, y 0/ }),
  ).toBeVisible();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  expect((await character.boundingBox())!.x).toBeGreaterThan(before.x);
  await start.click();
  await expect(
    page.getByRole('img', { name: /posição x 20, y 0/ }),
  ).toBeVisible();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  // Parar antes do próximo movimento também preserva a posição já alcançada.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await start.click();
  await page
    .getByRole('button', { name: 'Parar programa', exact: true })
    .click();
  await page.clock.runFor(1000);
  await expect(
    page.getByRole('img', { name: /posição x 20, y 0/ }),
  ).toBeVisible();
  await start.click();
  await page.clock.runFor(1000);
  await expect(
    page.getByRole('img', { name: /posição x 30, y 0/ }),
  ).toBeVisible();
});

test('parar cancela comandos pendentes e programa vazio informa o erro', async ({
  page,
}) => {
  await page.goto('/');
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('Não foi possível iniciar.');
  await insertBlock(page, 'Eventos');
  await insertBlock(page, 'Movimento');
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await start.click();
  await page
    .getByRole('button', { name: 'Parar programa', exact: true })
    .click();
  await page.clock.runFor(1000);
  await expect(
    page.getByRole('img', { name: /posição x 0, y 0/ }),
  ).toBeVisible();
  await expect(start).toBeEnabled();
});
