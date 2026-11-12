// The model as records: the Markdown twins, llms.txt and things.json, which is what Librarian ingests.
import { stringify } from 'yaml';
import {
  siteUrl,
  type SiteArtifact,
  type SiteBundle,
  type SiteInterview,
  type SiteModel,
  type SiteThing
} from './site';

// The artifact as its record has it, with its address: what the Markdown twin and things.json carry.
const artifactRecord = ({ src, anchor: _a, kind: _k, bytes: _b, size: _s, image: _i, ...artifact }: SiteArtifact) => ({
  ...artifact,
  url: `${siteUrl}${src}`
});
const bundleRecord = ({ artifacts: _a, cardWidth: _w, ...bundle }: SiteBundle) => bundle;

// The Markdown twin of a thing: the registry record as it is written, plus its canonical page.
export function thingMarkdown(thing: SiteThing) {
  const frontmatter: Record<string, unknown> = {
    id: thing.id,
    title: thing.title,
    summary: thing.summary,
    collection: thing.collection,
    status: thing.status,
    url: thing.url,
    ...(thing.started ? { started: thing.started } : {}),
    ...(thing.ended ? { ended: thing.ended } : {}),
    topics: thing.topics,
    sources: thing.sources.map(
      ({ observation: _o, captures: _c, views: _v, screenshot: _s, evidence: _e, ...source }) => source
    ),
    connections: thing.connections,
    ...(thing.story ? { story: thing.story } : {}),
    ...(thing.bundles.length ? { bundles: thing.bundles.map(bundleRecord) } : {}),
    ...(thing.artifacts.length ? { artifacts: thing.artifacts.map(artifactRecord) } : {}),
    ...(thing.gadget ? { gadget: thing.gadget } : {}),
    page: `${siteUrl}${thing.page}`
  };
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  const body = thing.body.trim();
  return `---\n${yaml}\n---\n\n# ${thing.title}\n\n${thing.summary}\n${body ? `\n${body}\n` : ''}`;
}

// llms.txt (llmstxt.org) as its reference parser reads it: prose only above the first `##`, and under each heading
// nothing but `- [name](url): notes` lines, one link each. The parser fails on a line under a heading that has no
// link, and keeps only the first of two, so a name never carries a bracket (tests/llms-shape.ts guards the shape).
const llmsName = (name: string) => name.replaceAll('[', '(').replaceAll(']', ')');

export function llmsText(model: SiteModel) {
  const thingLine = (thing: SiteThing) =>
    `- [${llmsName(thing.title)}](${model.url}${thing.markdown}): ${thing.summary}`;
  const lines = [
    `# ${model.title}`,
    '',
    `> ${model.description}`,
    '',
    `Every thing has a Markdown twin at /things/<id>.md. The whole registry with the latest observation for each source is ${model.url}/things.json. The history ledger is ${model.url}/feed.json. Status is a decision; activity is evidence.`,
    '',
    ...(model.featured.length
      ? [
          'Featured is the short list of things Jamie most wants you to see right now, in the order the front page shows them.',
          '',
          '## Featured',
          '',
          ...model.featured.map(({ thing }) => thingLine(thing)),
          ''
        ]
      : []),
    '## Things',
    '',
    ...model.things.map(thingLine),
    '',
    '## Topics',
    '',
    ...model.topics.map((topic) => `- [${llmsName(topic.title)}](${model.url}${topic.page}): ${topic.description}`),
    '',
    ...(model.stories.length
      ? [
          '## Stories',
          '',
          ...model.stories.map((story) => `- [${llmsName(story.title)}](${model.url}${story.page}): ${story.summary}`),
          ''
        ]
      : []),
    ...(model.interviews.length
      ? [
          '## Interviews',
          '',
          ...model.interviews.map((item) => `- [${llmsName(item.name)}](${model.url}${item.page}): ${item.point}`),
          ''
        ]
      : []),
    '## Optional',
    '',
    `- [Years](${model.url}/years/): every year, with what started and ended, its sourced events, and the commits and publications behind them; ${model.url}/activity.xml has one item a day`,
    `- [Artifacts](${model.url}/artifacts/): the sketches, screenshots and files kept from the building`,
    `- [Full text](${model.url}/llms-full.txt): every thing's record and story in one file`,
    `- [About](${model.url}/about/): what this site is, how it is kept, and who writes it`,
    ''
  ];
  return lines.join('\n');
}
export function llmsFullText(model: SiteModel) {
  return [`# ${model.title}\n\n${model.description}\n`, ...model.things.map(thingMarkdown)].join('\n---\n\n');
}

// The ingestion surface for Librarian: the registry plus the latest observation for every source.
export function thingsJson(model: SiteModel) {
  return {
    site: model.url,
    generated: model.generated,
    featured: model.featured.map(({ thing }) => thing.id), // the front page's shelf, in its order
    things: model.things.map((thing) => ({
      id: thing.id,
      title: thing.title,
      summary: thing.summary,
      collection: thing.collection,
      status: thing.status,
      url: thing.url,
      ...(thing.started ? { started: thing.started } : {}),
      ...(thing.ended ? { ended: thing.ended } : {}),
      page: `${model.url}${thing.page}`,
      markdown: `${model.url}${thing.markdown}`,
      topics: thing.topics,
      sources: thing.sources.map(({ evidence: _e, screenshot: _s, ...source }) => source),
      connections: thing.connections,
      ...(thing.screenshot
        ? {
            screenshot: {
              url: `${model.url}${thing.screenshot.src}`,
              site: thing.screenshot.site,
              date: thing.screenshot.date,
              ...(thing.screenshot.wayback ? { wayback: thing.screenshot.wayback } : {})
            }
          }
        : {}),
      ...(thing.story ? { story: thing.story } : {}),
      ...(thing.interviews.length
        ? { interviews: thing.interviews.map(({ id, questions }) => ({ id, questions })) }
        : {}),
      ...(thing.bundles.length ? { bundles: thing.bundles.map(bundleRecord) } : {}),
      ...(thing.artifacts.length
        ? {
            artifacts: thing.artifacts.map((artifact) => ({
              ...artifactRecord(artifact),
              kind: artifact.kind,
              bytes: artifact.bytes
            }))
          }
        : {}),
      ...(thing.gadget ? { gadget: thing.gadget } : {}),
      body: thing.body.trim(),
      latest: thing.latest
    })),
    topics: model.topics.map(({ things, ...topic }) => ({ ...topic, things: things.map((t) => t.id) })),
    stories: model.stories.map(({ events, ...story }) => ({
      ...story,
      cast: undefined,
      latest: undefined,
      page: `${model.url}${story.page}`,
      body: story.body.trim(),
      events: events.map((event) => event.id)
    })),
    interviews: model.interviews.map(({ cast: _c, previous: _p, next: _n, name: _name, ...item }) => ({
      ...item,
      page: `${model.url}${item.page}`,
      markdown: `${model.url}${item.markdown}`,
      questions: item.questions.map((q) => ({
        n: q.n,
        title: q.title,
        question: q.question,
        url: `${model.url}${item.page}#q${q.n}`,
        things: q.things.map((thing) => thing.id)
      })),
      body: item.body.trim()
    })),
    history: model.history
  };
}

// A session as Markdown, at /interviews/session-N.md: its front matter and the transcript as it is kept.
export function sessionMarkdown(item: SiteInterview) {
  const frontmatter = {
    session: item.session,
    title: item.title,
    point: item.point,
    pull: item.pull,
    also: item.also,
    started: item.started,
    ended: item.ended,
    notes: item.notes,
    questions: item.questions.map((q) => ({ n: q.n, title: q.title, things: q.things.map((thing) => thing.id) }))
  };
  return `---\n${stringify(frontmatter, { lineWidth: 0 })}---\n\n# ${item.name}\n\n${item.body.trim()}\n`;
}
