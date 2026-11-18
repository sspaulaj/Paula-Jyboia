import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  testIgnore: ['**/persistence.spec.ts', '**/static-mvp.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5174',
    browserName: 'chromium',
    channel: 'msedge',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'pnpm build:packages && pnpm --filter @jyboia/web dev --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
