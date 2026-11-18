import { expect, test } from '@playwright/test';
// Histórico da integração anterior. A interface de persistência não integra o MVP.
test.skip(
  true,
  'Persistência retirada do MVP; reativar somente com escopo autorizado.',
);
import { testDatabase } from '../../api/tests/test-database.js';
import { buildApp } from '../../api/src/app.js';
import { projectExample } from '@jyboia/shared/projects';
let db: Awaited<ReturnType<typeof testDatabase>>;
let app: Awaited<ReturnType<typeof buildApp>>;
test.beforeAll(async () => {
  db = await testDatabase();
  app = await buildApp({
    webOrigin: 'http://localhost:5175',
    database: db.database,
  });
  await app.listen({ port: 3002, host: '127.0.0.1' });
});
test.afterAll(async () => {
  await app?.close();
  await db?.close();
});

test('cria, salva, recupera, executa, atualiza e exclui um projeto estruturado via API real', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Nome do projeto' })
    .fill('Programa completo');
  await page
    .getByRole('button', { name: 'Adicionar exemplo com repetição e condição' })
    .click();
  await expect(
    page.getByText('Alterações não salvas.', { exact: true }),
  ).toBeVisible();
  const created = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/projects') &&
      response.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: 'Salvar projeto', exact: true })
    .press('Enter');
  const response = await created;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  expect(saved.formatVersion).toBe(2);
  expect(saved.workspaceData.program.blocks).toHaveLength(7);
  const status = page.getByRole('status', { name: 'Alterações do programa' });
  await expect(status).toHaveText('Projeto salvo com sucesso.');
  await expect(
    page.getByRole('button', { name: 'Salvar projeto', exact: true }),
  ).toBeFocused();
  await expect(page.getByText('Projeto salvo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await expect(page.getByRole('figure', { name: /^Bloco de/ })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Abrir projeto', exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Abrir Programa completo', exact: true })
    .press('Enter');
  await expect(status).toHaveText('Projeto carregado.');
  await expect(
    page.getByRole('figure', { name: /^Bloco de controle: se 1 maior que 0/ }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('figure', {
      name: /^Bloco de movimento: mover.*Primeiro comando interno/,
    }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .click();
  await expect(
    page.getByRole('img', { name: /posição x 40, y 0.*Olá/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  await page
    .getByRole('textbox', { name: 'Nome do projeto' })
    .fill('Programa atualizado');
  const movement = page.getByRole('figure', {
    name: /^Bloco de movimento: mover 10 passos.*Posição 2 /,
  });
  await movement
    .locator('..')
    .locator(':scope > .blocklyField')
    .filter({ has: page.locator('text', { hasText: /^10$/ }) })
    .click();
  await page.locator('input.blocklyHtmlInput').fill('25');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 25 passos/ }),
  ).toHaveCount(1);
  const updated = page.waitForResponse((r) => r.request().method() === 'PUT');
  await page
    .getByRole('button', { name: 'Salvar projeto', exact: true })
    .click();
  const update = await updated;
  expect(update.status()).toBe(200);
  const body = await update.json();
  expect(body.revision).toBe(2);
  const expected = structuredClone(saved.workspaceData.program);
  expected.blocks.find(
    (block: { kind: string; next: string | null }) =>
      block.kind === 'move' && block.next !== null,
  ).steps = 25;
  expect(body.workspaceData.program).toEqual(expected);
  await expect(status).toHaveText('Projeto salvo com sucesso.');
  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await page
    .getByRole('button', { name: 'Abrir projeto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Abrir Programa atualizado', exact: true })
    .click();
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 25 passos/ }),
  ).toHaveCount(1);
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Excluir projeto', exact: true })
    .press('Enter');
  await expect(status).toHaveText('Projeto excluído.');
  expect((await app.inject(`/api/projects/${saved.id}`)).statusCode).toBe(404);
  expect(errors).toEqual([]);
});

test('falha de rede preserva alterações e cancelar novo preserva o editor', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'Nome do projeto' })
    .fill('Não perder');
  await page.route('**/api/projects', (route) => route.abort());
  await page
    .getByRole('button', { name: 'Salvar projeto', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('Não foi possível salvar');
  await expect(
    page.getByText('Alterações não salvas.', { exact: true }),
  ).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Nome do projeto' }),
  ).toHaveValue('Não perder');
});

test('carrega v1 preservando parâmetros e estado inicial, salva v2 explicitamente', async ({
  page,
}) => {
  const input = structuredClone(projectExample);
  input.name = 'Legado';
  input.workspaceData.actors[0]!.initialState.x = 20;
  const created = await app.inject({
    method: 'POST',
    url: '/api/projects',
    payload: input,
  });
  expect(created.statusCode).toBe(201);
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Abrir projeto', exact: true })
    .click();
  await page.getByRole('button', { name: 'Abrir Legado', exact: true }).click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('Formato antigo convertido');
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .click();
  await expect(
    page.getByRole('img', { name: /posição x 30, y 0/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toHaveAttribute('aria-disabled', 'false');
  await page
    .getByRole('button', { name: 'Salvar projeto', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toHaveText('Projeto salvo com sucesso.');
  const updated = (
    await app.inject(`/api/projects/${created.json().id}`)
  ).json();
  expect(updated.formatVersion).toBe(2);
  expect(updated.workspaceData.initialState.x).toBe(20);
});

test('conflito e carregamento inválido preservam o projeto local', async ({
  page,
}) => {
  const created = await app.inject({
    method: 'POST',
    url: '/api/projects',
    payload: { ...projectExample, name: 'Concorrente' },
  });
  const id = created.json().id;
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Abrir projeto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Abrir Concorrente', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('Projeto carregado.');
  await app.inject({
    method: 'PUT',
    url: `/api/projects/${id}`,
    headers: { 'if-match': '"1"' },
    payload: { ...projectExample, name: 'Concorrente' },
  });
  await page
    .getByRole('textbox', { name: 'Nome do projeto' })
    .fill('Minha alteração local');
  await page
    .getByRole('button', { name: 'Salvar projeto', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('outra janela');
  await expect(
    page.getByText('Alterações não salvas.', { exact: true }),
  ).toBeVisible();
  await page.route(`**/api/projects/${id}`, (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ...created.json(), workspaceData: {} }),
    }),
  );
  await page
    .getByRole('button', { name: 'Abrir projeto', exact: true })
    .click();
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Abrir Concorrente', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Alterações do programa' }),
  ).toContainText('projeto inválido');
  await expect(
    page.getByRole('textbox', { name: 'Nome do projeto' }),
  ).toHaveValue('Minha alteração local');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 10 passos/ }),
  ).toHaveCount(1);
});
