import { useEffect, useRef } from 'react';
import type { useProjects } from '../useProjects';
export function ProjectActions({
  projects,
  running,
}: {
  projects: ReturnType<typeof useProjects>;
  running: boolean;
}) {
  const openButton = useRef<HTMLButtonElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (projects.listOpen) {
      const frame = requestAnimationFrame(() =>
        listRef.current?.querySelector('button')?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [projects.listOpen, projects.page.offset]);
  const blocked = projects.busy || running;
  return (
    <section
      className="project-actions"
      aria-label="Gerenciar projeto"
      aria-busy={projects.busy}
    >
      <label>
        Nome do projeto{' '}
        <input
          ref={nameInput}
          value={projects.name}
          maxLength={120}
          disabled={blocked}
          onChange={(event) => projects.setName(event.target.value)}
        />
      </label>
      <span>
        {projects.dirty
          ? 'Alterações não salvas.'
          : projects.saved
            ? 'Projeto salvo.'
            : 'Projeto novo.'}
      </span>
      <button
        type="button"
        aria-disabled={blocked}
        onClick={() => {
          if (!blocked && projects.newProject()) nameInput.current?.focus();
        }}
      >
        Novo projeto
      </button>
      <button
        type="button"
        aria-disabled={blocked}
        onClick={() => {
          if (!blocked) void projects.save();
        }}
      >
        Salvar projeto
      </button>
      <button
        ref={openButton}
        type="button"
        aria-disabled={blocked}
        onClick={() => {
          if (!blocked) void projects.list();
        }}
      >
        Abrir projeto
      </button>
      <button
        type="button"
        aria-disabled={blocked || !projects.saved}
        onClick={() => {
          if (!blocked && projects.saved) void projects.remove();
        }}
      >
        Excluir projeto
      </button>
      {projects.busy && <span>Processando projeto…</span>}
      {projects.error && <p className="project-error">{projects.error}</p>}
      {projects.listOpen && (
        <div
          ref={listRef}
          className="project-list"
          role="region"
          aria-label="Projetos disponíveis"
        >
          <h2>Projetos disponíveis</h2>
          {!projects.page.items.length && <p>Nenhum projeto encontrado.</p>}
          <ul>
            {projects.page.items.map((project) => (
              <li key={project.id}>
                <button
                  aria-disabled={blocked}
                  type="button"
                  onClick={async () => {
                    if (blocked) return;
                    await projects.open(project.id);
                    requestAnimationFrame(() => openButton.current?.focus());
                  }}
                >
                  Abrir {project.name}
                </button>
              </li>
            ))}
          </ul>
          <button
            disabled={blocked || projects.page.offset === 0}
            onClick={() =>
              void projects.list(Math.max(0, projects.page.offset - 20))
            }
          >
            Página anterior
          </button>
          <button
            disabled={
              blocked || projects.page.offset + 20 >= projects.page.total
            }
            onClick={() => void projects.list(projects.page.offset + 20)}
          >
            Próxima página
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              projects.closeList();
              openButton.current?.focus();
            }}
          >
            Fechar lista
          </button>
        </div>
      )}
    </section>
  );
}
