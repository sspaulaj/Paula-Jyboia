import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

test('Scratch explícito preserva execução, descrições e reinício na posição atual', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Movimento');
  await insertFromPalette(page, 'Aparência');
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.click();
  await expect(page.locator('.stage__speech')).toHaveText('Olá');
  await expect(page.locator('#execution-sequence')).toHaveText(
    'Quando iniciar programa. Mover 10 passos. Diga Olá.',
  );
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  const stage = page.locator('[data-x]');
  const x = Number(await stage.getAttribute('data-x'));
  await start.press('Enter');
  await expect(stage).toHaveAttribute('data-x', String(x + 10));
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 10 passos/ }),
  ).toHaveCount(1);
});

test('Python é independente e oferece retorno por teclado ao Scratch', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/python');
  await expect(
    page.getByRole('heading', { name: 'Python por blocos' }),
  ).toBeVisible();
  await expect(page.getByLabel('Exemplo de programa')).toBeVisible();
  await expect(page.getByTestId('editor-host')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Iniciar programa' }),
  ).toBeVisible();
  expect(
    requests.some((url) =>
      /\/modules\/scratch\/|pyodide|\/api\/projects/.test(url),
    ),
  ).toBe(false);
  await page.getByRole('link', { name: 'Abrir editor Scratch' }).focus();
  await expect(
    page.getByRole('link', { name: 'Abrir editor Scratch' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/scratch$/);
  await expect(page.getByTestId('editor-host')).toBeVisible();
});
