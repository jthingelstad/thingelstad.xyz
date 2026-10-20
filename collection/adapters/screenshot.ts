// Screenshot observations: the front page of each website thing, as a 1280×800 JPEG, so a thing page
// shows what the site looks like. A capture is refreshed once it is four weeks old, which keeps the
// repository's growth to about one image per site per month; git history keeps the earlier ones.
//
// Captures block analytics, so taking one never counts as a visit to the site.
import { createHash } from 'node:crypto';
import type { ScreenshotObservation } from '../schema';
import { websiteKey } from '../schema';

type Capture = { image: Uint8Array; width: number; height: number };
export type Capturer = { capture(url: string): Promise<Capture>; close(): Promise<void> };

const viewport = { width: 1280, height: 800 };
// A capture is due when it is at least this old. Weekly runs drift by hours, so 27 days makes the
// fourth weekly run after a capture the one that refreshes it.
const refreshAfterDays = 27;
const analytics =
  /^https:\/\/([a-z0-9-]+\.)*(tinylytics\.app|google-analytics\.com|googletagmanager\.com|plausible\.io)\//;
const sameSite = (a: string, b: string) =>
  new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, '');

export function screenshotDue(previous: ScreenshotObservation | undefined, now: Date) {
  return !previous || now.valueOf() - Date.parse(previous.observedAt) >= refreshAfterDays * 86_400_000;
}

export async function observeScreenshot(
  url: string,
  capturer: Capturer,
  now = new Date()
): Promise<{ observation: ScreenshotObservation; image: Uint8Array }> {
  const { image, width, height } = await capturer.capture(url);
  return {
    observation: {
      kind: 'screenshot',
      url,
      observedAt: now.toISOString(),
      image: `${websiteKey(url)}.jpg`,
      sha256: createHash('sha256').update(image).digest('hex'),
      width,
      height
    },
    image
  };
}

// Headless Chromium through Playwright. Returns null when Chromium is not installed, so the collector
// skips screenshots instead of failing (`npx playwright install chromium` installs it).
export async function defaultCapturer(): Promise<Capturer | null> {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch().catch(() => null);
  if (!browser) return null;
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce'
  });
  await context.route(analytics, (route) => route.abort());
  return {
    async capture(url) {
      const page = await context.newPage();
      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
        if (!response?.ok()) throw new Error(`${response?.status() ?? 'No response'} for ${url}`);
        if (!/^text\/html/.test(response.headers()['content-type'] ?? '')) throw new Error(`${url} is not a web page.`);
        // A lapsed domain can redirect anywhere. Only the site's own host, with or without www., is captured.
        if (!sameSite(page.url(), url)) throw new Error(`${url} redirected to another host.`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1500);
        const image = await page.screenshot({ type: 'jpeg', quality: 72 });
        return { image, ...viewport };
      } finally {
        await page.close();
      }
    },
    close: () => browser.close()
  };
}
