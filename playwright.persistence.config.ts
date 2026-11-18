import { defineConfig } from '@playwright/test';
export default defineConfig({
  outputDir: './test-results/persistence',
  testDir: './apps/web/e2e',
  testMatch: 'persistence.spec.ts',
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5175',
    browserName: 'chromium',
    channel: 'msedge',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @jyboia/web dev --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
    timeout: 60000,
    env: { VITE_API_URL: 'http://127.0.0.1:3002' },
  },
});
