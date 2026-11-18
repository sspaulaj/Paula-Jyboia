import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const container = document.getElementById('root');
const EditorExperiment = import.meta.env.DEV
  ? lazy(() => import('./experiment/EditorExperiment'))
  : null;
const EditorPage = lazy(() =>
  import('./editor/EditorPage').then((m) => ({ default: m.EditorPage })),
);
if (!container)
  throw new Error('Elemento principal da aplicação não encontrado.');

function resolveRoute() {
  const path = window.location.pathname;
  if (EditorExperiment && path === '/experiments/editor')
    return <EditorExperiment />;
  return <EditorPage />;
}

createRoot(container).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Carregando editor…</p>}>
      {resolveRoute()}
    </Suspense>
  </StrictMode>,
);
