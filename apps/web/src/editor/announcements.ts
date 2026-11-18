/** Coordena mensagens do Jyboia. Não controla a fila de fala da tecnologia assistiva. */
export function createAnnouncements(publish: (text: string) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let executing = false;
  let lastEdit = '';
  let lastEditAt = 0;
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    edit(text: string) {
      if (executing || (text === lastEdit && Date.now() - lastEditAt < 600))
        return;
      clear();
      timer = setTimeout(() => {
        timer = undefined;
        lastEdit = text;
        lastEditAt = Date.now();
        publish(text);
      }, 150);
    },
    execution(text: string) {
      clear();
      lastEdit = '';
      publish(text);
    },
    setExecuting(value: boolean) {
      executing = value;
      if (value) clear();
    },
    dispose: clear,
  };
}
