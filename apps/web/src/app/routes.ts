/** Resolve document entry routes; unknown paths keep the existing Scratch fallback. */
export function resolveRoute(pathname: string, development: boolean) {
  if (pathname === '/python' || pathname === '/python/') return 'python';
  if (development && pathname === '/experiments/editor') return 'experiment';
  return 'scratch';
}
