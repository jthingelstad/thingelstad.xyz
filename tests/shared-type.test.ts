// The type Jamie's sites share (thingelstad.com AGENTS.md, "Shared type and colour"): site/css/shared/ is a
// byte-for-byte copy of thingelstad.com shared/tokens.css and shared/fonts/, vendored by npm run sites:sync.
// These tests pin the copy, how every built page loads it, the font roles and the blog's scale in site.css
// (nothing below 14px), and the rule Jamie gave on 2026-10-22: no italics in the design.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  fontsNamedBy,
  sharedTypeAssets,
  sharedTypeDir,
  sharedTypeFiles,
  vendoredFiles
} from '../collection/shared-type';

const css = readFileSync('site/css/site.css', 'utf8');
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector.trim(),
  body
}));
const declarations = (property: string) =>
  rules.flatMap((rule) =>
    [...rule.body.matchAll(new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+)`, 'g'))].map(([, value]) => ({
      selector: rule.selector,
      value: value.trim()
    }))
  );

test('the vendored type matches thingelstad.com shared/', (t) => {
  const sharedDir = dirname(process.env.SITES_SOURCE || '../thingelstad.com/shared/sites.json');
  if (!existsSync(join(sharedDir, 'tokens.css'))) {
    t.skip(`${sharedDir} is not checked out here (CI checks out only this repository); npm run sites:check covers it`);
    return;
  }
  const files = sharedTypeFiles(sharedDir);
  assert.deepEqual(vendoredFiles(), files, 'the same files, none missing and none left over');
  for (const file of files) {
    assert.ok(
      readFileSync(join(sharedDir, file)).equals(readFileSync(join(sharedTypeDir, file))),
      `${sharedTypeDir}/${file} is stale. Run npm run sites:sync.`
    );
  }
});

test('the vendored tokens set nothing below 14px, and every font they load is vendored', () => {
  const tokens = readFileSync(join(sharedTypeDir, 'tokens.css'), 'utf8');
  const sizes = [...tokens.matchAll(/--jt-size-[a-z0-9]+:\s*([\d.]+)rem/g)].map(([, rem]) => Number(rem) * 16);
  assert.ok(sizes.length >= 10);
  for (const size of sizes) assert.ok(size >= 14, `a --jt-size token is ${size}px`);
  for (const font of fontsNamedBy(tokens)) assert.ok(existsSync(join(sharedTypeDir, font)), font);
});

test('every page loads the shared type from this site, and no font host', () => {
  const out = mkdtempSync(join(tmpdir(), 'xyz-type-'));
  try {
    execFileSync(
      process.execPath,
      ['node_modules/@11ty/eleventy/cmd.cjs', '--config=site/eleventy.config.ts', `--output=${out}`, '--quiet'],
      { env: { ...process.env, NODE_OPTIONS: '--import=tsx' }, stdio: 'pipe' }
    );
    const shared = sharedTypeAssets();
    assert.match(shared.base, /^\/assets\/shared-[0-9a-f]{10}$/);
    assert.deepEqual(readdirSync(join(out, shared.base)).toSorted(), ['fonts', 'tokens.css']);
    for (const file of vendoredFiles()) {
      assert.ok(readFileSync(join(out, shared.base, file)).equals(readFileSync(join(sharedTypeDir, file))), file);
    }
    assert.ok(!existsSync(join(out, 'assets/fonts')), 'the old Inter and Fraunces files are gone');
    const pages = readdirSync(out, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.html'));
    assert.ok(pages.length > 50);
    for (const file of pages) {
      const html = readFileSync(join(out, file), 'utf8');
      const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? '';
      const preloads = [
        ...head.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin \/>/g)
      ];
      assert.deepEqual(
        preloads.map(([, href]) => href),
        shared.preloads,
        `${file}: preloads Inter and Inter Tight, latin, upright`
      );
      for (const href of shared.preloads) assert.ok(existsSync(join(out, href)), `${file}: ${href}`);
      const tokens = head.indexOf(`<link rel="stylesheet" href="${shared.tokens}" />`);
      const own = head.search(/<link rel="stylesheet" href="\/assets\/site-[0-9a-f]{10}\.css" \/>/);
      assert.ok(tokens > 0 && own > tokens, `${file}: tokens.css loads before site.css`);
      assert.doesNotMatch(
        html,
        /fonts\.googleapis|fonts\.gstatic|fonts\.bunny|rsms\.me|use\.typekit|fontsource|jsdelivr|unpkg/,
        `${file}: a font host`
      );
      // Connection diagrams carry their own sizes: 16px labels, 14px on the edges.
      for (const [, attribute, shorthand] of html.matchAll(/font-size="([\d.]+)"|font:\s*([\d.]+)px/g)) {
        const size = Number(attribute ?? shorthand);
        assert.ok(size >= 14, `${file}: an SVG font-size of ${size}`);
      }
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('site.css names faces by role and takes them from the shared tokens', () => {
  const roles = {
    '--font-heading': 'var(--jt-font-heading)',
    '--font-body': 'var(--jt-font-body)',
    '--font-ui': 'var(--jt-font-body)',
    '--font-label': 'var(--jt-font-body)',
    '--font-code': 'var(--jt-font-mono)',
    '--weight-heading': 'var(--jt-weight-heading)',
    '--frame': 'var(--jt-frame)',
    '--gutter': 'var(--jt-gutter)',
    '--measure': 'var(--jt-measure)'
  };
  for (const [name, value] of Object.entries(roles)) {
    assert.deepEqual(
      declarations(name).map((d) => d.value),
      [value],
      name
    );
  }
  assert.ok(declarations('font-size').some((d) => d.selector === 'body' && d.value === 'var(--jt-size-base)'));
  const headings = rules.find((rule) => rule.selector.split(/,\s*/).includes('h1'))!;
  assert.match(headings.body, /font-family: var\(--font-heading\);/);
  assert.match(headings.body, /font-weight: var\(--weight-heading\);/);
  assert.match(headings.body, /letter-spacing: var\(--jt-tracking-heading\);/);
  for (const { selector, value } of declarations('font-family')) {
    // The strip names Inter itself: its values are the shared contract.
    if (selector === '.sites-strip') assert.match(value, /^Inter,\s/);
    else assert.match(value, /^(var\(--font-[a-z]+\)|inherit)$/, `${selector}: font-family ${value} names a face`);
  }
  assert.doesNotMatch(css, /fraunces|font-variation-settings|--display/i, 'Fraunces and its axes are gone');
  assert.equal(declarations('font').length, 0, 'no font shorthand to hide a size or face');
});

test('nothing in site.css is set below 14px', () => {
  const px = (value: string) => {
    const match = value.match(/^([\d.]+)(px|rem)$/);
    return match ? Number(match[1]) * (match[2] === 'rem' ? 16 : 1) : null;
  };
  const sizes = declarations('font-size');
  assert.ok(sizes.length > 30);
  for (const { selector, value } of sizes) {
    if (/^var\(--jt-size-[a-z0-9]+\)$/.test(value)) continue;
    const size = px(value);
    assert.ok(size !== null, `${selector}: font-size ${value} is not px, rem or a --jt-size token`);
    assert.ok(size >= 14, `${selector}: font-size ${value} is below 14px`);
  }
});

test('no italics in the design: only content text keeps its emphasis', () => {
  // Jamie, 2026-10-22: "I really dislike italics with san serif fonts … I like the color and I like using font
  // weight with san serif". Emphasis in the design is the green or ink, and weight. Markdown emphasis in a
  // thing's story is Jamie's own text and keeps the browser's italic; nothing else may set one.
  const content = /^\.story (em|i|cite)$/;
  for (const { selector, value } of declarations('font-style')) {
    if (value === 'normal') continue;
    for (const part of selector.split(/,\s*/)) {
      assert.match(part, content, `${part}: font-style ${value} outside em, i or cite in content`);
    }
  }
  assert.ok(
    declarations('font-synthesis').some((d) => d.selector === ':root' && d.value === 'none'),
    'font-synthesis: none, so no face is slanted or bolded by the browser'
  );
  const templates = readdirSync('site', { recursive: true, encoding: 'utf8' }).filter((file) =>
    /\.(njk|11ty\.js)$/.test(file)
  );
  assert.ok(templates.length > 5);
  for (const file of templates) {
    const source = readFileSync(join('site', file), 'utf8');
    assert.doesNotMatch(source, /<(em|i|cite)[\s>]/, `${file}: a template sets emphasis that renders italic`);
    assert.doesNotMatch(source, /font-style/, `${file}: an inline font-style`);
  }
});
