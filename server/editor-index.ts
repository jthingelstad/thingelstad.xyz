import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { editorHostAllowed } from './editor-edge';
import { createEditorHandler } from './editor-handler';

const port = Number(process.env.PORT ?? 5174);
const tailnetOrigin = process.env.EDITOR_ORIGIN;
if (
  tailnetOrigin &&
  (!/^https:\/\/[a-z0-9.-]+\.ts\.net:\d+$/.test(tailnetOrigin) || new URL(tailnetOrigin).pathname !== '/')
)
  throw new Error('EDITOR_ORIGIN must be the exact HTTPS Tailscale Serve origin.');
const origins = new Set([
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`,
  ...(tailnetOrigin ? [tailnetOrigin] : [])
]);
const handle = createEditorHandler(resolve(process.env.EDITOR_DATA_DIR ?? 'src/data'), origins);
const root = resolve('.build/editor');
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.woff2': 'font/woff2'
};
const server = createServer(async (req, res) => {
  const json = (status: number, message: string) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ message }));
  };
  try {
    if (!editorHostAllowed(req.headers.host, origins)) return json(403, 'This address is not the editor.');
    const pathname = new URL(req.url ?? '/', 'http://editor.local').pathname;
    if (pathname === '/api/editor' || pathname.startsWith('/api/editor/')) {
      await handle(req, res);
      return;
    }
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, scope: 'private-editor' }));
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, 'Use GET for editor pages.');
    if (pathname.startsWith('/api/')) return json(404, 'Unknown endpoint.');
    const file =
      pathname === '/' || pathname === '/editor'
        ? resolve(root, 'editor/index.html')
        : resolve(root, `.${decodeURIComponent(pathname)}`);
    if (
      !file.startsWith(root + sep) ||
      !types[extname(file)] ||
      (!pathname.startsWith('/assets/') && pathname !== '/' && pathname !== '/editor')
    )
      return json(404, 'Not found.');
    const content = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)],
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    if (!res.headersSent) json(404, 'The editor could not load this resource.');
    else res.end();
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Collection editor: ${tailnetOrigin ?? `http://127.0.0.1:${port}`}`)
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
