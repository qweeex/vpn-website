import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'node tests/fixtures/backend.mjs', port: 4321, reuseExistingServer: false },
    {
      command: 'npx next dev --port 3101 --hostname 127.0.0.1',
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
      env: {
        BACKEND_URL: 'http://127.0.0.1:4321',
        APP_ORIGIN: 'http://127.0.0.1:3101',
        NEXT_DIST_DIR: '.next-e2e',
        SESSION_SECRET: 'a'.repeat(64),
      },
    },
  ],
});
