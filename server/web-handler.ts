import type { IncomingMessage, ServerResponse } from 'node:http';
import { validateRequest } from './validation';
import type { curate, verifyIdentity } from './curator';

type Dependencies = {
  curate: typeof curate;
  allowance: (signal: AbortSignal) => Promise<boolean>;
  verify: typeof verifyIdentity;
  origins: () => string[];
};

function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

export function createGuideHandler(dependencies: Dependencies) {
  let active = 0;
  return async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', 'http://guide.local').pathname;
    if (pathname === '/api/health' && req.method === 'GET') {
      try {
        await dependencies.verify(AbortSignal.timeout(5000));
        json(res, 200, { ok: true, ai: 'bedrock', scope: 'public-site' });
      } catch {
        json(res, 503, { ok: false });
      }
      return;
    }
    if (pathname !== '/api/explore') return json(res, 404, { message: 'Unknown endpoint.' });
    if (req.method !== 'POST') return json(res, 405, { message: 'Use POST to ask the guide.' });
    if (!req.headers.origin || !dependencies.origins().includes(req.headers.origin))
      return json(res, 403, { message: 'Use the guide from this site.' });
    if (!req.headers['content-type']?.startsWith('application/json'))
      return json(res, 415, { message: 'The guide accepts JSON.' });
    let body: unknown;
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > 16384) {
          // Drain without destroying the socket so the client receives the refusal.
          req.resume();
          return json(res, 400, { message: 'The request is too large.' });
        }
        chunks.push(bytes);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      validateRequest(body);
    } catch (error) {
      if (!res.destroyed) json(res, 400, { message: error instanceof Error ? error.message : 'Invalid question.' });
      return;
    }
    if (active >= 1) return json(res, 429, { message: 'The guide is busy. Try again in a moment.' });
    active++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 24000);
    const disconnect = () => controller.abort();
    res.on('close', disconnect);
    const emit = (event: unknown) => {
      if (!res.destroyed) res.write(JSON.stringify(event) + '\n');
    };
    try {
      if (!(await dependencies.allowance(controller.signal)))
        return json(res, 429, {
          message: 'The guide has used today’s allowance. Come back tomorrow, or keep browsing the collection.'
        });
      if (controller.signal.aborted) return;
      res.writeHead(200, {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no'
      });
      res.flushHeaders();
      await dependencies.curate(body, controller.signal, emit);
    } catch (error) {
      console.error('AI guide:', error instanceof Error ? error.name : 'UnknownError');
      const message = controller.signal.aborted
        ? 'That exploration took too long. Try a shorter question, or keep browsing.'
        : 'The AI guide could not connect just now. You can still explore every project.';
      if (!res.destroyed) {
        if (res.headersSent) emit({ type: 'error', message });
        else json(res, 503, { message });
      }
    } finally {
      clearTimeout(timer);
      res.off('close', disconnect);
      active--;
      res.end();
    }
  };
}
