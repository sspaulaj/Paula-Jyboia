import { expect, test } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

for (const [module, method] of [
  ['experiment/blockly-adapter.ts', 'prepareExecution'],
  ['editor/announcements.ts', 'beginSequence'],
] as const) {
  test(`executa com instância anterior à atualização de ${method}`, async ({
    page,
  }) => {
    // Fast Refresh can retain the mounted workspace and useState controller.
    // Serve the real module without the new method to reproduce that contract.
    let servedPreviousContract = false;
    await page.route(`**/src/${module}`, async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      const previous = source.replace(`${method}()`, `previous${method}()`);
      servedPreviousContract = previous !== source;
      await route.fulfill({ response, body: previous });
    });
    await page.goto('/');
    await insertFromPalette(page, 'Eventos');
    await insertFromPalette(page, 'Aparência');
    expect(servedPreviousContract).toBe(true);
    const start = page.getByRole('button', {
      name: 'Iniciar programa',
      exact: true,
    });
    await start.click();
    await expect(page.locator('.stage__speech')).toHaveText('Olá');
    await expect(page.locator('#execution-sequence')).toHaveText(
      'Quando iniciar programa. Diga Olá.',
    );
    await expect(start).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByRole('figure', { name: /^Bloco de/ })).toHaveCount(
      2,
    );
    await expect(
      page.getByTestId('editor-announcements'),
    ).not.toContainText('Não foi possível iniciar');
  });
}
