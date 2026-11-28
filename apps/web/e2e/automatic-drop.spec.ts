import { expect, test, type Page } from '@playwright/test';
import { insertFromPalette } from './editor-helpers';

async function dropMovement(page: Page) {
  await page
    .getByRole('button', { name: 'Escolher blocos de movimento', exact: true })
    .click();
  const source = (await page
    .getByRole('option', { name: /^Bloco de movimento: mover/ })
    .boundingBox())!;
  const host = (await page.getByTestId('editor-host').boundingBox())!;
  await page.mouse.move(source.x + 30, source.y + 15);
  await page.mouse.down();
  await page.mouse.move(host.x + host.width - 80, host.y + host.height - 120, {
    steps: 15,
  });
  await page.mouse.up();
}

test('botão leva aos tipos; setas e Enter abrem a lista e permitem inserir', async ({
  page,
}) => {
  await page.goto('/scratch');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('button', {
      name: 'Escolher blocos de movimento',
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('button', {
      name: 'Escolher blocos de aparência',
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  const list = page.getByRole('listbox', {
    name: 'Lista de blocos',
    exact: true,
  });
  await expect(list.getByRole('option').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(list.getByRole('option').nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('figure', { name: /^Bloco de aparência: mostrar/ }),
  ).toBeVisible();
});

test('soltar longe dos encaixes adiciona comandos em sequência e executa', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await dropMovement(page);
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Conectado/);
  await dropMovement(page);
  const movements = page.getByRole('figure', {
    name: /^Bloco de movimento: mover/,
  });
  await expect(movements).toHaveCount(2);
  await expect(movements.nth(1)).toHaveAttribute('aria-label', /Conectado/);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .click();
  await expect(page.locator('.stage__character[data-x="20"]')).toBeVisible();
});

test('repetição selecionada recebe o comando no corpo mesmo ao soltar longe', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Controle', 1);
  await dropMovement(page);
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Dentro de Bloco de controle: repetir/);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .click();
  await expect(page.locator('.stage__character[data-x="30"]')).toBeVisible();
});

test('cancelar o arraste não conecta e eventos continuam iniciando sequências próprias', async ({
  page,
}) => {
  await page.goto('/scratch');
  await insertFromPalette(page, 'Eventos');
  await insertFromPalette(page, 'Eventos');
  const events = page.getByRole('figure', { name: /^Bloco de evento/ });
  await expect(events).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Escolher blocos de movimento', exact: true })
    .click();
  const source = (await page
    .getByRole('option', { name: /^Bloco de movimento: mover/ })
    .boundingBox())!;
  const host = (await page.getByTestId('editor-host').boundingBox())!;
  await page.mouse.move(source.x + 30, source.y + 15);
  await page.mouse.down();
  await page.mouse.move(host.x + host.width - 80, host.y + 200, { steps: 10 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(events.nth(0)).not.toHaveAttribute(
    'aria-label',
    /Antes de Bloco de movimento/,
  );
  await expect(events.nth(1)).not.toHaveAttribute(
    'aria-label',
    /Antes de Bloco de movimento/,
  );
});
