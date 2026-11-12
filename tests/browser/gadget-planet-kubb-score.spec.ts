import { test, expect } from '@playwright/test';
import { fitsViewport, offline, watchErrors } from './helpers';

test.beforeEach(({ page }) => offline(page));

// Planet Kubb Score's gadget reads and scores notation in the browser with the notation's own parser and scorer
// (site/js/gadgets/planet-kubb-score.js and its modules). It reaches nothing: the example game is in the script.
// The example is the friendly of July 10, 2012, which Dobbie and Jaime won by taking the king in turn 18.

test('the scorer opens on the example game and scores it', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/planet-kubb-score/');
  const gadget = page.locator('[data-kubb-score-gadget]');
  await expect(gadget).toBeVisible();
  await expect(gadget.getByRole('heading', { name: 'Score a game' })).toBeVisible();
  await expect(page.locator('.gadget-needs-script')).toBeHidden();
  await expect(gadget.getByLabel('Notation')).toHaveValue(/\[Team A "Garrick and Jamie"\]/);
  await expect(gadget.locator('[data-kubb-verdict]')).toHaveText('Valid notation: 15 headers, 18 turns.');
  await expect(gadget.locator('.kubb-result')).toHaveText(
    'Dobbie and Jaime took the king in turn 18. Garrick and Jamie threw first.'
  );
  const table = gadget.locator('.kubb-teams');
  await expect(table.locator('thead th.is-winner')).toHaveText('Dobbie and Jaime');
  await expect(table.getByRole('row', { name: /^Hits/ })).toHaveText(/Hits\s*24\s*28/);
  await expect(table.getByRole('row', { name: /^Hit rate/ })).toHaveText(/44%\s*54%/);
  await expect(table.getByRole('row', { name: /^Kings/ })).toHaveText(/Kings\s*0\s*1/);
  // The game as scored in 2012 has one baton too many in turn 10, and the replay says so.
  await expect(gadget.locator('.kubb-warnings li')).toHaveText([
    'Turn 10: Baton 4 knocks 1 field kubb, but only 0 were standing.'
  ]);
  expect(await fitsViewport(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('a line that is not notation says where, and the example comes back', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/planet-kubb-score/');
  const gadget = page.locator('[data-kubb-score-gadget]');
  const input = gadget.getByLabel('Notation');
  await expect(input).toHaveValue(/18\. d:7I/);
  const text = await input.inputValue();
  // Turn 2's last baton becomes Q, which is not a baton.
  await input.fill(text.replace('2. 1I d:- d:- d:- jf:- jf:- jf:F', '2. 1I d:- d:- d:- jf:- jf:- jf:Q'));
  const verdict = gadget.locator('[data-kubb-verdict]');
  await expect(verdict).toHaveText(/^Not valid notation\. Line 18, column 32: /);
  await expect(verdict).toHaveClass(/is-invalid/);
  await expect(gadget.locator('[data-kubb-where]')).toBeVisible();
  await expect(gadget.locator('[data-kubb-where]')).toContainText('2. 1I d:- d:- d:- jf:- jf:- jf:Q');
  await expect(gadget.locator('.kubb-teams')).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);

  // Valid notation that does not add up is scored, with what the replay found.
  await input.fill('[Team A "One"]\n[Team B "Two"]\n\n1. 0I - - - - - F');
  await expect(verdict).toHaveText('Valid notation: 2 headers, 1 turn.');
  await expect(gadget.locator('.kubb-result')).toHaveText(/^No winner yet\./);
  await expect(gadget.locator('.kubb-warnings')).toContainText('The turns never finish the game');

  await gadget.getByRole('button', { name: 'Put the example back' }).click();
  await expect(verdict).toHaveText('Valid notation: 15 headers, 18 turns.');
  await expect(gadget.locator('[data-kubb-where]')).toBeHidden();
  expect(errors).toEqual([]);
});
