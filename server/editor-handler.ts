import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createCollectionStore, Conflict } from './collection-store';
import { editorHostAllowed } from './editor-edge';
import { importRepository } from './github-import';

export function createEditorHandler(directory: string, origins: Set<string>, importer = importRepository) {
  const store = createCollectionStore(directory);
  const token = randomBytes(32).toString('hex');
  let refreshing = false;
  const json = (res: ServerResponse, status: number, value: unknown) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(value));
  };
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (
      !editorHostAllowed(req.headers.host, origins) ||
      req.headers['x-editor-request'] !== '1' ||
      (req.headers.origin && !origins.has(req.headers.origin)) ||
      (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')
    )
      return json(res, 403, { message: 'Open the editor from its own address.' });
    const pathname = new URL(req.url ?? '/', 'http://editor.local').pathname;
    if (pathname === '/api/editor' && req.method === 'GET') {
      const data = await store.read();
      return json(res, 200, { ...data, token, github: await store.readGitHub() });
    }
    if (req.method !== 'POST') return json(res, 405, { message: 'Use POST for editor changes.' });
    const supplied = req.headers['x-editor-token'];
    if (
      !req.headers.origin ||
      !origins.has(req.headers.origin) ||
      typeof supplied !== 'string' ||
      !/^[a-f0-9]{64}$/.test(supplied) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))
    )
      return json(res, 403, { message: 'Reload the editor before making changes.' });
    if (req.headers['content-type']?.split(';')[0] !== 'application/json')
      return json(res, 415, { message: 'The editor accepts JSON.' });
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > 1_000_000) {
          req.resume();
          return json(res, 413, { message: 'The collection is too large.' });
        }
        chunks.push(bytes);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
      if (pathname === '/api/editor/save') {
        if (typeof body.revision !== 'string') throw new Error('Missing collection revision.');
        return json(res, 200, await store.save(body.collection, body.revision));
      }
      if (pathname === '/api/editor/refresh') {
        if (refreshing) return json(res, 409, { message: 'A GitHub refresh is already running.' });
        if (typeof body.sourceId !== 'string') throw new Error('Choose a GitHub source.');
        const before = await store.read();
        const source = before.collection.sources.find((s) => s.id === body.sourceId);
        if (!source || source.kind !== 'github') throw new Error('Choose a saved GitHub source.');
        const paths = before.collection.things.flatMap((thing) =>
          thing.sources.filter((a) => a.sourceId === source.id).map((a) => a.path ?? null)
        );
        if (!paths.length) throw new Error('Attach this source to a thing before refreshing.');
        refreshing = true;
        try {
          const snapshot = await importer(source, paths);
          // Slow network work must never overwrite a newer collection or attachment scope.
          if ((await store.read()).revision !== before.revision)
            throw new Conflict('The collection changed during the refresh. Try again.');
          const github = await store.readGitHub();
          github.repositories = [...github.repositories.filter((r) => r.sourceId !== source.id), snapshot];
          await store.saveGitHub(github, before.revision);
          return json(res, 200, { github });
        } finally {
          refreshing = false;
        }
      }
      return json(res, 404, { message: 'Unknown editor endpoint.' });
    } catch (error) {
      // gh stderr and credential details never become an HTTP response.
      if (error && typeof error === 'object' && 'cmd' in error)
        return json(res, 502, {
          message: 'GitHub could not be read. Check gh access on this host; the previous snapshot was kept.'
        });
      return json(res, error instanceof Conflict ? 409 : 400, {
        message: error instanceof Error ? error.message : 'The editor could not save this change.'
      });
    }
  };
}
