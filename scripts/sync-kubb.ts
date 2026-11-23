// npm run kubb:sync | npm run kubb:check
// The Planet Kubb Score gadget (site/js/gadgets/planet-kubb-score.js) scores notation with the notation's own code,
// from a tagged release of the pk-kubb-score project (Planet-Kubb/pk-kubb-score, Planet Kubb Notation):
// - vendor/pk-kubb-score/planet-kubb-notation.peggy, a byte-for-byte copy of its grammar/planet-kubb-notation.peggy,
//   the definition of valid notation;
// - site/js/gadgets/planet-kubb-score/notation-parser.js, the parser Peggy generates from that copy, the same way
//   its tools/build-grammar.mjs does (an ES module exporting parse and SyntaxError, with the grammar's two start
//   rules: Game, the lenient form and the default, and CanonicalGame);
// - site/js/gadgets/planet-kubb-score/kubb.js, a byte-for-byte copy of its site/assets/kubb.js, which replays a game
//   and scores it (analyze);
// - site/js/gadgets/planet-kubb-score/example.js, the example game the gadget opens with, from its games/ folder;
// - vendor/pk-kubb-score/SOURCE, the release they came from: its tag, then the commit the tag names.
// CI checks out only this repository, so all five are committed.
//
// The copies come from the tag's own files (git show <tag>:<path>), never from the checkout's working tree, so
// the gadget only ever carries a released notation, as kubb-engine and playdate-kubb do (since 2026-11-22; before
// that the working tree was copied, and the check failed on any unreleased change there).
//
//   npm run kubb:sync                  copy the release SOURCE names again and regenerate the parser
//   npm run kubb:sync -- --tag <tag>   move to another release
//   npm run kubb:check                 fail when the parser is not what Peggy makes of the vendored grammar, or, where
//                                      the sibling is present, when a copy differs from the release SOURCE names;
//                                      it says so, without failing, when pk-kubb-score has a newer release. Part of
//                                      npm run check
//
// KUBB_SOURCE overrides the pk-kubb-score path. The default is ../../throwingwood/pk-kubb-score (this repository
// sits in ~/Projects/thingelstad.com/, pk-kubb-score in ~/Projects/throwingwood/ since 2026-11-17), or
// ../pk-kubb-score for a checkout beside it. Where neither is present (CI, or a lone clone) the check regenerates
// the parser from the vendored grammar and says the copies were not compared. A KUBB_SOURCE that is missing fails.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import peggy from 'peggy';

const out = 'site/js/gadgets/planet-kubb-score';
const grammarCopy = 'vendor/pk-kubb-score/planet-kubb-notation.peggy';
const sourceFile = 'vendor/pk-kubb-score/SOURCE';
const exampleGame = 'games/2012-07-10-friendly-garrick-and-jamie-v-dobbie-and-jaime-july-10-2012.txt';
const siblings = ['../../throwingwood/pk-kubb-score', '../pk-kubb-score'];

const parserFrom = (grammar: string) =>
  `// Generated from ${grammarCopy} by scripts/sync-kubb.ts (npm run kubb:sync). Do not edit.\n` +
  peggy.generate(grammar, {
    output: 'source',
    format: 'es',
    grammarSource: 'planet-kubb-notation.peggy',
    allowedStartRules: ['Game', 'CanonicalGame']
  });

// A generated parser without the line that says who generated it.
const body = (parser: string) => parser.slice(parser.indexOf('\n') + 1);

const exampleFrom = (game: string) =>
  `// Generated from pk-kubb-score ${exampleGame} by scripts/sync-kubb.ts (npm run kubb:sync). Do not edit.\n` +
  `// The game the Planet Kubb Score gadget opens with: a friendly at Painter Park, Minneapolis, on July 10, 2012.\n` +
  `export default ${JSON.stringify(game)};\n`;

async function syncKubb(check: boolean, moveTo: string | undefined) {
  const source = process.env.KUBB_SOURCE || siblings.find((path) => existsSync(join(path, 'grammar')));
  const pinned = (await readFile(sourceFile, 'utf8').catch(() => '')).split('\n');
  if (!source || !existsSync(source)) {
    if (process.env.KUBB_SOURCE) throw new Error(`KUBB_SOURCE ${source} does not exist.`);
    if (!check) throw new Error(`pk-kubb-score is not at ${siblings.join(' or ')}. Set KUBB_SOURCE.`);
    if (!pinned[0]) throw new Error(`${sourceFile} does not name a release. Run npm run kubb:sync -- --tag <tag>.`);
    const parser = await readFile(join(out, 'notation-parser.js'), 'utf8').catch(() => null);
    if (parser !== parserFrom(await readFile(grammarCopy, 'utf8')))
      throw new Error(`${out}/notation-parser.js is not what Peggy makes of ${grammarCopy}. Run npm run kubb:sync.`);
    return (
      `pk-kubb-score is not in this checkout, so the vendored copies were not compared with its ${pinned[0]}; ` +
      `${out}/notation-parser.js matches ${grammarCopy}.`
    );
  }
  const git = (...args: string[]) => {
    try {
      return execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      return null;
    }
  };
  const tag = check ? pinned[0] : (moveTo ?? pinned[0]);
  if (!tag) throw new Error(`${sourceFile} does not name a release. Run npm run kubb:sync -- --tag <tag>.`);
  const commit = git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`)?.trim();
  if (!commit) throw new Error(`${source} has no tag ${tag}. Fetch its tags (git -C ${source} fetch --tags).`);
  const from = (path: string) => {
    const text = git('show', `refs/tags/${tag}:${path}`);
    if (text === null) throw new Error(`pk-kubb-score ${tag} has no ${path}.`);
    return text;
  };
  const grammar = from('grammar/planet-kubb-notation.peggy');
  const want: Record<string, string> = {
    [sourceFile]: `${tag}\n${commit}\n`,
    [grammarCopy]: grammar,
    [join(out, 'notation-parser.js')]: parserFrom(grammar),
    [join(out, 'kubb.js')]: from('site/assets/kubb.js'),
    [join(out, 'example.js')]: exampleFrom(from(exampleGame))
  };
  // The release carries the parser its own build made. Ours must be that parser, or the gadget would not read
  // notation the way the release does (another Peggy, or other options).
  if (body(want[join(out, 'notation-parser.js')]) !== body(from('site/assets/notation-parser.js')))
    throw new Error(
      `The parser Peggy makes here from the ${tag} grammar is not the one pk-kubb-score ${tag} carries. ` +
        `Use its Peggy version and the options in its tools/build-grammar.mjs.`
    );
  if (!check) {
    for (const [path, text] of Object.entries(want)) {
      await mkdir(join(path, '..'), { recursive: true });
      await writeFile(path, text);
    }
    return `Wrote ${Object.keys(want).join(', ')} from pk-kubb-score ${tag} in ${source}.`;
  }
  for (const [path, text] of Object.entries(want)) {
    const have = await readFile(path, 'utf8').catch(() => null);
    if (have === null) throw new Error(`${path} is missing. Run npm run kubb:sync.`);
    if (have !== text)
      throw new Error(`${path} differs from pk-kubb-score ${tag} in ${source}. Run npm run kubb:sync.`);
  }
  const newest = git('for-each-ref', '--sort=-creatordate', '--count=1', '--format=%(refname:short)', 'refs/tags');
  const newer =
    newest && newest.trim() !== tag
      ? ` pk-kubb-score has a newer release, ${newest.trim()}: npm run kubb:sync -- --tag ${newest.trim()} moves to it.`
      : '';
  return `The ${Object.keys(want).length} Planet Kubb files match pk-kubb-score ${tag} in ${source}.${newer}`;
}

try {
  const at = process.argv.indexOf('--tag');
  if (at >= 0 && !process.argv[at + 1]) throw new Error('--tag needs a release tag, as in --tag v2-2026.11.');
  console.log(await syncKubb(process.argv.includes('--check'), at >= 0 ? process.argv[at + 1] : undefined));
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
