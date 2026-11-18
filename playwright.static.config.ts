import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  testMatch: 'static-mvp.spec.ts',
  outputDir: './test-results/static',
  workers: 1,
  use: {
    baseURL: 'http://localhost:4175',
    browserName: 'chromium',
    channel: 'msedge',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 1100 },
  },
  webServer: {
    command: 'pnpm preview --port 4175 --strictPort',
    url: 'http://localhost:4175',
    reuseExistingServer: false,
  },
});
