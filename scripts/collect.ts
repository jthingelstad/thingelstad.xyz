// npm run collect [-- owner/repository | https://site/ | commits | publications | ...] [-- --no-wayback]
// Observes every GitHub and website source in the registry and updates data/observations. The daily run
// leaves out the Internet Archive with --no-wayback, which rate-limits its CDX API; Mondays ask it too.
import { collect } from '../collection/collect';

const args = process.argv.slice(2);
const result = await collect({
  only: args.find((arg) => !arg.startsWith('--')),
  ...(args.includes('--no-wayback') ? { wayback: null } : {})
});
console.log(`${result.written.length} written, ${result.unchanged.length} unchanged, ${result.failed.length} failed.`);
for (const failure of result.failed) console.error(`  ${failure.target}: ${failure.error}`);
if (result.failed.length) process.exitCode = 1;
