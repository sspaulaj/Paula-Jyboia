import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: { host: 'localhost', port: 5173, strictPort: true },
  preview: { host: 'localhost', port: 4173, strictPort: true },
});
