import { expect, test } from '@playwright/test';

for (const width of [1440, 900, 600]) {
  test(`categorias filtram a paleta sem sobreposição em ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const categories = page.locator('.category-panel');
    const host = page.getByTestId('editor-host');
    for (const [label, names] of [
      ['Movimento', ['mover 10 passos', 'girar 15 graus', 'ir para x 0, y 0']],
      ['Aparência', ['dizer Olá', 'mostrar personagem', 'esconder personagem']],
      ['Eventos', ['quando iniciar']],
    ] as const) {
      const button = categories.getByRole('button', {
        name: `Escolher blocos de ${label.toLocaleLowerCase('pt-BR')}`,
        exact: true,
      });
      await button.click();
      await expect(button).toHaveAttribute('aria-current', 'true');
      await expect(button).not.toHaveAttribute('aria-pressed');
      const options = host.getByRole('option');
      await expect(options).toHaveCount(names.length);
      for (let index = 0; index < names.length; index++) {
        await expect(options.nth(index)).toHaveAttribute(
          'aria-label',
          new RegExp(names[index]!),
        );
      }
      const categoryBox = (await categories.boundingBox())!;
      const hostBox = (await host.boundingBox())!;
      const blockBox = (await options.first().boundingBox())!;
      expect(hostBox.width).toBeGreaterThan(0);
      expect(hostBox.height).toBeGreaterThan(0);
      expect(blockBox.x).toBeGreaterThanOrEqual(hostBox.x);
      expect(blockBox.x + blockBox.width).toBeLessThanOrEqual(
        hostBox.x + hostBox.width,
      );
      if (width > 720) {
        expect(blockBox.x).toBeGreaterThanOrEqual(
          categoryBox.x + categoryBox.width,
        );
      } else {
        expect(blockBox.y).toBeGreaterThanOrEqual(
          categoryBox.y + categoryBox.height,
        );
      }
      const rightBox = (await page
        .locator('.editor-page__right')
        .boundingBox())!;
      if (width > 720)
        expect(hostBox.x + hostBox.width).toBeLessThanOrEqual(rightBox.x + 1);
    }
    await categories
      .getByRole('button', { name: 'Escolher blocos de controle', exact: true })
      .click();
    await expect(page.getByRole('option', { name: /^Bloco de/ })).toHaveCount(
      4,
    );
    await expect(
      page.getByTestId('editor-announcements'),
    ).toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test('trocar categoria preserva os blocos inseridos e permite escolher com teclado', async ({
  page,
}) => {
  await page.goto('/');
  const events = page
    .locator('.category-panel')
    .getByRole('button', { name: 'Escolher blocos de eventos', exact: true });
  await events.focus();
  await events.press('Enter');
  await expect(events).toBeFocused();
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /quando iniciar/,
  );
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('figure', { name: /^Bloco de evento/ }),
  ).toHaveCount(1);
  await page
    .locator('.category-panel')
    .getByRole('button', { name: 'Escolher blocos de movimento', exact: true })
    .click();
  await expect(page.getByTestId('editor-host').getByRole('option')).toHaveCount(
    3,
  );
  await expect(
    page.getByRole('figure', { name: /^Bloco de evento/ }),
  ).toHaveCount(1);
  await expect(page.locator('.blocklyMainBackground')).toHaveCount(1);
});
