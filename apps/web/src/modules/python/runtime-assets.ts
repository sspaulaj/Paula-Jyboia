// Build/dev integration only. Never imported by the browser application.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const require = createRequire(import.meta.url);
const runtimeDirectory = dirname(require.resolve('pyodide/package.json'));
const runtimePrefix = '/python-runtime/314.0.8/';
const files = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};
const workerCsp =
  "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'";

export function pythonRuntimeAssets(): Plugin {
  const middleware =
    (serveRuntime: boolean) =>
    (request: IncomingMessage, response: ServerResponse, next: () => void) => {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      const worker =
        pathname.includes('/modules/python/runtime/python.worker.ts') ||
        pathname.startsWith('/assets/python-worker-');
      if (pathname === '/python' || pathname === '/python/' || worker) {
        for (const [name, value] of Object.entries(isolation))
          response.setHeader(name, value);
      }
      if (worker) response.setHeader('Content-Security-Policy', workerCsp);
      const file = pathname.startsWith(runtimePrefix)
        ? pathname.slice(runtimePrefix.length)
        : '';
      if (!serveRuntime || !files.includes(file)) return next();
      response.setHeader(
        'Content-Type',
        file.endsWith('.mjs')
          ? 'application/javascript'
          : file.endsWith('.wasm')
            ? 'application/wasm'
            : file.endsWith('.json')
              ? 'application/json'
              : 'application/zip',
      );
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      response.end(readFileSync(join(runtimeDirectory, file)));
    };
  return {
    name: 'jyboia-python-runtime',
    configureServer(server) {
      server.middlewares.use(middleware(true));
    },
    // Preview must use the emitted files, so tests exercise the actual artifact.
    configurePreviewServer(server) {
      server.middlewares.use(middleware(false));
    },
    generateBundle() {
      for (const file of files)
        this.emitFile({
          type: 'asset',
          fileName: `${runtimePrefix.slice(1)}${file}`,
          source: readFileSync(join(runtimeDirectory, file)),
        });
    },
  };
}
