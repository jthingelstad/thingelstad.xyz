import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// The nnxyz Rooms' gadget replays one drawing from the gallery in the browser (site/js/gadgets/nnxyz.js). Tests never
// reach the gallery: blocked, the gadget names the drawing, links to it and says the file could not be read; answered
// here with a small drawing, it shows it finished under reduced motion, replays it when asked, keeps the file to its
// drawing, and fetches another when asked.
const gallery = 'https://nnxyz.thingelstad.xyz';
const drawing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="test drawing" onload="window.ran = true">
<title>test drawing</title>
<script>window.ran = true</script>
<g fill="none" stroke-linecap="round">
<path data-stroke="1" stroke="rgb(249,249,250)" stroke-width="200" d="M 0 0 L 100 100"/>
<path data-stroke="2" stroke="rgb(20,20,20)" stroke-width="4" d="M 10 10 L 90 10 L 90 90" onclick="window.ran = true"/>
<path data-stroke="3" stroke="rgb(200,40,40)" stroke-width="6" d="M 10 90 Q 50 20 90 90"/>
<a href="https://example.com/"><path d="M 0 0 L 1 1"/></a>
</g>
</svg>`;

test('the drawing gadget names a drawing and says so when the gallery cannot be reached', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/nnxyz/');
  const panel = page.locator('[data-ink-replay]');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-ink-title]')).toHaveAttribute('href', new RegExp(`^${gallery}/artworks/Qm\\w+/$`));
  await expect(panel.locator('[data-ink-room]')).toHaveAttribute('href', new RegExp(`^${gallery}/galleries/[\\w-]+/$`));
  await expect(panel.locator('[data-ink-status]')).toContainText('could not be read');
  await expect(panel.locator('[data-ink-play]')).toBeDisabled();
  await expect(panel.locator('[data-ink-canvas] svg')).toHaveCount(0);
  await expect(page.locator('.gadget-needs-script')).toBeHidden();
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the drawing gadget waits for the screen, shows the drawing finished under reduced motion, and replays it when asked', async ({
  page
}) => {
  const errors = watchErrors(page);
  const asked: string[] = [];
  await page.route(`${gallery}/art/display/*.svg`, (route) => {
    asked.push(new URL(route.request().url()).pathname);
    return route.fulfill({ contentType: 'image/svg+xml', body: drawing });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/things/nnxyz/');
  const panel = page.locator('[data-ink-replay]');
  const paths = panel.locator('[data-ink-canvas] path[data-stroke]');
  const play = panel.locator('[data-ink-play]');
  await expect(panel).not.toHaveAttribute('hidden');
  const title = await panel.locator('[data-ink-title]').getAttribute('href');
  // The panel sits well below the first screen, so nothing is fetched until it nears it.
  expect(await panel.evaluate((el) => el.getBoundingClientRect().top - innerHeight)).toBeGreaterThan(400);
  await page.waitForTimeout(300);
  expect(asked).toEqual([]);
  await panel.scrollIntoViewIfNeeded();
  await expect(paths).toHaveCount(3);
  expect(asked).toEqual([`/art/display/${title!.split('/').at(-2)}.svg`]);
  // Kept to drawing: the script, the handlers and the link are gone, and nothing ran.
  await expect(panel.locator('[data-ink-canvas] script, [data-ink-canvas] a')).toHaveCount(0);
  await expect(panel.locator('[data-ink-canvas] [onload], [data-ink-canvas] [onclick]')).toHaveCount(0);
  expect(await page.evaluate(() => 'ran' in window)).toBe(false);
  // Finished at once, every stroke showing.
  await expect(play).toHaveText('Replay');
  expect(
    await paths.evaluateAll((all) => all.filter((p) => (p as SVGElement).style.visibility === 'hidden').length)
  ).toBe(0);
  await expect(panel.locator('[data-ink-status]')).toHaveText('');
  // Asked, it replays from the first stroke, and can be paused.
  await panel.locator('[data-ink-speed="4"]').click();
  await expect(panel.locator('[data-ink-speed="4"]')).toHaveAttribute('aria-pressed', 'true');
  await play.click();
  await expect(play).toHaveText('Pause');
  expect(await paths.evaluateAll((all) => all.some((p) => (p as SVGElement).style.visibility === 'hidden'))).toBe(true);
  await play.click();
  await expect(play).toHaveText('Play');
  // Another drawing fetches one more file and names it.
  await panel.locator('[data-ink-another]').click();
  await expect.poll(() => asked.length).toBe(2);
  expect(asked[1]).not.toBe(asked[0]);
  await expect(panel.locator('[data-ink-title]')).not.toHaveAttribute('href', title!);
  await expect(play).toHaveText('Replay');
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('the drawing gadget replays on its own when motion is welcome', async ({ page }) => {
  const errors = watchErrors(page);
  await page.route(`${gallery}/art/display/*.svg`, (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: drawing })
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/things/nnxyz/');
  const panel = page.locator('[data-ink-replay]');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('[data-ink-play]')).toHaveText('Pause');
  await expect(panel.locator('[data-ink-canvas] path[data-stroke]')).toHaveCount(3);
  expect(errors).toEqual([]);
});
