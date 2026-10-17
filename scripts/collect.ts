// npm run collect [-- owner/repository | https://site/]
// Observes every GitHub and website source in the registry and updates data/observations.
import { collect } from '../collection/collect';

const result = await collect({ only: process.argv[2] });
console.log(`${result.written.length} written, ${result.unchanged.length} unchanged, ${result.failed.length} failed.`);
for (const failure of result.failed) console.error(`  ${failure.target}: ${failure.error}`);
if (result.failed.length) process.exitCode = 1;
