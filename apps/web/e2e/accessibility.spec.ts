import { expect, test } from '@playwright/test';
import { buildMovementProgram, insertFromPalette } from './editor-helpers';

test('edita repetição e operador por teclado, atualiza nomes e exclui sem mouse', async ({
  page,
}) => {
  await page.goto('/');
  await insertFromPalette(page, 'Controle', 1);
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /repetir/);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('role', 'button');
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('5');
  await page.keyboard.press('Enter');
  await expect(page.locator('input.blocklyHtmlInput')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /repetir 5 vezes/,
  );
  await insertFromPalette(page, 'Operadores');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /maior que/,
  );
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('role', 'button');
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('pontos');
  await page.keyboard.press('Enter');
  await expect(page.locator('input.blocklyHtmlInput')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /^Bloco operador: pontos maior que 0/,
  );
  await expect(
    page.getByRole('figure', { name: /^Bloco operador: pontos maior que 0/ }),
  ).toHaveCount(1);
  await page.keyboard.press('Delete');
  await expect(
    page.getByRole('figure', { name: /^Bloco operador:/ }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId('editor-announcements'),
  ).toContainText('Bloco excluído');
});

test('anúncio inicial persiste, foco acompanha a leitura e resultado é consultável sem anúncios por quadro', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await buildMovementProgram(page);
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  const status = page.getByTestId('editor-announcements');
  await start.press('Enter');
  const sequence = page.locator('#execution-sequence');
  await expect(sequence).toBeFocused();
  await expect(sequence).toHaveText(
    'Quando iniciar programa. Mover 10 passos.',
  );
  await expect(status).toBeEmpty();
  const initial = await sequence.textContent();
  await expect(start).toHaveAttribute('aria-disabled', 'false');
  await expect(sequence).toBeFocused();
  await expect(sequence).toHaveText(initial!);
  await expect(page.locator('.stage [aria-live]')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: /avançou 10 passos/ }),
  ).toBeVisible();
  await expect(page.locator('.program-summary')).toHaveCount(0);

  await start.press('Enter');
  await expect(sequence).toBeFocused();
  const stop = page.getByRole('button', {
    name: 'Parar programa',
    exact: true,
  });
  await stop.press('Enter');
  await expect(stop).toBeFocused();
  await expect(status).toHaveText('Programa parado.');
  expect(errors).toEqual([]);
});

test('ponteiro lê o bloco conectado sem mover foco nem repetir ao cruzar seu texto', async ({
  page,
}) => {
  await page.goto('/');
  await buildMovementProgram(page);
  const start = page.getByRole('button', {
    name: 'Iniciar programa',
    exact: true,
  });
  await start.focus();
  const inner = page.getByRole('figure', {
    name: /^Bloco de movimento: mover 10 passos/,
  });
  await inner.locator('..').locator('text').first().hover();
  const status = page.getByTestId('editor-announcements');
  await expect(status).toContainText('Conectado.');
  await expect(start).toBeFocused();
  const text = await status.textContent();
  await inner.locator('..').locator('text').last().hover();
  await expect(status).toHaveText(text!);
  await expect(
    page.getByRole('figure', { name: /^Bloco de evento:/ }),
  ).toHaveCount(1);
});
