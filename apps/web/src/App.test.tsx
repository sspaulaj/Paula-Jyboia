import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App';

it('renderiza o ponto de entrada sem disponibilizar editor prematuramente', () => {
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain('<main>');
  expect(html).toContain('<h1>Jyboia</h1>');
  expect(html).toContain('role="status"');
});
