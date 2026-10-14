import type { Collection } from '../src/data/schema';

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a record.');
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!keys.includes(key)) throw new Error(`Unknown field: ${key}.`);
  return record;
}
function text(value: unknown, name: string, max = 4000): asserts value is string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > max ||
    /\/Users\//.test(value) ||
    [...value].some((c) => c.charCodeAt(0) < 9)
  )
    throw new Error(`Invalid ${name}.`);
}
function id(value: unknown) {
  text(value, 'ID', 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error('Use a lowercase, hyphenated ID.');
}
function array(value: unknown, max = 500): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid list.');
  return value;
}
function unique(values: string[], name: string) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${name}.`);
}
function publicUrl(value: unknown) {
  text(value, 'public URL', 2000);
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname) ||
    /\.(local|localhost|internal|test|ts\.net)$/.test(url.hostname) ||
    !url.hostname.includes('.')
  )
    throw new Error('Use a public HTTPS URL without credentials.');
}
export function repositoryName(value: unknown): asserts value is string {
  text(value, 'GitHub repository', 200);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value) || value.endsWith('.git'))
    throw new Error('Use owner/repository for GitHub.');
}
export function repositoryPath(value: unknown) {
  text(value, 'repository path', 250);
  if (
    value.includes('\\') ||
    value.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[?#]/.test(value)
  )
    throw new Error('Use a relative repository directory.');
}
function date(value: unknown) {
  text(value, 'date', 10);
  if (!/^\d{4}(-\d{2}){0,2}$/.test(value)) throw new Error('Use YYYY, YYYY-MM, or YYYY-MM-DD.');
  const padded = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value;
  const parsed = new Date(`${padded}T12:00:00Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== padded)
    throw new Error('Invalid calendar date.');
}

export function validateCollection(value: unknown): Collection {
  const doc = object(value, ['schemaVersion', 'things', 'sources', 'connections', 'topics', 'history']);
  if (doc.schemaVersion !== 1) throw new Error('Unknown collection version.');
  const things = array(doc.things).map((item) =>
    object(item, ['id', 'title', 'summary', 'collection', 'url', 'historical', 'story', 'sources'])
  );
  const sources = array(doc.sources).map((item) =>
    object(item, ['id', 'kind', 'repository', 'url', 'sitemap', 'sourceKind'])
  );
  for (const thing of things) id(thing.id);
  for (const source of sources) id(source.id);
  const thingIds = things.map((thing) => String(thing.id));
  const sourceIds = sources.map((source) => String(source.id));
  unique(thingIds, 'thing IDs');
  unique(sourceIds, 'source IDs');
  const reference = (value: unknown, ids = thingIds) => {
    id(value);
    if (!ids.includes(String(value))) throw new Error(`Unknown reference: ${value}.`);
  };
  const sourceKeys: string[] = [];
  for (const source of sources) {
    if (source.kind === 'github') {
      repositoryName(source.repository);
      if (source.url !== undefined || source.sitemap !== undefined || source.sourceKind !== undefined)
        throw new Error('GitHub source has unexpected fields.');
      sourceKeys.push(`github:${source.repository.toLowerCase()}`);
    } else if (source.kind === 'website' || source.kind === 'archive') {
      publicUrl(source.url);
      if (source.repository !== undefined) throw new Error('Unexpected repository.');
      if (source.kind === 'website') {
        if (source.sitemap !== undefined) publicUrl(source.sitemap);
        if (source.sourceKind !== undefined) throw new Error('Unexpected archive kind.');
      } else if (
        !['blog', 'weekly_thing', 'podcast'].includes(String(source.sourceKind)) ||
        source.sitemap !== undefined
      )
        throw new Error('Invalid archive kind.');
      sourceKeys.push(`${source.kind}:${source.url}:${source.sourceKind ?? ''}`);
    } else throw new Error('Unknown source kind.');
  }
  unique(sourceKeys, 'sources');
  for (const thing of things) {
    text(thing.title, 'title', 160);
    text(thing.summary, 'summary', 1000);
    text(thing.collection, 'collection', 100);
    if (thing.url !== null) publicUrl(thing.url);
    if (typeof thing.historical !== 'boolean') throw new Error('Invalid historical status.');
    const attachments = array(thing.sources, 50).map((item) => object(item, ['sourceId', 'role', 'path']));
    for (const attachment of attachments) {
      reference(attachment.sourceId, sourceIds);
      text(attachment.role, 'source role', 100);
      if (attachment.path !== undefined) {
        repositoryPath(attachment.path);
        if (sources.find((source) => source.id === attachment.sourceId)?.kind !== 'github')
          throw new Error('Only GitHub attachments have directory scopes.');
      }
    }
    unique(
      attachments.map((a) => `${a.sourceId}:${a.path ?? ''}`),
      'source attachments'
    );
    if (thing.story !== undefined) {
      const story = object(thing.story, [
        'color',
        'introduction',
        'idea',
        'engineering',
        'stack',
        'source',
        'sourceLabel',
        'related',
        'questions',
        'started'
      ]);
      text(story.color, 'color', 7);
      if (!/^#[\da-f]{6}$/i.test(story.color)) throw new Error('Invalid color.');
      text(story.introduction, 'introduction', 1000);
      text(story.idea, 'idea');
      for (const field of ['engineering', 'stack', 'questions'])
        for (const item of array(story[field], 30)) text(item, field, 2000);
      for (const related of array(story.related, 50)) reference(related);
      if (story.source !== undefined) publicUrl(story.source);
      for (const field of ['sourceLabel', 'started']) if (story[field] !== undefined) text(story[field], field, 200);
    }
  }
  const edges = array(doc.connections, 1000).map((item) =>
    object(item, ['from', 'to', 'label', 'detail', 'source', 'kind'])
  );
  for (const edge of edges) {
    reference(edge.from);
    reference(edge.to);
    if (edge.from === edge.to) throw new Error('A connection needs two different things.');
    text(edge.label, 'relationship', 160);
    text(edge.detail, 'connection explanation');
    publicUrl(edge.source);
    if (edge.kind !== undefined && edge.kind !== 'lineage') throw new Error('Invalid connection kind.');
  }
  unique(
    edges.map((edge) => `${edge.from}:${edge.to}`),
    'connections'
  );
  const topics = array(doc.topics, 100).map((item) => object(item, ['id', 'title', 'description', 'projectIds']));
  const events = array(doc.history, 5000).map((item) =>
    object(item, ['id', 'projectIds', 'date', 'kind', 'title', 'summary', 'source'])
  );
  for (const record of [...topics, ...events]) {
    id(record.id);
    text(record.title, 'title', 200);
    const members = array(record.projectIds);
    for (const member of members) reference(member);
    unique(members.map(String), 'members');
  }
  unique(
    topics.map((t) => String(t.id)),
    'topic IDs'
  );
  unique(
    events.map((e) => String(e.id)),
    'event IDs'
  );
  for (const topic of topics) text(topic.description, 'topic description');
  for (const event of events) {
    if (!(event.projectIds as unknown[]).length) throw new Error('An event needs a thing.');
    date(event.date);
    text(event.summary, 'event summary');
    publicUrl(event.source);
    if (!['launch', 'milestone', 'retirement', 'archive', 'development'].includes(String(event.kind)))
      throw new Error('Invalid event kind.');
  }
  return value as Collection;
}
