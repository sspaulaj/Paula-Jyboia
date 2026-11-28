import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

test('insere os novos movimentos pelo teclado e executa no palco', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Movimento', 3);
  await insertFromPalette(page, 'Movimento', 4);
  await insertFromPalette(page, 'Movimento', 5);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(page.locator('.stage__character')).toHaveAttribute(
    'data-x',
    '10',
  );
  await expect(page.locator('.stage__character')).toHaveAttribute(
    'data-y',
    '10',
  );
});

test('fala temporizada e condicional duplo estão acessíveis pela paleta', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Aparência', 3);
  await expect(
    page.getByRole('figure', {
      name: /^Bloco de aparência: dizer Olá por 2 segundos/,
    }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(page.locator('.stage__speech')).toContainText('Olá');
  await expect(page.locator('.stage__speech')).toHaveCount(0, {
    timeout: 6000,
  });
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  await insertFromPalette(page, 'Controle', 4);
  await expect(
    page.getByRole('figure', {
      name: /^Bloco de controle: se condição, então, senão/,
    }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(page.getByTestId('editor-announcements')).toContainText(
    'Encaixe um operador',
  );
});
