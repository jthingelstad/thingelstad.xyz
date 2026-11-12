// npm run kubb:sync | npm run kubb:check
// The Planet Kubb Score gadget (site/js/gadgets/planet-kubb-score.js) scores notation with the notation's own code,
// from the pk-kubb-score project (Jamie's rebuild of Planet Kubb Notation, a sibling of the thingelstad.com tree):
// - vendor/pk-kubb-score/planet-kubb-notation.peggy, a byte-for-byte copy of its grammar/planet-kubb-notation.peggy,
//   the definition of valid notation;
// - site/js/gadgets/planet-kubb-score/notation-parser.js, the parser Peggy generates from that copy, the same way
//   its tools/build-grammar.mjs does (an ES module exporting parse and SyntaxError);
// - site/js/gadgets/planet-kubb-score/kubb.js, a byte-for-byte copy of its site/assets/kubb.js, which replays a game
//   and scores it (analyze);
// - site/js/gadgets/planet-kubb-score/example.js, the example game the gadget opens with, from its games/ folder.
// CI checks out only this repository, so all four are committed.
//
//   npm run kubb:sync    copy them from the sibling checkout and regenerate the parser
//   npm run kubb:check   fail when the parser is not what Peggy makes of the vendored grammar, or, where the sibling
//                        is present, when a copy differs from it; part of npm run check
//
// KUBB_SOURCE overrides the pk-kubb-score path. The default is ../../pk-kubb-score (this repository sits in
// ~/Projects/thingelstad.com/, pk-kubb-score in ~/Projects/), or ../pk-kubb-score for a checkout beside it. Where
// neither is present (CI, or a lone clone) the check regenerates the parser from the vendored grammar and says the
// copies were not compared. A KUBB_SOURCE that is missing fails.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import peggy from 'peggy';

const out = 'site/js/gadgets/planet-kubb-score';
const grammarCopy = 'vendor/pk-kubb-score/planet-kubb-notation.peggy';
const exampleGame = 'games/2012-07-10-friendly-garrick-and-jamie-v-dobbie-and-jaime-july-10-2012.txt';
const siblings = ['../../pk-kubb-score', '../pk-kubb-score'];

const parserFrom = (grammar: string) =>
  `// Generated from ${grammarCopy} by scripts/sync-kubb.ts (npm run kubb:sync). Do not edit.\n` +
  peggy.generate(grammar, { output: 'source', format: 'es', grammarSource: 'planet-kubb-notation.peggy' });

const exampleFrom = (game: string) =>
  `// Generated from pk-kubb-score ${exampleGame} by scripts/sync-kubb.ts (npm run kubb:sync). Do not edit.\n` +
  `// The game the Planet Kubb Score gadget opens with: a friendly at Painter Park, Minneapolis, on July 10, 2012.\n` +
  `export default ${JSON.stringify(game)};\n`;

async function syncKubb(check: boolean) {
  const source = process.env.KUBB_SOURCE || siblings.find((path) => existsSync(join(path, 'grammar')));
  if (!source || !existsSync(source)) {
    if (process.env.KUBB_SOURCE) throw new Error(`KUBB_SOURCE ${source} does not exist.`);
    if (!check) throw new Error(`pk-kubb-score is not at ${siblings.join(' or ')}. Set KUBB_SOURCE.`);
    const parser = await readFile(join(out, 'notation-parser.js'), 'utf8').catch(() => null);
    if (parser !== parserFrom(await readFile(grammarCopy, 'utf8')))
      throw new Error(`${out}/notation-parser.js is not what Peggy makes of ${grammarCopy}. Run npm run kubb:sync.`);
    return (
      `pk-kubb-score is not in this checkout, so the vendored copies were not compared with it; ` +
      `${out}/notation-parser.js matches ${grammarCopy}.`
    );
  }
  const grammar = await readFile(join(source, 'grammar/planet-kubb-notation.peggy'), 'utf8');
  const want: Record<string, string> = {
    [grammarCopy]: grammar,
    [join(out, 'notation-parser.js')]: parserFrom(grammar),
    [join(out, 'kubb.js')]: await readFile(join(source, 'site/assets/kubb.js'), 'utf8'),
    [join(out, 'example.js')]: exampleFrom(await readFile(join(source, exampleGame), 'utf8'))
  };
  if (!check) {
    for (const [path, text] of Object.entries(want)) {
      await mkdir(join(path, '..'), { recursive: true });
      await writeFile(path, text);
    }
    return `Wrote ${Object.keys(want).join(', ')} from ${source}.`;
  }
  for (const [path, text] of Object.entries(want)) {
    const have = await readFile(path, 'utf8').catch(() => null);
    if (have === null) throw new Error(`${path} is missing. Run npm run kubb:sync.`);
    if (have !== text) throw new Error(`${path} differs from ${source}. Run npm run kubb:sync.`);
  }
  return `The ${Object.keys(want).length} Planet Kubb files match ${source}.`;
}

try {
  console.log(await syncKubb(process.argv.includes('--check')));
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
