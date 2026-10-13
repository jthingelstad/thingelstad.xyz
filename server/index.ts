import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { curate } from './curator';
import { validateRequest } from './validation';

const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);
const vite = production ? null : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
let active = 0;
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};

function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of req) {
    body += String(chunk);
    if (Buffer.byteLength(body) > 16_384) throw new Error('The request is too large.');
  }
  return JSON.parse(body);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return json(res, 403, { message: 'This preview is local.' });
    const pathname = new URL(req.url ?? '/', `http://${host}`).pathname;
    if (pathname === '/api/health' && req.method === 'GET')
      return json(res, 200, { ok: true, ai: 'bedrock', scope: 'local-preview' });
    if (pathname === '/api/explore') {
      if (req.method !== 'POST') return json(res, 405, { message: 'Use POST to ask the guide.' });
      if (req.headers.origin && req.headers.origin !== `http://${host}`)
        return json(res, 403, { message: 'Use the guide from this preview.' });
      if (!req.headers['content-type']?.startsWith('application/json'))
        return json(res, 415, { message: 'The guide accepts JSON.' });
      if (active >= 2) return json(res, 429, { message: 'The guide is busy. Try again in a moment.' });
      let body: unknown;
      try {
        body = await readBody(req);
        validateRequest(body);
      } catch (error) {
        return json(res, 400, { message: error instanceof Error ? error.message : 'Invalid question.' });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40_000);
      res.on('close', () => controller.abort());
      active += 1;
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no'
      });
      const emit = (event: unknown) => {
        if (!res.destroyed) res.write(JSON.stringify(event) + '\n');
      };
      try {
        await curate(body, controller.signal, emit);
      } catch (error) {
        console.error('AI guide:', error instanceof Error ? error.name : 'UnknownError');
        emit({
          type: 'error',
          message: controller.signal.aborted
            ? 'That exploration took too long. Try a shorter question, or keep browsing.'
            : 'The AI guide could not connect just now. You can still explore every project.'
        });
      } finally {
        active -= 1;
        clearTimeout(timer);
        res.end();
      }
      return;
    }
    if (pathname.startsWith('/api/')) return json(res, 404, { message: 'Unknown endpoint.' });
    if (pathname.startsWith('/research/') || pathname.startsWith('/server/') || pathname.startsWith('/.'))
      return json(res, 404, { message: 'Not a public asset.' });
    if (vite) {
      vite.middlewares(req, res);
      return;
    }
    const dist = resolve('dist');
    let file = resolve(dist, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(dist + sep) && file !== dist) return json(res, 404, { message: 'Not found.' });
    try {
      if (!(await stat(file)).isFile()) file = resolve(dist, 'index.html');
    } catch {
      file = resolve(dist, 'index.html');
    }
    const content = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(content);
  } catch {
    if (!res.headersSent) json(res, 500, { message: 'The preview could not complete that request.' });
    else res.end();
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Things I've built: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close();
    void vite?.close();
  });
