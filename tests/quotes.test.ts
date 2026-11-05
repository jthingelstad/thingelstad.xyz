import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { splitFrontmatter } from '../collection/load';

// Every quotation of Jamie's interview sessions on the site is his words, as the transcript has them, linked to the
// question he said them in (docs/THINGY.md, "Quoting the interview"). Two forms: inline, a link whose text is the
// quotation in curly quotes; block, a blockquote whose last paragraph is the attribution link "Jamie, question N".
// An ellipsis may join parts of one answer, in order. The about page's <q> quotations are held to the same rule.

const root = join(import.meta.dirname, '..');
const link = /^(?:https:\/\/thingelstad\.xyz)?\/interviews\/session-(\d+)\/#q(\d+)$/;

// Jamie's answers by question: his paragraphs under each "### N." heading, follow-ups included, Thingy's dropped.
function answers(markdown: string) {
  const byQuestion = new Map<number, string>();
  const parts = markdown.split(/^### (\d+)\. .*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const n = Number(parts[i]);
    const paragraphs = parts[i + 1]
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(
        (p) => p && !p.startsWith('#') && !p.startsWith('**Thingy:**') && !p.startsWith('**Thingy’s correction:**')
      )
      .map((p) => p.replace(/^\*\*Jamie:\*\*\s*/, ''));
    byQuestion.set(n, normalize(paragraphs.join(' ')));
  }
  return byQuestion;
}

function normalize(text: string) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\\([*_`#[\]])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

type Quote = { file: string; question: number; session?: number; text: string };

// The quotations in one Markdown body, both forms.
function quotations(file: string, body: string): Quote[] {
  const found: Quote[] = [];
  for (const m of body.matchAll(/\[(“[^\]]*”)\]\(([^)\s]+)\)/g)) {
    const target = m[2].match(link);
    if (target) found.push({ file, question: Number(target[2]), session: Number(target[1]), text: m[1].slice(1, -1) });
  }
  // A block is a run of lines that start with ">"; a line that is only ">" separates its paragraphs.
  for (const m of body.matchAll(/(?:^>.*(?:\n|$))+/gm)) {
    const paragraphs = m[0]
      .split(/^>\s*$/m)
      .map((p) =>
        p
          .split('\n')
          .map((line) => line.replace(/^>\s?/, ''))
          .join(' ')
          .trim()
      )
      .filter(Boolean);
    const attribution = paragraphs.pop()?.match(/^\[Jamie, question (\d+)\]\(([^)\s]+)\)$/);
    assert.ok(attribution, `${file}: a blockquote ends in its attribution link\n${m[0]}`);
    const target = attribution[2].match(link);
    assert.ok(target && Number(target[2]) === Number(attribution[1]), `${file}: attribution links its question`);
    assert.ok(paragraphs.length > 0, `${file}: a blockquote has words before the attribution`);
    found.push({ file, question: Number(attribution[1]), session: Number(target[1]), text: paragraphs.join(' ') });
  }
  return found;
}

function pages(dir: string) {
  return readdirSync(join(root, dir))
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const file = `${dir}/${name}`;
      const { frontmatter, body } = splitFrontmatter(readFileSync(join(root, dir, name), 'utf8'), file);
      return { file, id: name.replace(/\.md$/, ''), data: frontmatter as Record<string, unknown>, body };
    });
}

const sessions = pages('content/interviews');
const said = new Map<number, string>();
const questionThings = new Map<number, string[]>();
const questionSession = new Map<number, number>();
for (const session of sessions) {
  const number = Number(session.id.replace('session-', ''));
  for (const [n, answer] of answers(session.body)) {
    said.set(n, answer);
    questionSession.set(n, number);
  }
  for (const q of session.data.questions as { n: number; things: string[] }[]) questionThings.set(q.n, q.things);
}
const things = pages('content/things');
const stories = pages('content/stories');

// The about page's quotations: each <q> belongs to the next question link after it.
// The site's own pages quote in <q>, each followed by a link to its question.
function pageQuotations(file: string): Quote[] {
  const html = readFileSync(join(root, file), 'utf8');
  return [...html.matchAll(/<q>([^<]*)<\/q>/g)].map((m) => {
    const question = html.slice(m.index).match(/\/interviews\/session-(\d+)\/#q(\d+)/);
    assert.ok(question, `${file}: a quotation links its question: ${m[1]}`);
    return { file, question: Number(question[2]), session: Number(question[1]), text: m[1] };
  });
}

// The line /interviews/ pulls out for each session, from its front matter.
function sessionPulls(): Quote[] {
  return sessions.flatMap((session) => {
    const lines = [session.data.pull, ...((session.data.also as unknown[]) ?? [])] as { n: number; words: string }[];
    return lines.map((pull) => ({
      file: session.file,
      question: pull.n,
      session: Number(session.id.replace('session-', '')),
      text: pull.words
    }));
  });
}

// A line a thing's page opens with: its `pull`, from a question about that thing.
function thingPulls(): (Quote & { id: string })[] {
  return things.flatMap((page) => {
    const pull = page.data.pull as { n: number; words: string } | undefined;
    return pull
      ? [
          {
            id: page.id,
            file: page.file,
            question: pull.n,
            session: questionSession.get(pull.n) ?? 0,
            text: pull.words
          }
        ]
      : [];
  });
}

test('every quotation of an interview session is what the transcript says, linked to its question', () => {
  const all = [...things, ...stories]
    .flatMap((page) => quotations(page.file, page.body))
    .concat(pageQuotations('site/about.njk'), pageQuotations('site/artifacts.njk'), sessionPulls(), thingPulls());
  assert.ok(all.length >= 60, `the site quotes the interview (${all.length} quotations)`);
  const problems: string[] = [];
  for (const quote of all) {
    const answer = said.get(quote.question);
    if (!answer) {
      problems.push(`${quote.file}: question ${quote.question} does not exist`);
      continue;
    }
    if (questionSession.get(quote.question) !== quote.session)
      problems.push(`${quote.file}: question ${quote.question} is not in session ${quote.session}`);
    let from = 0;
    for (const part of normalize(quote.text).split(/\s*(?:…|\.\.\.)\s*/)) {
      if (!part) continue;
      const at = answer.indexOf(part, from);
      if (at < from) {
        problems.push(`${quote.file}: question ${quote.question} does not say “${part}”`);
        break;
      }
      from = at + part.length;
    }
  }
  assert.deepEqual(problems, []);
});

test('a page quotes only questions that are about it', () => {
  const problems: string[] = [];
  for (const page of things) {
    for (const quote of quotations(page.file, page.body)) {
      if (!questionThings.get(quote.question)?.includes(page.id)) {
        problems.push(
          `${page.file}: question ${quote.question} does not list ${page.id} in its session's front matter`
        );
      }
    }
  }
  for (const pull of thingPulls()) {
    if (!questionThings.get(pull.question)?.includes(pull.id)) {
      problems.push(`${pull.file}: its pull, question ${pull.question}, does not list ${pull.id}`);
    }
  }
  for (const page of stories) {
    const cast = page.data.things as string[];
    for (const quote of quotations(page.file, page.body)) {
      if (!cast.some((id) => questionThings.get(quote.question)?.includes(id))) {
        problems.push(`${page.file}: question ${quote.question} is about none of the story's things`);
      }
    }
  }
  assert.deepEqual([...new Set(problems)], []);
});

test('the pages speak of Jamie in the third person outside his quotations', () => {
  const problems: string[] = [];
  for (const page of [...things, ...stories]) {
    const outside = page.body
      .replace(/\[“[^\]]*”\]\([^)]*\)/g, '')
      .replace(/^>.*$/gm, '')
      .replace(/“[^”]*”/g, '')
      .replace(/\([^)]*\)/g, (m) => (m.includes('http') ? '' : m));
    const firstPerson = outside.match(/\b(I|I’m|I’ve|I’d|I’ll|my|me|mine|myself)\b(?!-\d)/g);
    if (firstPerson) problems.push(`${page.file}: ${firstPerson.join(', ')}`);
  }
  assert.deepEqual(problems, []);
});

// Front matter is page text too: summaries, connection details, story introductions and engineering lines, bundle
// and artifact titles and captions, and the ledger's titles and summaries are in Thingy's voice, the third person
// about Jamie (docs/THINGY.md, "Where Thingy says “I”"). Left out: addresses and file names, which are not prose;
// ids, which anchors keep even when the title changes; a thing's story.questions, which are a reader's; and the
// site's own name, Things I’ve built, which is Jamie's.
const notProse = new Set(['url', 'source', 'repository', 'path', 'sitemap', 'feed', 'file', 'preview', 'id', 'bundle']);

function strings(value: unknown, path: string, out: { path: string; text: string }[]) {
  if (typeof value === 'string') out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((item, i) => strings(item, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (notProse.has(key) || key === 'sources' || `${path}.${key}` === '.story.questions') continue;
      strings(item, `${path}.${key}`, out);
    }
  }
  return out;
}

function firstPerson(text: string) {
  const outside = text
    .replace(/Things I’ve built/gi, '')
    .replace(/“[^”]*”/g, '')
    .replace(/"[^"]*"/g, '');
  return outside.match(/\b(I|I’m|I’ve|I’d|I’ll|[Mm]y|[Mm]e|[Mm]ine|[Mm]yself)\b(?!-\d)/g);
}

test('front matter speaks of Jamie in the third person outside his quotations', () => {
  const problems: string[] = [];
  for (const page of [...things, ...stories]) {
    for (const { path, text } of strings(page.data, '', [])) {
      if (path === '.pull.words') continue; // his quotation, held to the transcript above
      const found = firstPerson(text);
      if (found) problems.push(`${page.file} ${path.slice(1)}: ${found.join(', ')}`);
    }
  }
  for (const name of readdirSync(join(root, 'content/history')).filter((n) => n.endsWith('.yaml'))) {
    const events = parse(readFileSync(join(root, 'content/history', name), 'utf8')) as Record<string, unknown>[];
    events.forEach((event, i) => {
      for (const { path, text } of strings(event, '', [])) {
        const found = firstPerson(text);
        if (found) problems.push(`content/history/${name} [${i}]${path}: ${found.join(', ')}`);
      }
    });
  }
  assert.deepEqual(problems, []);
});
