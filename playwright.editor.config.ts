import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Every browser run uses a disposable collection. Never type into the live editor in tests.
const data = mkdtempSync(join(tmpdir(), 'thingelstad-editor-browser-'));
for (const file of ['collection.json', 'github.json']) copyFileSync(`src/data/${file}`, join(data, file));
export default defineConfig({
  testDir: './tests/editor-browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'off',
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
    command: 'npm run editor',
    env: { PORT: '4174', EDITOR_DATA_DIR: data },
    url: 'http://127.0.0.1:4174/api/health',
    reuseExistingServer: false,
    timeout: 30000
  }
});
