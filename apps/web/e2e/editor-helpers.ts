import type { Page } from '@playwright/test';

export async function insertFromPalette(
  page: Page,
  category: string,
  index = 0,
) {
  await page
    .locator('.category-panel')
    .getByRole('button', { name: category, exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
}

export async function buildMovementProgram(page: Page) {
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Movimento');
}
