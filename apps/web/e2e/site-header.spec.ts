import { expect, test } from '@playwright/test';

test('navegação comum troca os módulos por teclado com a página atual identificada', async ({
  page,
}) => {
  await page.goto('/scratch');
  const header = page.getByRole('banner');
  await expect(header).toHaveCount(1);
  await expect(header.getByText('Jyboia')).toBeVisible();
  await expect(header.getByRole('link', { name: 'Scratch' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await header.getByRole('link', { name: 'Python' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/python$/);
  await expect(page.getByLabel('Exemplo de programa')).toBeVisible();
  await expect(header.getByRole('link', { name: 'Python' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await header.getByRole('link', { name: 'Scratch' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/scratch$/);
  await expect(page.getByTestId('editor-host')).toBeVisible();
  await expect(header.getByRole('link', { name: 'Scratch' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

for (const width of [360, 1440]) {
  test(`faixa visível sem sobrepor o editor em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByTestId('editor-host')).toBeVisible();
    const header = page.getByRole('banner');
    const bounds = await header.boundingBox();
    const controls = await page.locator('.top-bar').boundingBox();
    expect(controls!.y).toBeGreaterThanOrEqual(bounds!.y + bounds!.height);
    for (const name of ['Scratch', 'Python']) {
      const link = header.getByRole('link', { name });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: `test-results/header-${width}.png` });
  });
}
