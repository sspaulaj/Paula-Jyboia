import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pythonRuntimeAssets } from './src/modules/python/runtime-assets.js';

export default defineConfig({
  plugins: [react(), pythonRuntimeAssets()],
  worker: {
    format: 'es',
    rollupOptions: {
      output: { entryFileNames: 'assets/python-worker-[hash].js' },
    },
  },
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: { host: 'localhost', port: 5173, strictPort: true },
  preview: { host: 'localhost', port: 4173, strictPort: true },
});
