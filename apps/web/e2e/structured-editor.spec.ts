import { expect, test } from '@playwright/test';
import { buildMovementProgram, insertFromPalette } from './editor-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('constrói e executa pela paleta sem os painéis removidos', async ({
  page,
}) => {
  await expect(page.locator('.block-actions, .program-summary')).toHaveCount(0);
  await buildMovementProgram(page);
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento/ }),
  ).toHaveAttribute('aria-label', /Conectado/);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('img', { name: /posição x 10, y 0/ }),
  ).toBeVisible();
});

test('desconecta pela barra e exclui por teclado mantendo o evento', async ({
  page,
}) => {
  await buildMovementProgram(page);
  const movement = page.getByRole('figure', { name: /^Bloco de movimento/ });
  await expect(movement).toHaveAttribute('aria-label', /Conectado/);
  const disconnect = page.getByRole('button', {
    name: 'Desconectar bloco',
    exact: true,
  });
  await expect(disconnect).toBeEnabled();
  await disconnect.press('Enter');
  await expect(movement).toHaveAttribute('aria-label', /Fora de uma sequência/);
  await page.keyboard.press('Delete');
  await expect(movement).toHaveCount(0);
  await expect(
    page.getByRole('figure', { name: /^Bloco de evento/ }),
  ).toHaveCount(1);
});

test('condicional sem operador continua apresentando diagnóstico acessível', async ({
  page,
}) => {
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Controle', 3);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('Encaixe um operador');
});

test('arrasta da paleta e move sequência preservando relações', async ({
  page,
}) => {
  await buildMovementProgram(page);
  const start = page.getByRole('figure', { name: /^Bloco de evento/ });
  const box = (await start.boundingBox())!;
  await page.mouse.move(box.x + 35, box.y + 18);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 60, { steps: 12 });
  await page.mouse.up();
  await expect(start).toHaveAttribute(
    'aria-label',
    /Antes de Bloco de movimento/,
  );
  expect((await start.boundingBox())!.x).not.toBe(box.x);
  const option = page.getByRole('option', {
    name: /^Bloco de movimento: mover/,
  });
  const block = (await option.boundingBox())!;
  const host = (await page.getByTestId('editor-host').boundingBox())!;
  await page.mouse.move(block.x + 25, block.y + 15);
  await page.mouse.down();
  await page.mouse.move(host.x + host.width - 100, host.y + 80, { steps: 15 });
  await page.mouse.up();
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveCount(2);
});
