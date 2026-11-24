import { lazy, Suspense } from 'react';
import { resolveRoute } from './routes';
import { SiteHeader } from './SiteHeader';

const Scratch = lazy(() => import('../modules/scratch'));
const Python = lazy(() => import('../modules/python'));
const Experiment = import.meta.env.DEV
  ? lazy(() => import('../modules/scratch/experiment/EditorExperiment'))
  : null;

export function AppRoutes() {
  const route = resolveRoute(window.location.pathname, import.meta.env.DEV);
  return (
    <div className="app-shell">
      <SiteHeader current={route} />
      <div className="app-shell__content">
        <Suspense fallback={<p role="status">Carregando editor…</p>}>
          {route === 'python' ? (
            <Python />
          ) : route === 'experiment' && Experiment ? (
            <Experiment />
          ) : (
            <Scratch />
          )}
        </Suspense>
      </div>
    </div>
  );
}
