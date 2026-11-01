import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { splitFrontmatter } from '../collection/load';

// Every quotation of Jamie's interview on the site is his words, verbatim, linked to the question he said them in
// (docs/THINGY.md, "Quoting the interview"). Two forms: inline, a link whose text is the quotation in curly quotes;
// block, a blockquote whose last paragraph is the attribution link "Jamie, question N". An ellipsis may join parts
// of one answer, in order.

const root = join(import.meta.dirname, '..');
const interviewId = 'jamie-october-2026';
const link = new RegExp(`^(?:https://thingelstad\\.xyz)?/interviews/${interviewId}/#q(\\d+)$`);

// Jamie's answers by question: his paragraphs under each "### N." heading, follow-ups included, Thingy's dropped.
function answers(markdown: string) {
  const byQuestion = new Map<number, string>();
  const parts = markdown.split(/^### (\d+)\. .*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const n = Number(parts[i]);
    const paragraphs = parts[i + 1]
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith('#') && !p.startsWith('**Thingy:**'))
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

type Quote = { file: string; question: number; text: string };

// The quotations in one Markdown body, both forms.
function quotations(file: string, body: string): Quote[] {
  const found: Quote[] = [];
  for (const m of body.matchAll(/\[(“[^\]]*”)\]\(([^)\s]+)\)/g)) {
    const target = m[2].match(link);
    if (target) found.push({ file, question: Number(target[1]), text: m[1].slice(1, -1) });
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
    assert.ok(target && Number(target[1]) === Number(attribution[1]), `${file}: attribution links its question`);
    assert.ok(paragraphs.length > 0, `${file}: a blockquote has words before the attribution`);
    found.push({ file, question: Number(attribution[1]), text: paragraphs.join(' ') });
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

const transcript = splitFrontmatter(
  readFileSync(join(root, 'content/interviews', `${interviewId}.md`), 'utf8'),
  `content/interviews/${interviewId}.md`
);
const transcriptData = transcript.frontmatter as { questions: { n: number; things: string[] }[] };
const said = answers(transcript.body);
const questionThings = new Map<number, string[]>(transcriptData.questions.map((q) => [q.n, q.things]));
const things = pages('content/things');
const stories = pages('content/stories');

test('every quotation of the interview is verbatim and linked to the question it came from', () => {
  const all = [...things, ...stories].flatMap((page) => quotations(page.file, page.body));
  assert.ok(all.length >= 60, `the site quotes the interview (${all.length} quotations)`);
  const problems: string[] = [];
  for (const quote of all) {
    const answer = said.get(quote.question);
    if (!answer) {
      problems.push(`${quote.file}: question ${quote.question} does not exist`);
      continue;
    }
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
          `${page.file}: question ${quote.question} does not list ${page.id} in the interview's front matter`
        );
      }
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
