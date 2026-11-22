import { useEffect, useRef, useState } from 'react';
import type {
  ProjectPage,
  ProjectResource,
  ProjectInput,
} from '@jyboia/shared/projects';
import {
  upgradeDocument,
  type EditorDocument,
} from '@jyboia/block-engine/editor-document';
import type {
  EditorSnapshot,
  mountEditor,
} from '../experiment/blockly-adapter';
import { documentKey } from '../experiment/project-adapter';
import { projectsClient } from '../../../api/projects';

const emptyDocument = (): EditorDocument => ({
  schemaVersion: 2,
  program: { blocks: [], entryBlockIds: [] },
  initialState: { x: 0, y: 0, heading: 0 },
  layout: [],
});
const key = (name: string, description: string, document: string) =>
  JSON.stringify([name, description, document]);
export function useProjects(
  editorRef: React.RefObject<ReturnType<typeof mountEditor> | null>,
  snapshot: EditorSnapshot,
  announce: (message: string) => void,
  resetExecution: () => void,
) {
  const [name, setName] = useState('Novo projeto');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState<ProjectResource | null>(null);
  const [baseline, setBaseline] = useState(
    key('Novo projeto', '', documentKey(emptyDocument())),
  );
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState<ProjectPage>({
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
  });
  const [listOpen, setListOpen] = useState(false);
  const dirty =
    key(
      name,
      description,
      snapshot.contentKey ?? documentKey(emptyDocument()),
    ) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const discard = () =>
    !dirty || window.confirm('Há alterações não salvas. Deseja descartá-las?');
  const run = async (action: () => Promise<void>, failure: string) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      const message = `${failure} ${cause instanceof Error ? cause.message : 'Tente novamente.'}`;
      setError(message);
      announce(message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const newProject = () => {
    if (operation.current || !discard()) return false;
    editorRef.current?.loadDocument(emptyDocument());
    resetExecution();
    setName('Novo projeto');
    setDescription('');
    setSaved(null);
    setError('');
    setBaseline(key('Novo projeto', '', documentKey(emptyDocument())));
    announce('Novo projeto criado.');
    return true;
  };
  const save = () =>
    run(async () => {
      const editor = editorRef.current;
      if (!editor) throw new Error('Aguarde o editor ficar pronto.');
      if (!name.trim() || name.trim().length > 120)
        throw new Error('Informe um nome de 1 a 120 caracteres.');
      const document = editor.exportDocument();
      const input: ProjectInput = {
        name: name.trim(),
        description,
        workspaceData: document,
        formatVersion: 2,
      };
      const result = saved
        ? await projectsClient.update(saved.id, saved.revision, input)
        : await projectsClient.create(input);
      setSaved(result);
      setName(result.name);
      setBaseline(key(result.name, description, documentKey(document)));
      announce('Projeto salvo com sucesso.');
    }, 'Não foi possível salvar o projeto.');
  const list = (offset = 0) =>
    run(async () => {
      setPage(await projectsClient.list(offset));
      setListOpen(true);
    }, 'Não foi possível listar os projetos.');
  const open = (id: string) => {
    if (!discard()) return;
    return run(async () => {
      const result = await projectsClient.get(id);
      const document = upgradeDocument(result.workspaceData);
      editorRef.current!.loadDocument(document);
      resetExecution();
      setName(result.name);
      setDescription(result.description);
      setSaved(result);
      setListOpen(false);
      setBaseline(
        key(
          result.name,
          result.description,
          documentKey(editorRef.current!.exportDocument()),
        ),
      );
      announce(
        result.formatVersion === 1
          ? 'Projeto carregado. Formato antigo convertido; o próximo salvamento usará a versão 2.'
          : 'Projeto carregado.',
      );
    }, 'Não foi possível carregar o projeto.');
  };
  const remove = () => {
    if (
      !saved ||
      operation.current ||
      !window.confirm(
        `Excluir o projeto “${saved.name}”?${dirty ? ' As alterações não salvas também serão descartadas.' : ''}`,
      )
    )
      return;
    return run(async () => {
      await projectsClient.remove(saved.id, saved.revision);
      editorRef.current!.loadDocument(emptyDocument());
      resetExecution();
      setName('Novo projeto');
      setDescription('');
      setSaved(null);
      setListOpen(false);
      setBaseline(key('Novo projeto', '', documentKey(emptyDocument())));
      announce('Projeto excluído.');
    }, 'Não foi possível excluir o projeto.');
  };
  return {
    name,
    setName,
    description,
    setDescription,
    saved,
    dirty,
    busy,
    error,
    page,
    listOpen,
    closeList: () => setListOpen(false),
    newProject,
    save,
    list,
    open,
    remove,
  };
}
