import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
mkdirSync('.build/guide', { recursive: true });
await build({
  entryPoints: ['server/lambda.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outfile: '.build/guide/index.js'
});
rmSync('.build/guide.zip', { force: true });
utimesSync('.build/guide/index.js', new Date('1980-01-01T00:00:00Z'), new Date('1980-01-01T00:00:00Z'));
execFileSync('zip', ['-X', '-q', '../guide.zip', 'index.js'], { cwd: '.build/guide' });
const hash = createHash('sha256').update(readFileSync('.build/guide.zip')).digest('hex');
writeFileSync('.build/guide-key.txt', `guide/${hash}.zip\n`);
console.log(`Guide artifact: guide/${hash}.zip`);
