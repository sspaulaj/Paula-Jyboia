import { expect as baseExpect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Runtime startup has a 30-second application deadline; WASM compilation and
// failed downloads can outlast Playwright's default five-second assertion wait.
const expect = baseExpect.configure({ timeout: 35000 });
test.setTimeout(60000);

async function start(page: Page, example: string) {
  await page.getByLabel('Exemplo de programa').selectOption(example);
  await page
    .getByRole('button', { name: 'Iniciar programa', exact: true })
    .click();
}
const terminal = (page: Page) =>
  page.locator('section[aria-labelledby="python-terminal-title"]');
const output = (page: Page) =>
  page.getByLabel('Saída do programa', { exact: true });
test.beforeEach(async ({ page }) => {
  await page.goto('/python');
});

test('print real no Worker, sem rede externa e sem carregar Scratch', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(page.url()).origin)
      external.push(request.url());
  });
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await start(page, 'hello');
  await expect(terminal(page)).toHaveAttribute('data-state', 'done');
  await expect(output(page)).toHaveText('Olá, mundo!\n');
  expect(external).toEqual([]);
  await expect(page.getByTestId('editor-host')).toHaveCount(0);
});

for (const scenario of [
  {
    id: 'name',
    question: 'Qual é o seu nome?',
    answer: 'João 🐍',
    result: 'Olá, João 🐍',
  },
  {
    id: 'integer',
    question: 'Digite um número inteiro:',
    answer: '41',
    result: '42',
  },
  {
    id: 'float',
    question: 'Digite um número decimal usando ponto:',
    answer: '2.5',
    result: '5.0',
  },
]) {
  test(`input e resultado com teclado: ${scenario.id}`, async ({ page }) => {
    await start(page, scenario.id);
    const input = page.getByRole('textbox', { name: scenario.question });
    await expect(input).toBeFocused();
    await expect(
      page.getByRole('button', { name: 'Iniciar programa', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await input.fill(scenario.answer);
    await input.press('Enter');
    await expect(terminal(page)).toHaveAttribute('data-state', 'done');
    await expect(output(page)).toContainText(scenario.result);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.locator('.python-focus-target')).toBeFocused();
    await expect(page.getByRole('status')).toContainText(scenario.result);
  });
}

test('dois inputs continuam a mesma execução, incluindo resposta vazia', async ({
  page,
}) => {
  await start(page, 'two-inputs');
  const first = page.getByRole('textbox', { name: 'Qual é o seu nome?' });
  await expect(first).toBeFocused();
  await first.fill('Ana');
  await first.press('Enter');
  const second = page.getByRole('textbox', {
    name: 'Qual é a sua cor favorita?',
  });
  await expect(second).toBeFocused();
  await expect(second).toHaveValue('');
  await second.press('Enter');
  await expect(terminal(page)).toHaveAttribute('data-state', 'done');
  await expect(output(page)).toContainText('Ana gosta de');
});

for (const scenario of [
  { id: 'syntax-error', result: 'Erro de sintaxe' },
  { id: 'runtime-error', result: 'não é possível dividir por zero' },
  { id: 'output-limit', result: 'limite de saída atingido' },
]) {
  test(`diagnóstico acessível: ${scenario.id}`, async ({ page }) => {
    await start(page, scenario.id);
    await expect(terminal(page)).toHaveAttribute('data-state', 'error');
    await expect(page.getByRole('status')).toContainText(scenario.result);
    expect((await output(page).textContent())!.length).toBeLessThanOrEqual(
      8000,
    );
  });
}

test('erro de conversão de input', async ({ page }) => {
  await start(page, 'integer');
  const input = page.getByRole('textbox');
  await input.fill('não é número');
  await input.press('Enter');
  await expect(page.getByRole('status')).toContainText('Erro de conversão');
});

for (const example of ['infinite', 'name']) {
  test(`Parar funciona durante ${example} e permite nova execução`, async ({
    page,
  }) => {
    await start(page, example);
    await expect(terminal(page)).toHaveAttribute(
      'data-state',
      example === 'name' ? 'input' : 'running',
    );
    const stop = page.getByRole('button', {
      name: 'Parar programa',
      exact: true,
    });
    await stop.focus();
    await stop.press('Enter');
    await expect(terminal(page)).toHaveAttribute('data-state', 'stopped', {
      timeout: 2000,
    });
    await expect(page.locator('.python-focus-target')).toBeFocused();
    await expect(stop).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await start(page, 'hello');
    await expect(terminal(page)).toHaveAttribute('data-state', 'done');
    await expect(output(page)).toHaveText('Olá, mundo!\n');
  });
}

test('watchdog interrompe laço infinito automaticamente', async ({ page }) => {
  await start(page, 'infinite');
  await expect(page.getByRole('status')).toContainText('limite de 5 segundos', {
    timeout: 15000,
  });
  await expect(terminal(page)).toHaveAttribute('data-state', 'error');
});

test('condicional e repetição executam no Python real', async ({ page }) => {
  await start(page, 'condition');
  const input = page.getByRole('textbox', { name: 'Quantas vezes?' });
  await input.fill('3');
  await input.press('Enter');
  await expect(output(page)).toHaveText('Olá 1\nOlá 2\nOlá 3\n');
  await expect(terminal(page)).toHaveAttribute('data-state', 'done');
});

test('teclado alcança exemplo, início, terminal e campo de resposta', async ({
  page,
}) => {
  await expect(page.getByLabel('Exemplo de programa')).toBeVisible();
  await page.getByRole('link', { name: 'Python', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Exemplo de programa')).toBeFocused();
  await page.getByLabel('Exemplo de programa').selectOption('name');
  await page.keyboard.press('Tab'); // summary
  await page.keyboard.press('Tab'); // start
  await expect(
    page.getByRole('button', { name: 'Iniciar programa', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  const input = page.getByRole('textbox', { name: 'Qual é o seu nome?' });
  await expect(input).toBeFocused();
  await page.keyboard.type('Maria');
  await page.keyboard.press('Enter');
  await expect(output(page)).toContainText('Olá, Maria');
  await expect(page.locator('.python-focus-target')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(output(page)).toBeFocused();
});

test('Parar durante carregamento permite reiniciar', async ({
  page,
  context,
}) => {
  let requested = false;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route('**/python-runtime/**/pyodide.mjs', async (route) => {
    requested = true;
    await gate;
    await route.abort().catch(() => {});
  });
  await start(page, 'hello');
  await expect.poll(() => requested).toBe(true);
  await page
    .getByRole('button', { name: 'Parar programa', exact: true })
    .click();
  await expect(terminal(page)).toHaveAttribute('data-state', 'stopped', {
    timeout: 2000,
  });
  release();
  await context.unrouteAll({ behavior: 'wait' });
  await start(page, 'hello');
  await expect(terminal(page)).toHaveAttribute('data-state', 'done');
});

test('falha de download do WASM é informada e permite nova tentativa', async ({
  page,
  context,
}) => {
  let blocked = 0;
  await context.route('**/python-runtime/**/pyodide.asm.wasm', (route) => {
    blocked++;
    return route.abort();
  });
  await start(page, 'hello');
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(terminal(page)).toHaveAttribute('data-state', 'error');
  await expect(page.getByRole('status')).toContainText(
    'Não foi possível carregar Python',
  );
  await context.unrouteAll({ behavior: 'wait' });
  await start(page, 'hello');
  await expect(terminal(page)).toHaveAttribute('data-state', 'done');
});

test('timeout de input devolve o foco ao terminal', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  await start(page, 'name');
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.clock.runFor(120001);
  await expect(terminal(page)).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.python-focus-target')).toBeFocused();
  await expect(page.getByRole('status')).toContainText('tempo de espera');
});

test('sem isolamento informa indisponibilidade sem iniciar Worker', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(globalThis, 'crossOriginIsolated', { value: false }),
  );
  await page.reload();
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await start(page, 'hello');
  await expect(page.getByRole('status')).toContainText('isolamento necessário');
  expect(workers).toEqual([]);
});
