// Check every built file before a build can pass CI or begin publishing. New
// public asset formats must have a MIME type, just as artifact files do.
import { fileURLToPath } from 'node:url';
import { contentTypeFor, publishOrder } from './publish-plan.mjs';

const root = fileURLToPath(new URL('../_site/', import.meta.url));
const keys = publishOrder(root);
for (const key of keys) contentTypeFor(key);
console.log(`Publish plan: all ${keys.length} built files have content types.`);
