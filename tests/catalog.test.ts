import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, entryById, projects, searchProjects } from '../src/data/projects';
import { connections, graphPositions, neighbors } from '../src/data/connections';
import { validateGuideResult, validateRequest } from '../server/validation';
import { versionNumber } from '../src/lib/version';

test('all public stories and connections resolve to unique catalog entries', () => {
  assert.equal(entryById.size, catalog.length);
  for (const project of projects) {
    assert.ok(entryById.has(project.id));
    for (const id of project.related) assert.ok(entryById.has(id), id);
  }
  for (const edge of connections) {
    assert.ok(entryById.has(edge.from), edge.from);
    assert.ok(entryById.has(edge.to), edge.to);
    assert.ok(graphPositions[edge.from]);
    assert.ok(graphPositions[edge.to]);
    assert.match(edge.source, /^https:\/\//);
  }
  for (const id of Object.keys(graphPositions)) assert.ok(entryById.has(id), id);
  assert.equal(Object.keys(graphPositions).length, catalog.length);
  assert.ok(neighbors('librarian').includes('weekly-thing'));
  assert.ok(neighbors('weekly-thing').includes('librarian'));
  assert.doesNotMatch(JSON.stringify(catalog), /\/Users\/|credential|localhost|127\.0\.0\.1/);
});

test('search includes technical tags and supports the empty collection', () => {
  assert.ok(searchProjects('Python').some((p) => p.id === 'mb'));
  assert.equal(searchProjects('').length, catalog.length);
  assert.equal(searchProjects('an impossible nonexistent project').length, 0);
});

test('AI responses reject unknown project IDs and oversized explanations', () => {
  const valid = { message: 'A connection.', projectIds: ['mb', 'mb'], suggestions: ['How does it work?'] };
  assert.deepEqual(validateGuideResult(valid).projectIds, ['mb']);
  assert.throws(() => validateGuideResult({ ...valid, projectIds: ['invented-project'] }));
  assert.throws(() => validateGuideResult({ ...valid, message: 'a'.repeat(2201) }));
  assert.throws(() => validateGuideResult({ ...valid, suggestions: ['a'.repeat(121)] }));
  assert.throws(() => validateRequest({ question: ' ' }));
  const request = validateRequest({
    question: '  Show mb  ',
    contextId: 'unknown',
    history: Array(8).fill({ question: 'q', answer: 'a' })
  });
  assert.equal(request.question, 'Show mb');
  assert.equal(request.contextId, null);
  assert.equal(request.history.length, 4);
});

test('birthday arithmetic handles anniversaries, leap birthdays, and invalid dates', () => {
  assert.equal(versionNumber('1974-01-15', '2026-10-13'), '5.2.271');
  assert.equal(versionNumber('1974-01-15', '2026-01-15'), '5.2.0');
  assert.equal(versionNumber('2000-02-29', '2025-02-28'), '2.4.365');
  assert.equal(versionNumber('2000-02-29', '2025-03-01'), '2.5.0');
  assert.equal(versionNumber('2026-10-14', '2026-10-13'), null);
  assert.equal(versionNumber('2025-02-30', '2026-10-13'), null);
  assert.equal(versionNumber('2000-01-01', '2025-02-30'), null);
});
