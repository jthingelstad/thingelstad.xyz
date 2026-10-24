// A loopback static server for the built site, for browser tests and local checks. It behaves like the
// CloudFront distribution: a directory URL serves its index.html, a directory URL without a trailing
// slash redirects to one, and a missing path serves 404.html with a 404 status. Each file goes out with the
// content type the publish gives it (scripts/publish-plan.mjs).
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, normalize, relative, sep } from 'node:path';
import { contentTypeFor } from './publish-plan.mjs';

const root = process.argv[3] ?? '_site';
const port = Number(process.argv[2] ?? 4173);
const typeOf = (path) => {
  try {
    return contentTypeFor(relative(root, path).split(sep).join('/'));
  } catch {
    return 'application/octet-stream';
  }
};
const fileAt = (path) => {
  try {
    return statSync(path).isFile() ? path : null;
  } catch {
    return null;
  }
};
const send = (response, path, status = 200) => {
  response.writeHead(status, { 'content-type': typeOf(path) });
  createReadStream(path).pipe(response);
};
createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const uri = decodeURIComponent(url.pathname);
  const safe = normalize(uri).replace(/^(\.\.[/\\])+/, '');
  if (uri.endsWith('/')) {
    const index = fileAt(join(root, safe, 'index.html'));
    if (index) return send(response, index);
  } else {
    const file = fileAt(join(root, safe));
    if (file) return send(response, file);
    if (!uri.includes('.') && fileAt(join(root, safe, 'index.html'))) {
      response.writeHead(301, { location: `${uri}/` });
      return response.end();
    }
  }
  const notFound = fileAt(join(root, '404.html'));
  if (notFound) return send(response, notFound, 404);
  response.writeHead(404, { 'content-type': 'text/plain' });
  response.end('Not found');
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`));
