// A loopback static server for the built site, for browser tests and local checks. It behaves like the
// CloudFront distribution: a directory URL serves its index.html, a directory URL without a trailing
// slash redirects to one, and a missing path serves 404.html with a 404 status.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.argv[3] ?? '_site';
const port = Number(process.argv[2] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};
const fileAt = (path) => {
  try {
    return statSync(path).isFile() ? path : null;
  } catch {
    return null;
  }
};
const send = (response, path, status = 200) => {
  response.writeHead(status, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
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
