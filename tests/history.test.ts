import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, entryById } from '../src/data/projects';
import { connections } from '../src/data/connections';
import { topics } from '../src/data/topics';
import {
  historyEvents,
  eventsForTopic,
  eventsForProject,
  formatEventDate,
  timelineLayout,
  compactTimelineLayout
} from '../src/data/history';

test('topic and event references resolve without fabricated dates or private data', () => {
  assert.equal(new Set(topics.map((topic) => topic.id)).size, topics.length);
  assert.equal(new Set(historyEvents.map((event) => event.id)).size, historyEvents.length);
  for (const record of [...topics, ...historyEvents]) {
    assert.ok(record.projectIds.length);
    assert.equal(new Set(record.projectIds).size, record.projectIds.length);
    for (const id of record.projectIds) assert.ok(entryById.has(id), id);
  }
  for (const event of historyEvents) {
    assert.match(event.source, /^https:\/\//);
    assert.match(event.date, /^\d{4}(-\d{2})?(-\d{2})?$/);
    const fullDate =
      event.date.length === 4 ? `${event.date}-01-01` : event.date.length === 7 ? `${event.date}-01` : event.date;
    assert.equal(new Date(`${fullDate}T12:00:00Z`).toISOString().slice(0, 10), fullDate);
    assert.ok(['launch', 'milestone', 'retirement', 'archive', 'development'].includes(event.kind));
  }
  assert.doesNotMatch(JSON.stringify([topics, historyEvents]), /\/Users\/|localhost|127\.0\.0\.1/);
  assert.equal(formatEventDate('2005-02'), 'Feb 2005');
  assert.equal(formatEventDate('2012'), '2012');
  assert.equal(formatEventDate('2026-09-26'), 'Sep 26, 2026');
});

test('a cross-project event counts once and preserves overlapping interests', () => {
  const event = eventsForTopic('agents').find((item) => item.id === 'elixir-bot-retired')!;
  assert.ok(event.projectIds.includes('elixir-mcp-collector'));
  assert.equal(eventsForTopic('agents').filter((item) => item.id === event.id).length, 1);
  assert.ok(eventsForTopic('semantic-mediawiki').some((item) => item.projectIds.includes('wikiapiary')));
  assert.ok(eventsForProject('weekly-thing').some((item) => item.date === '2017-05-13'));
});

test('both timeline layouts retain every thing, chronology, and earlier milestones', () => {
  for (const layout of [timelineLayout, compactTimelineLayout]) {
    assert.equal(Object.keys(layout.positions).length, catalog.length);
    assert.equal(new Set(Object.values(layout.positions).map(String)).size, catalog.length);
    const years = layout.bands.flatMap((band) => (band.year ? [band.year] : []));
    assert.deepEqual(
      years,
      years.toSorted((a, b) => b - a)
    );
    assert.ok(years.includes(2017));
    assert.ok(layout.eventPositions['weekly-thing-one']);
    for (const [x, y] of [...Object.values(layout.positions), ...Object.values(layout.eventPositions)]) {
      assert.ok(x > 0 && x < layout.width);
      assert.ok(y > 0 && y < layout.height);
    }
    assert.equal(layout.bands.at(-1)!.year, null);
  }
  for (const id of ['elixir', 'elixir-mcp-discord', 'elixir-mcp-collector', 'elixir-clan']) {
    assert.ok(connections.some((edge) => edge.kind === 'lineage' && edge.from === 'elixir-bot' && edge.to === id));
  }
});
