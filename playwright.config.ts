import { defineConfig, devices } from '@playwright/test';

// XYZ_TEST_PORT lets two checkouts run their browser tests at once without one reusing the other's server.
const port = Number(process.env.XYZ_TEST_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1536, height: 960 } } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 } } },
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', reducedMotion: 'reduce' } }
  ],
  // The built site, served the way CloudFront serves it. Run `npm run site:build` first.
  webServer: {
    command: `node scripts/serve-site.mjs ${port} _site`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
