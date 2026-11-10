// Screenshot observations: each website thing's own page (a front page, or the page inside a site where
// the thing lives), as a 1280×800 JPEG, so a thing page shows what it looks like. A capture is refreshed once
// it is four weeks old, which keeps the repository's growth to about one image per page per month; git
// history keeps the earlier ones.
//
// Captures block analytics, so taking one never counts as a visit to the site.
//
// A thing whose site is gone is shot from the capture its record pins in the Internet Archive instead
// (`observeArchiveScreenshot`), once: a capture never changes, so it is never retaken.
import { createHash } from 'node:crypto';
import type { ScreenshotObservation } from '../schema';
import { websiteKey } from '../schema';
import { captureLink, capturedUrl, pinnedCapture, servedCapture, timestampMs } from './wayback';

// `url` is the address the page ended on, after any redirects. `styled` is false when the page links stylesheets of
// its own and none of them loaded, as when the Archive never kept them.
type Capture = { image: Uint8Array; width: number; height: number; url?: string; styled?: boolean };
export type Capturer = { capture(url: string): Promise<Capture>; close(): Promise<void> };

const viewport = { width: 1280, height: 800 };
// A capture is due when it is at least this old. Weekly runs drift by hours, so 27 days makes the
// fourth weekly run after a capture the one that refreshes it.
const refreshAfterDays = 27;
// Old pages carry old trackers, which an archived page loads from the Archive under their own address; those are
// blocked too (`capturedUrl` unwraps them).
const analytics =
  /^https?:\/\/([a-z0-9-]+\.)*(tinylytics\.app|google-analytics\.com|googletagmanager\.com|plausible\.io|statcounter\.com|quantserve\.com|scorecardresearch\.com|getclicky\.com|woopra\.com|mixpanel\.com|doubleclick\.net)(:\d+)?\//;
const blocked = (url: string) => analytics.test(url) || analytics.test(capturedUrl(url));
// A page played back from the Archive loads nothing from the live web: a live host may belong to someone else now.
const archiveHosts = new Set(['web.archive.org', 'web-static.archive.org']);
const sameSite = (a: string, b: string) =>
  new URL(a).hostname.replace(/^www\./, '') === new URL(b).hostname.replace(/^www\./, '');
// How far the capture the Archive serves may be from the pinned one. It redirects to the nearest capture it has;
// a pin chosen from the CDX list lands on itself, so a month apart means the pinned capture is not there.
export const archiveToleranceDays = 30;

export function screenshotDue(previous: ScreenshotObservation | undefined, now: Date) {
  if (previous?.wayback) return false;
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

// The pinned capture, shot without the Archive's toolbar. The observation keeps the Wayback link as its URL, so it
// stays with the source that pins it, and records the capture the Archive served.
export async function observeArchiveScreenshot(
  url: string,
  capturer: Capturer,
  now = new Date()
): Promise<{ observation: ScreenshotObservation; image: Uint8Array }> {
  const pinned = pinnedCapture(url);
  if (!pinned) throw new Error(`${url} is not a pinned Internet Archive capture.`);
  const shot = captureLink(pinned.timestamp, pinned.original, 'if_');
  const { image, width, height, url: landed = shot, styled = true } = await capturer.capture(shot);
  // An old page without its stylesheets is a page of bare links, not a picture of how the site looked.
  if (!styled) throw new Error(`The Internet Archive kept no stylesheet for ${url}.`);
  const served = servedCapture(landed);
  if (!served) throw new Error(`${url} did not land on an Internet Archive capture.`);
  if (!sameSite(served.original, pinned.original)) throw new Error(`${url} landed on a capture of another host.`);
  if (Math.abs(timestampMs(served.timestamp) - timestampMs(pinned.timestamp)) > archiveToleranceDays * 86_400_000)
    throw new Error(`The Internet Archive served ${served.timestamp} for ${url}, too far from the pinned capture.`);
  return {
    observation: {
      kind: 'screenshot',
      url,
      observedAt: now.toISOString(),
      image: `${websiteKey(url)}.jpg`,
      sha256: createHash('sha256').update(image).digest('hex'),
      width,
      height,
      wayback: served
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
  await context.route(
    (address) => blocked(address.href),
    (route) => route.abort()
  );
  return {
    async capture(url) {
      const page = await context.newPage();
      const archived = new URL(url).hostname === 'web.archive.org';
      if (archived)
        await page.route('**/*', (route) => {
          const request = route.request().url();
          return archiveHosts.has(new URL(request).hostname) && !blocked(request) ? route.fallback() : route.abort();
        });
      // How each stylesheet the page asked for ended: loaded, or not (missing from the Archive, blocked, failed).
      // Read from the requests, since a stylesheet that never loaded leaves nothing in the page to inspect. The
      // Archive's own playback styles are not the page's.
      const sheets: boolean[] = [];
      const own = (address: string) => new URL(address).hostname !== 'web-static.archive.org';
      page.on('response', (answer) => {
        const status = answer.status();
        if (answer.request().resourceType() === 'stylesheet' && own(answer.url()) && (status < 300 || status >= 400))
          sheets.push(answer.ok());
      });
      page.on('requestfailed', (request) => {
        if (request.resourceType() === 'stylesheet' && own(request.url())) sheets.push(false);
      });
      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: archived ? 90_000 : 30_000 });
        if (!response?.ok()) throw new Error(`${response?.status() ?? 'No response'} for ${url}`);
        if (!/^text\/html/.test(response.headers()['content-type'] ?? '')) throw new Error(`${url} is not a web page.`);
        // A lapsed domain can redirect anywhere. Only the site's own host, with or without www., is captured.
        if (!sameSite(page.url(), url)) throw new Error(`${url} redirected to another host.`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1500);
        // A page that asked for stylesheets and got none of them is unstyled; one that asked for none is as it was.
        const styled = sheets.length === 0 || sheets.some(Boolean);
        const image = await page.screenshot({ type: 'jpeg', quality: 72 });
        return { image, ...viewport, url: page.url(), styled };
      } finally {
        await page.close();
      }
    },
    close: () => browser.close()
  };
}
