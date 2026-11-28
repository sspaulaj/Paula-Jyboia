import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

for (const activation of ['click', 'Enter', 'Space']) {
  test(`personagem executa seu evento por ${activation}, sem disparar ao iniciar`, async ({
    page,
  }) => {
    await page.goto('/scratch');
    await insertFromPalette(page, 'Eventos', 1);
    await insertFromPalette(page, 'Movimento');
    const actor = page.getByRole('button', {
      name: 'Personagem Jyboia',
      exact: true,
    });
    await expect(
      page.getByRole('region', { name: 'Palco', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Iniciar programa', exact: true })
      .press('Enter');
    await expect(page.getByTestId('editor-announcements')).toContainText(
      'Adicione um bloco Quando iniciar',
    );
    await expect(actor).toHaveAttribute('data-x', '0');
    if (activation === 'click') await actor.click();
    else await actor.press(activation);
    await expect(actor).toHaveAttribute('data-x', '10');
    await expect(actor).toHaveAttribute('aria-disabled', 'false');
    await actor.press('Enter');
    await expect(actor).toHaveAttribute('data-x', '20');
  });
}

test('clique no fundo não executa; Parar interrompe o evento do personagem', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos', 1);
  await insertFromPalette(page, 'Controle', 2);
  const actor = page.getByRole('button', {
    name: 'Personagem Jyboia',
    exact: true,
  });
  await page.locator('.stage__canvas').click({ position: { x: 10, y: 10 } });
  await expect(actor).toHaveAttribute('data-state', 'idle');
  await actor.click();
  await expect(actor).toHaveAttribute('aria-disabled', 'true');
  await page
    .getByRole('button', { name: 'Parar programa', exact: true })
    .press('Enter');
  await expect(actor).toHaveAttribute('data-state', 'stopped');
  await expect(actor).toHaveAttribute('aria-disabled', 'false');
});
