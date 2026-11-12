import type { Page } from '@playwright/test';

// What every browser test shares: the page errors a visit raised, and whether the page fits its window.
export const watchErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};
export const fitsViewport = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

// A live panel's test never reaches the service its panel reads, nor analytics: the Tinylytics embed is answered
// with an empty script and every other host is refused, the way site.spec.ts does it. A test that wants the service
// routes it after this, and Playwright tries the newest route first.
export const offline = async (page: Page) => {
  await page.route('https://tinylytics.app/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route(
    (url) => url.hostname !== '127.0.0.1' && url.hostname !== 'tinylytics.app',
    (route) => route.abort('blockedbyclient')
  );
};
