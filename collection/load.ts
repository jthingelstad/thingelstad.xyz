import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { artifactMaxBytes, imageSize, isImage } from './artifacts';
import type { ArtifactFile, Registry, Thing } from './schema';
import { checkReferences, ContentError, featuredEntry, historyEvent, storyline, thing, topic } from './validate';

const contentRoot = 'content';

// Front matter is the YAML between the first two `---` lines; the body is Markdown.
export function splitFrontmatter(text: string, where: string): { frontmatter: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!match) throw new ContentError(where, 'Expected YAML front matter between --- lines.');
  return { frontmatter: parse(match[1]) ?? {}, body: match[2] };
}
export async function loadRegistry(root = contentRoot): Promise<Registry> {
  const thingsDirectory = join(root, 'things');
  const thingFiles = (await readdir(thingsDirectory)).filter((name) => name.endsWith('.md')).sort();
  const things = await Promise.all(
    thingFiles.map(async (name) => {
      const where = `things/${name}`;
      const { frontmatter, body } = splitFrontmatter(await readFile(join(thingsDirectory, name), 'utf8'), where);
      return thing(basename(name, '.md'), frontmatter, body, where);
    })
  );
  const topicsRaw = parse(await readFile(join(root, 'topics.yaml'), 'utf8'));
  if (!Array.isArray(topicsRaw)) throw new ContentError('topics.yaml', 'Expected a list of topics.');
  const topics = topicsRaw.map((item, index) => topic(item, `topics.yaml[${index}]`));
  const featuredRaw = parse(await readFile(join(root, 'featured.yaml'), 'utf8')) ?? [];
  if (!Array.isArray(featuredRaw)) throw new ContentError('featured.yaml', 'Expected a list of things.');
  const featured = featuredRaw.map((item, index) => featuredEntry(item, `featured.yaml[${index}]`));
  const storiesDirectory = join(root, 'stories');
  const storyFiles = existsSync(storiesDirectory)
    ? (await readdir(storiesDirectory)).filter((name) => name.endsWith('.md')).sort()
    : [];
  const stories = await Promise.all(
    storyFiles.map(async (name) => {
      const where = `stories/${name}`;
      const { frontmatter, body } = splitFrontmatter(await readFile(join(storiesDirectory, name), 'utf8'), where);
      return storyline(basename(name, '.md'), frontmatter, body, where);
    })
  );
  const historyDirectory = join(root, 'history');
  const historyFiles = (await readdir(historyDirectory)).filter((name) => /^\d{4}\.yaml$/.test(name)).sort();
  const history = (
    await Promise.all(
      historyFiles.map(async (name) => {
        const raw = parse(await readFile(join(historyDirectory, name), 'utf8')) ?? [];
        if (!Array.isArray(raw)) throw new ContentError(`history/${name}`, 'Expected a list of events.');
        return raw.map((item, index) => {
          const event = historyEvent(item, `history/${name}[${index}]`);
          if (!event.date.startsWith(basename(name, '.yaml')))
            throw new ContentError(
              `history/${name}[${index}]`,
              `Event ${event.id} belongs in ${event.date.slice(0, 4)}.yaml.`
            );
          return event;
        });
      })
    )
  )
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return {
    ...checkReferences({ things, topics, history, featured, stories }),
    artifactFiles: await measureArtifacts(root, things)
  };
}

// content/artifacts/ holds one folder per thing that lists artifacts, and each folder holds exactly the files
// its record names: an unlisted file would be published without a word about it, and a listed one that is
// missing would be a broken link. Files whose names start with a dot (.DS_Store) are the Finder's, not
// artifacts, and are neither checked nor published.
export async function measureArtifacts(root: string, things: Thing[]): Promise<Map<string, ArtifactFile>> {
  const directory = join(root, 'artifacts');
  const listing = new Map(things.filter((t) => t.artifacts).map((t) => [t.id, t.artifacts!]));
  const folders = existsSync(directory) ? await readdir(directory, { withFileTypes: true }) : [];
  for (const folder of folders.filter((entry) => !entry.name.startsWith('.'))) {
    const where = `artifacts/${folder.name}`;
    if (!folder.isDirectory())
      throw new ContentError(where, 'Keep each thing’s artifacts in a folder named by its id.');
    if (!listing.has(folder.name)) throw new ContentError(where, `No thing lists artifacts in this folder.`);
  }
  const files = new Map<string, ArtifactFile>();
  for (const [id, artifacts] of listing) {
    const folder = join(directory, id);
    const where = `artifacts/${id}`;
    const named = artifacts.flatMap((a) => (a.preview ? [a.file, a.preview] : [a.file]));
    if (!existsSync(folder))
      throw new ContentError(where, `things/${id}.md lists artifacts, but the folder is missing.`);
    const present = (await readdir(folder, { withFileTypes: true })).filter((entry) => !entry.name.startsWith('.'));
    for (const entry of present)
      if (!named.includes(entry.name))
        throw new ContentError(`${where}/${entry.name}`, `Not listed in things/${id}.md.`);
    for (const name of named) {
      const entry = present.find((e) => e.name === name);
      if (!entry) throw new ContentError(`${where}/${name}`, 'Listed, but not in the folder.');
      if (!entry.isFile()) throw new ContentError(`${where}/${name}`, 'Expected a file, not a folder or a link.');
      const path = join(folder, name);
      const { size } = await stat(path);
      if (!size || size > artifactMaxBytes)
        throw new ContentError(`${where}/${name}`, `An artifact is between 1 byte and ${artifactMaxBytes / 1e6} MB.`);
      if (!isImage(name)) {
        files.set(`${id}/${name}`, { bytes: size });
        continue;
      }
      const dimensions = imageSize(await readFile(path));
      if (!dimensions) throw new ContentError(`${where}/${name}`, 'Not an image this site can read.');
      files.set(`${id}/${name}`, { bytes: size, ...dimensions });
    }
  }
  return files;
}
