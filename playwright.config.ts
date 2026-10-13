import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
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
  webServer: {
    command: 'npm start',
    env: { PORT: '4173' },
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
