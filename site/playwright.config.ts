// End-to-end tests against the production build (`astro preview` serving
// dist/), because search only exists after Pagefind indexes the build.
// Run with `npm run test:e2e`, which builds first.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --ignore-lock: Astro 7 refuses a second preview server, and tests
    // should still run while you have `npm run preview` open.
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/aws-learn/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
