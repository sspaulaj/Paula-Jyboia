import { afterEach, expect, it, vi } from 'vitest';
import { createAnnouncements } from './announcements';
afterEach(() => vi.useRealTimers());

it('agrupa alterações rápidas e elimina repetição imediata', () => {
  vi.useFakeTimers();
  const publish = vi.fn();
  const controller = createAnnouncements(publish);
  controller.edit('Parâmetro 1');
  controller.edit('Parâmetro 2');
  vi.advanceTimersByTime(150);
  expect(publish.mock.calls).toEqual([['Parâmetro 2']]);
  controller.edit('Parâmetro 2');
  vi.advanceTimersByTime(150);
  expect(publish).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(600);
  controller.edit('Parâmetro 2');
  vi.advanceTimersByTime(150);
  expect(publish).toHaveBeenCalledTimes(2);
});
it('iniciar cancela mensagens antigas, bloqueia edição durante execução e permite reinício idêntico', () => {
  vi.useFakeTimers();
  const publish = vi.fn();
  const controller = createAnnouncements(publish);
  controller.edit('Bloco sob o ponteiro');
  controller.setExecuting(true);
  controller.execution('Programa iniciado. Sequência.');
  controller.edit('Bloco conectado');
  vi.advanceTimersByTime(1000);
  expect(publish.mock.calls).toEqual([['Programa iniciado. Sequência.']]);
  controller.setExecuting(false);
  controller.execution('Programa parado.');
  controller.setExecuting(true);
  controller.execution('Programa iniciado. Sequência.');
  expect(publish.mock.calls.at(-1)).toEqual(['Programa iniciado. Sequência.']);
  expect(publish).toHaveBeenCalledTimes(3);
});
it('desmontagem descarta mensagens pendentes', () => {
  vi.useFakeTimers();
  const publish = vi.fn();
  const controller = createAnnouncements(publish);
  controller.edit('Mensagem');
  controller.dispose();
  vi.runAllTimers();
  expect(publish).not.toHaveBeenCalled();
});
