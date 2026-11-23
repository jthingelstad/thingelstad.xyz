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

// Planet Kubb Notation 2 (pk-kubb-score v2-2026.11): position lines under a turn line and rule headers. The game is
// the one its description (docs/notation-2.md) opens with, which is also in the canonical form.
const notation2 = `[Notation "2"]
[Opening "2-4-6"]
[Team A "Ringers"]
[Team B "Kubbitz"]

1. j:B m:-
2. k:I k:F s:B s:B k:-
@a 2,1
3. j:3I j:2F m:F j:B m:- j:- m:-
@b 3,1 2x4,0
4. k:4IRP s:2F k:F s:- k:- s:- k:-
@a 2x3,0 4,1 1,3p
5. j:3I A j:3F m:B j:B m:B j:- m:K
@a 4,1s
`;

test('a notation 2 game with position lines and rule headers is read and scored', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/things/planet-kubb-score/');
  const gadget = page.locator('[data-kubb-score-gadget]');
  const input = gadget.getByLabel('Notation');
  const verdict = gadget.locator('[data-kubb-verdict]');
  await expect(verdict).toHaveText('Valid notation: 15 headers, 18 turns.');

  await input.fill(notation2);
  await expect(verdict).toHaveText('Valid notation: 4 headers, 5 turns.');
  await expect(verdict).toHaveClass(/is-valid/);
  await expect(gadget.locator('.kubb-result')).toHaveText(
    'Ringers took the king in turn 5. Ringers threw first, assumed until a First header says otherwise.'
  );
  const table = gadget.locator('.kubb-teams');
  await expect(table.locator('thead th.is-winner')).toHaveText('Ringers');
  await expect(table.getByRole('row', { name: /^Batons thrown/ })).toHaveText(/Batons thrown\s*14\s*10/);
  await expect(table.getByRole('row', { name: /^Hits/ })).toHaveText(/Hits\s*9\s*5/);
  await expect(table.getByRole('row', { name: /^Kings/ })).toHaveText(/Kings\s*1\s*0/);
  // Every position line agrees with the count, so the replay finds nothing.
  await expect(gadget.locator('.kubb-warnings')).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);

  // A pitch line with a kubb the count does not have is valid notation, and the replay says so.
  await input.fill(notation2.replace('@a 2,1\n', '@a 2,1 3,1\n'));
  await expect(verdict).toHaveText('Valid notation: 4 headers, 5 turns.');
  await expect(gadget.locator('.kubb-warnings li')).toHaveText([
    'Turn 2: The pitch line @a has 2 kubbs, and 1 field kubb stands in that half.'
  ]);

  // A position line that mixes cells and points is not notation; the grammar names the line.
  await input.fill(notation2.replace('@a 2,1\n', '@a 2,1 3.10,1.00\n'));
  await expect(verdict).toHaveText(
    'Not valid notation. Line 8, column 1: A position line is all cells or all points, not a mix.'
  );
  await expect(gadget.locator('[data-kubb-where]')).toContainText('@a 2,1 3.10,1.00');
  await expect(gadget.locator('.kubb-teams')).toHaveCount(0);

  // A later notation is refused, never misread as this one.
  await input.fill(notation2.replace('[Notation "2"]', '[Notation "3"]'));
  await expect(verdict).toHaveText(
    'Not valid notation. Line 1, column 1: This grammar reads notation 1 and 2, and the file says notation 3.'
  );

  // A rule header changes what the replay expects: three base kubbs a side, so the king may fall after three.
  await input.fill('[Team A "One"]\n[Team B "Two"]\n\n1. B B B K');
  await expect(gadget.locator('.kubb-warnings li')).toHaveText(['Turn 1: King taken with 2 kubbs still standing.']);
  await input.fill('[Base kubbs "3"]\n[Team A "One"]\n[Team B "Two"]\n\n1. B B B K');
  await expect(verdict).toHaveText('Valid notation: 3 headers, 1 turn.');
  await expect(gadget.locator('.kubb-result')).toHaveText(/^One took the king in turn 1\./);
  await expect(gadget.locator('.kubb-warnings')).toHaveCount(0);
  expect(errors).toEqual([]);
});
