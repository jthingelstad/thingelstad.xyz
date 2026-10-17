import {
  eventKinds,
  statuses,
  type Connection,
  type HistoryEvent,
  type Registry,
  type Story,
  type Thing,
  type ThingSource,
  type Topic
} from './schema';

// Validation is strict on purpose. The content tree is public, so paths, credentials, and
// private hosts are rejected here before anything is built or published.

export class ContentError extends Error {
  constructor(
    public readonly location: string,
    message: string
  ) {
    super(`${location}: ${message}`);
  }
}
type Record_ = Record<string, unknown>;
function record(value: unknown, keys: string[], where: string): Record_ {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContentError(where, 'Expected a record.');
  const result = value as Record_;
  for (const key of Object.keys(result))
    if (!keys.includes(key)) throw new ContentError(where, `Unknown field: ${key}.`);
  return result;
}
function text(value: unknown, where: string, max = 4000): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > max ||
    /\/Users\//.test(value) ||
    [...value].some((c) => c.charCodeAt(0) < 9)
  )
    throw new ContentError(where, 'Expected public text.');
  return value;
}
function optionalText(value: unknown, where: string, max = 4000): string | undefined {
  return value === undefined ? undefined : text(value, where, max);
}
function identifier(value: unknown, where: string): string {
  const id = text(value, where, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new ContentError(where, 'Use a lowercase, hyphenated ID.');
  return id;
}
function list(value: unknown, where: string, max = 500): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > max) throw new ContentError(where, 'Expected a list.');
  return value;
}
function texts(value: unknown, where: string, max = 50): string[] {
  return list(value, where, max).map((item, index) => text(item, `${where}[${index}]`, 2000));
}
function unique(values: string[], where: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new ContentError(where, `Duplicate: ${value}.`);
    seen.add(value);
  }
}
function publicUrl(value: unknown, where: string): string {
  const url = text(value, where, 2000);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ContentError(where, 'Invalid URL.');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(parsed.hostname) ||
    /\.(local|localhost|internal|test|ts\.net)$/.test(parsed.hostname) ||
    !parsed.hostname.includes('.')
  )
    throw new ContentError(where, 'Use a public HTTPS URL without credentials.');
  return url;
}
export function repositoryName(value: unknown, where: string): string {
  const name = text(value, where, 200);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || name.endsWith('.git'))
    throw new ContentError(where, 'Use owner/repository for GitHub.');
  return name;
}
export function repositoryPath(value: unknown, where: string): string {
  const path = text(value, where, 250);
  if (
    path.includes('\\') ||
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[?#]/.test(path)
  )
    throw new ContentError(where, 'Use a relative repository directory.');
  return path;
}
export function preciseDate(value: unknown, where: string): string {
  // YAML parses bare 2017 as a number and 2017-02-13 as a timestamp; both are accepted and normalised to text.
  const raw =
    typeof value === 'number' && Number.isInteger(value)
      ? String(value)
      : value instanceof Date
        ? value.toISOString().slice(0, 10)
        : value;
  const date = text(raw, where, 10);
  if (!/^\d{4}(-\d{2}){0,2}$/.test(date)) throw new ContentError(where, 'Use YYYY, YYYY-MM, or YYYY-MM-DD.');
  const padded = date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date;
  const parsed = new Date(`${padded}T12:00:00Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== padded)
    throw new ContentError(where, 'Invalid calendar date.');
  return date;
}

function source(value: unknown, where: string): ThingSource {
  const item = record(value, ['kind', 'repository', 'url', 'role', 'path', 'sitemap', 'feed'], where);
  const role = text(item.role, `${where}.role`, 100);
  if (item.kind === 'github') {
    if (item.url !== undefined || item.sitemap !== undefined || item.feed !== undefined)
      throw new ContentError(where, 'A GitHub source has only repository, role, and path.');
    const result: ThingSource = {
      kind: 'github',
      repository: repositoryName(item.repository, `${where}.repository`),
      role
    };
    if (item.path !== undefined) result.path = repositoryPath(item.path, `${where}.path`);
    return result;
  }
  if (item.kind === 'website') {
    if (item.repository !== undefined || item.path !== undefined)
      throw new ContentError(where, 'A website source has only url, role, sitemap, and feed.');
    const result: ThingSource = { kind: 'website', url: publicUrl(item.url, `${where}.url`), role };
    if (item.sitemap !== undefined) result.sitemap = publicUrl(item.sitemap, `${where}.sitemap`);
    if (item.feed !== undefined) result.feed = publicUrl(item.feed, `${where}.feed`);
    return result;
  }
  throw new ContentError(where, 'Source kind must be github or website.');
}
function connection(value: unknown, where: string): Connection {
  const item = record(value, ['to', 'label', 'detail', 'source', 'kind'], where);
  const result: Connection = {
    to: identifier(item.to, `${where}.to`),
    label: text(item.label, `${where}.label`, 160),
    detail: text(item.detail, `${where}.detail`),
    source: publicUrl(item.source, `${where}.source`)
  };
  if (item.kind !== undefined) {
    if (item.kind !== 'lineage') throw new ContentError(where, 'Connection kind must be lineage when present.');
    result.kind = 'lineage';
  }
  return result;
}
function story(value: unknown, where: string): Story {
  const item = record(
    value,
    ['color', 'introduction', 'engineering', 'stack', 'source', 'sourceLabel', 'related', 'questions', 'started'],
    where
  );
  const color = text(item.color, `${where}.color`, 7);
  if (!/^#[\da-f]{6}$/i.test(color)) throw new ContentError(where, 'Color must be a six-digit hex value.');
  const result: Story = {
    color,
    introduction: text(item.introduction, `${where}.introduction`, 1000),
    engineering: texts(item.engineering, `${where}.engineering`, 30),
    stack: texts(item.stack, `${where}.stack`, 30),
    related: list(item.related, `${where}.related`, 50).map((id, i) => identifier(id, `${where}.related[${i}]`)),
    questions: texts(item.questions, `${where}.questions`, 30)
  };
  if (item.source !== undefined) result.source = publicUrl(item.source, `${where}.source`);
  const sourceLabel = optionalText(item.sourceLabel, `${where}.sourceLabel`, 200);
  if (sourceLabel !== undefined) result.sourceLabel = sourceLabel;
  const started = optionalText(item.started, `${where}.started`, 200);
  if (started !== undefined) result.started = started;
  return result;
}

const thingFields = [
  'title',
  'summary',
  'collection',
  'status',
  'url',
  'started',
  'ended',
  'topics',
  'sources',
  'connections',
  'story'
];
export function thing(id: string, frontmatter: unknown, body: string, where: string): Thing {
  const item = record(frontmatter, thingFields, where);
  identifier(id, where);
  if (!statuses.includes(item.status as never))
    throw new ContentError(`${where}.status`, `Status must be one of ${statuses.join(', ')}.`);
  const result: Thing = {
    id,
    title: text(item.title, `${where}.title`, 160),
    summary: text(item.summary, `${where}.summary`, 1000),
    collection: text(item.collection, `${where}.collection`, 100),
    status: item.status as Thing['status'],
    url: item.url === undefined || item.url === null ? null : publicUrl(item.url, `${where}.url`),
    topics: list(item.topics, `${where}.topics`, 50).map((t, i) => identifier(t, `${where}.topics[${i}]`)),
    sources: list(item.sources, `${where}.sources`, 50).map((s, i) => source(s, `${where}.sources[${i}]`)),
    connections: list(item.connections, `${where}.connections`, 100).map((c, i) =>
      connection(c, `${where}.connections[${i}]`)
    ),
    body: body.trim()
  };
  if (item.started !== undefined) result.started = preciseDate(item.started, `${where}.started`);
  if (item.ended !== undefined) result.ended = preciseDate(item.ended, `${where}.ended`);
  if (result.started && result.ended && result.ended < result.started)
    throw new ContentError(where, 'A thing cannot end before it started.');
  if (item.story !== undefined) result.story = story(item.story, `${where}.story`);
  if (result.story && !result.body) throw new ContentError(where, 'A story needs a body: the idea behind the thing.');
  if (result.body.length > 20000) throw new ContentError(where, 'The body is too long.');
  if (/\/Users\//.test(result.body) || [...result.body].some((c) => c.charCodeAt(0) < 9))
    throw new ContentError(where, 'The body contains a local path or control characters.');
  unique(result.topics, `${where}.topics`);
  unique(
    result.sources.map((s) =>
      s.kind === 'github' ? `github:${s.repository.toLowerCase()}:${s.path ?? ''}` : `web:${s.url}`
    ),
    `${where}.sources`
  );
  unique(
    result.connections.map((c) => c.to),
    `${where}.connections`
  );
  for (const edge of result.connections)
    if (edge.to === id) throw new ContentError(`${where}.connections`, 'A connection needs two different things.');
  return result;
}
export function topic(value: unknown, where: string): Topic {
  const item = record(value, ['id', 'title', 'description'], where);
  return {
    id: identifier(item.id, `${where}.id`),
    title: text(item.title, `${where}.title`, 200),
    description: text(item.description, `${where}.description`)
  };
}
export function historyEvent(value: unknown, where: string): HistoryEvent {
  const item = record(value, ['id', 'date', 'kind', 'title', 'summary', 'source', 'things'], where);
  if (!eventKinds.includes(item.kind as never))
    throw new ContentError(`${where}.kind`, `Event kind must be one of ${eventKinds.join(', ')}.`);
  const things = list(item.things, `${where}.things`, 50).map((t, i) => identifier(t, `${where}.things[${i}]`));
  if (!things.length) throw new ContentError(where, 'An event needs at least one thing.');
  unique(things, `${where}.things`);
  return {
    id: identifier(item.id, `${where}.id`),
    date: preciseDate(item.date, `${where}.date`),
    kind: item.kind as HistoryEvent['kind'],
    title: text(item.title, `${where}.title`, 200),
    summary: text(item.summary, `${where}.summary`),
    source: publicUrl(item.source, `${where}.source`),
    things
  };
}

// Cross-record checks once every file has been read.
export function checkReferences(registry: Registry) {
  const thingIds = new Set(registry.things.map((t) => t.id));
  const topicIds = new Set(registry.topics.map((t) => t.id));
  unique([...registry.things.map((t) => t.id)], 'things');
  unique([...registry.topics.map((t) => t.id)], 'topics');
  unique(
    registry.history.map((e) => e.id),
    'history'
  );
  const reference = (id: string, where: string) => {
    if (!thingIds.has(id)) throw new ContentError(where, `Unknown thing: ${id}.`);
  };
  for (const item of registry.things) {
    const where = `things/${item.id}`;
    for (const t of item.topics)
      if (!topicIds.has(t)) throw new ContentError(`${where}.topics`, `Unknown topic: ${t}.`);
    for (const edge of item.connections) reference(edge.to, `${where}.connections`);
    for (const related of item.story?.related ?? []) reference(related, `${where}.story.related`);
  }
  for (const event of registry.history) for (const id of event.things) reference(id, `history/${event.id}`);
  return registry;
}
