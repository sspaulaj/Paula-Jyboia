/** Coordena mensagens do Jyboia. Não controla a fila de fala da tecnologia assistiva. */
export function createAnnouncements(publish: (text: string) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let executing = false;
  let editingSuspended = false;
  let lastEdit = '';
  let lastEditAt = 0;
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    edit(text: string, newPointerEntry = false) {
      if (
        executing ||
        editingSuspended ||
        (!newPointerEntry && text === lastEdit && Date.now() - lastEditAt < 600)
      )
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
      editingSuspended = true;
      lastEdit = '';
      publish(text);
    },
    beginSequence() {
      clear();
      executing = true;
      editingSuspended = true;
      lastEdit = '';
      publish('');
    },
    resumeEditing() {
      if (!executing) editingSuspended = false;
    },
    setExecuting(value: boolean) {
      executing = value;
      if (value) clear();
    },
    dispose: clear,
  };
}
