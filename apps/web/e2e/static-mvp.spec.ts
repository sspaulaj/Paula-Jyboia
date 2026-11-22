import { expect, test } from '@playwright/test';
import { buildMovementProgram } from './editor-helpers';

for (const path of ['/scratch', '/python']) {
  test(`acesso direto e recarga em ${path} no build estático`, async ({
    page,
  }) => {
    const dynamicRequests: string[] = [];
    page.on('request', (request) => {
      if (['fetch', 'xhr', 'websocket'].includes(request.resourceType()))
        dynamicRequests.push(request.url());
    });
    await page.goto(path);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (path === '/scratch') {
        await expect(page.getByTestId('editor-host')).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Iniciar programa', exact: true }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('heading', { name: 'Python por blocos' }),
        ).toBeVisible();
        await expect(page.getByTestId('editor-host')).toHaveCount(0);
      }
      if (attempt === 0) await page.reload();
    }
    expect(dynamicRequests).toEqual([]);
  });
}

test('build estático abre, constrói e executa sem API ou armazenamento de programas', async ({
  page,
}) => {
  const errors: string[] = [];
  const dynamicRequests: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://localhost:4175')
      externalRequests.push(request.url());
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType()))
      dynamicRequests.push(request.url());
  });
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== 'http://localhost:4175' ||
      url.pathname.startsWith('/api') ||
      url.pathname === '/health'
    )
      return route.abort();
    return route.continue();
  });
  // Qualquer tentativa de persistir dados pela aplicação deve falhar neste teste.
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Gravação de Storage proibida no MVP');
    };
    IDBFactory.prototype.open = () => {
      throw new Error('IndexedDB proibido no MVP');
    };
  });
  await page.goto('/');
  await expect(page.locator('summary')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Programa e resultado' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Organizar blocos sem arrastar' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('complementary', { name: 'Sobre seu trabalho' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: /Salvar projeto|Abrir projeto|Excluir projeto|Entrar com|Cadastrar/,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: /Adicionar bloco|Conectar sequência|Anunciar estado e resultado/,
    }),
  ).toHaveCount(0);
  await buildMovementProgram(page);
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 10 passos/ }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .press('Enter');
  await expect(page.locator('#execution-sequence')).toHaveText(
    'Quando iniciar programa. Mover 10 passos.',
  );
  await expect(
    page.locator('.stage__character[data-x="10"][data-y="0"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('figure', { name: /^Bloco de/ })).toHaveCount(0);
  expect(dynamicRequests).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});
