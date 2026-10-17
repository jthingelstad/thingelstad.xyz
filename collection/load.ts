import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import type { Registry } from './schema';
import { checkReferences, ContentError, historyEvent, thing, topic } from './validate';

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
  return checkReferences({ things, topics, history });
}
