import { expect, test, type Page } from '@playwright/test';
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test('paleta, inserção, parâmetros e exclusão por teclado', async ({
  page,
}) => {
  await page.goto('/experiments/editor');
  await expect(
    page.getByRole('heading', { name: 'Conecte suas ideias' }),
  ).toBeVisible();
  for (let index = 0; index < 4; index++) await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Escolher tipos de blocos' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /Bloco de evento: quando iniciar/,
  );
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('figure', { name: /^Bloco de evento/ }),
  ).toHaveAttribute('aria-label', /Posição 1 de 1/);
  await page.keyboard.press('t');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /mover 10 passos/,
  );
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveAttribute('aria-label', /Posição 2 de 2/);
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /Conectado/,
  );
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const field = page.locator('input.blocklyHtmlInput');
  await expect(field).toBeVisible();
  await field.fill('25');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover 25 passos/ }),
  ).toHaveCount(1);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Delete');
  await expect(
    page.getByRole('figure', { name: /^Bloco de movimento: mover/ }),
  ).toHaveCount(0);
  await page.keyboard.press('t');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /Na paleta/,
  );
});

test('constrói os quatro tipos, percorre conexões e atualiza texto e giro', async ({
  page,
}) => {
  await page.goto('/experiments/editor');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  for (let index = 0; index < 4; index++) {
    if (index > 0) {
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
  }
  await expect(
    page.getByRole('figure', { name: /^Bloco de aparência: dizer Olá/ }),
  ).toHaveAttribute('aria-label', /Posição 4 de 4/);
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /Posição 4 de 4/,
  );
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('Oi, mundo');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /dizer Oi, mundo/,
  );
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /girar 15 graus para a direita/,
  );
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.locator('input.blocklyHtmlInput').fill('45');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /girar 45 graus/,
  );
  await page.getByRole('button', { name: 'Iniciar atividade' }).press('Enter');
  await expect(
    page.getByRole('status', { name: 'Sequência da atividade' }),
  ).toContainText('Bloco 4: dizer Oi, mundo.');
  await expect(page.locator('.blocklyMainBackground')).toHaveCount(1);
});

test('reordenar por teclado preserva conexões e não causa erro de projeção', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/experiments/editor');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('t');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /mover 10 passos/,
  );
  await page.keyboard.press('m');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toHaveAttribute(
    'aria-label',
    /Bloco de movimento/,
  );
  expect(errors).toEqual([]);
});

test('registra exposição semântica ao ponteiro sem simular fala', async ({
  page,
}, testInfo) => {
  await page.goto('/experiments/editor');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  const block = page.locator(':focus');
  const id = await block.getAttribute('id');
  const box = await block.boundingBox();
  expect(box).not.toBeNull();
  await page.getByRole('button', { name: 'Iniciar atividade' }).focus();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(
    page.getByRole('button', { name: 'Iniciar atividade' }),
  ).toBeFocused();
  const session = await page.context().newCDPSession(page);
  const ax = await session.send('Accessibility.getFullAXTree');
  expect(
    ax.nodes.some(
      (node) =>
        !node.ignored &&
        node.role?.value === 'figure' &&
        node.name?.value?.startsWith('Bloco de evento: quando iniciar.'),
    ),
  ).toBe(true);
  const blockElement = page.locator(`[id=${JSON.stringify(id)}]`);
  const evidence = {
    browser: page.context().browser()?.version(),
    label: await blockElement.getAttribute('aria-label'),
    ariaHidden: await blockElement.getAttribute('aria-hidden'),
    exposedBlockNames: ax.nodes
      .filter(
        (node) =>
          !node.ignored && node.name?.value?.includes('Bloco de evento'),
      )
      .map((node) => node.name?.value),
    note: 'Automação inspeciona DOM/AX. Nenhum leitor de tela foi executado.',
  };
  await testInfo.attach('pointer-accessibility.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  });
  console.log('POINTER_EVIDENCE', JSON.stringify(evidence));
  await page.screenshot({
    path: testInfo.outputPath('editor.png'),
    fullPage: true,
  });
});

test('ponteiro anuncia novamente ao reentrar e iniciar publica a sequência sem mover foco', async ({
  page,
}) => {
  await page.goto('/experiments/editor');
  const status = page.getByRole('status', { name: 'Alterações do programa' });
  const start = page.getByRole('button', { name: 'Iniciar atividade' });
  const sequence = page.getByRole('status', { name: 'Sequência da atividade' });
  await start.press('Enter');
  await expect(sequence).toContainText('Adicione um bloco Quando iniciar');
  await page
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('t');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  const block = page.getByRole('figure', {
    name: /^Bloco de movimento: mover 10 passos/,
  });
  await expect(block).toHaveAttribute('aria-label', /Conectado/);
  await start.focus();
  await block.locator('..').locator('text').first().hover();
  await expect(status).toContainText(
    'Bloco de movimento: mover 10 passos. Conectado.',
  );
  await expect(page.locator('.jyboia-pointer-block')).toHaveCount(1);
  await expect(start).toBeFocused();
  const previous = await status.locator('span').elementHandle();
  await page.getByRole('heading', { name: 'Conecte suas ideias' }).hover();
  await expect(page.locator('.jyboia-pointer-block')).toHaveCount(0);
  await block.locator('..').locator('text').first().hover();
  await expect
    .poll(() => previous!.evaluate((element) => element.isConnected))
    .toBe(false);
  await start.press('Enter');
  await expect(sequence).toHaveText(
    'Bloco 1: quando iniciar. Bloco 2: mover 10 passos. Fim da sequência.',
  );
  await expect(start).toBeFocused();
  const firstStart = await sequence.locator('span').elementHandle();
  await start.press('Enter');
  await expect
    .poll(() => firstStart!.evaluate((element) => element.isConnected))
    .toBe(false);
  await page.getByRole('heading', { name: 'Conecte suas ideias' }).hover();
  await block.locator('..').locator('text').first().hover();
  await expect(status).toContainText('Bloco de movimento: mover 10 passos.');
  await expect(sequence).toHaveText(
    'Bloco 1: quando iniciar. Bloco 2: mover 10 passos. Fim da sequência.',
  );
});

test('barra de ações desconecta somente o bloco selecionado e mantém os anúncios acessíveis', async ({
  page,
}) => {
  await page.goto('/experiments/editor');
  const toolbar = page.getByRole('navigation', { name: 'Controles do editor' });
  await expect(toolbar.getByRole('button')).toHaveText([
    'Entrar no editor',
    'Escolher tipos de blocos',
    'Desconectar bloco',
    'Iniciar atividade',
  ]);
  const disconnect = toolbar.getByRole('button', { name: 'Desconectar bloco' });
  await expect(disconnect).toBeDisabled();
  await toolbar
    .getByRole('button', { name: 'Escolher tipos de blocos' })
    .press('Enter');
  for (let index = 0; index < 3; index++) {
    if (index > 0) {
      await page.keyboard.press('t');
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator(':focus')).toHaveAttribute(
      'aria-label',
      new RegExp(`de ${index + 1} na sequência`),
    );
  }
  const move = page.getByRole('figure', { name: /^Bloco de movimento: mover/ });
  await move.locator('..').locator('text').first().click();
  await expect(disconnect).toBeEnabled();
  await disconnect.click();
  await expect(move).toBeFocused();
  await expect(move).toHaveAttribute('aria-label', /Solto/);
  await expect(disconnect).toBeDisabled();
  const status = page.getByRole('status', { name: 'Alterações do programa' });
  await expect(status).toContainText('Bloco desconectado.');
  await toolbar
    .getByRole('button', { name: 'Iniciar atividade' })
    .press('Enter');
  const sequence = page.getByRole('status', { name: 'Sequência da atividade' });
  await expect(sequence).toContainText('Bloco 2: girar 15 graus');
  await expect(sequence).not.toContainText('mover 10 passos');
  await expect(status).toHaveClass('screen-reader-only');
  await expect(status).not.toHaveAttribute('aria-hidden', 'true');
  await expect(
    page.getByRole('heading', { name: 'Sequência construída' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('group', { name: 'Conexões do bloco selecionado' }),
  ).toHaveCount(0);
  expect(
    await page.getByTestId('editor-host').evaluate((host) =>
      Array.from(host.parentElement!.children)
        .slice(Array.from(host.parentElement!.children).indexOf(host) + 1)
        .every((element) => element.classList.contains('screen-reader-only')),
    ),
  ).toBe(true);
});
