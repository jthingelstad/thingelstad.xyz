import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createGuideHandler } from '../server/web-handler';

const question = { question: 'How are these connected?', contextId: 'elixir', history: [] };
const result = {
  type: 'result',
  result: { message: 'Connected projects.', projectIds: ['elixir'], suggestions: [] }
} as const;
type Dependencies = Parameters<typeof createGuideHandler>[0];
async function fixture(t: TestContext, overrides: Partial<Dependencies> = {}) {
  const server = createServer(
    createGuideHandler({
      origins: () => ['https://thingelstad.xyz'],
      verify: async () => {},
      allowance: async () => true,
      curate: async (_body, _signal, emit) =>
        emit({ ...result, result: { ...result.result, projectIds: ['elixir'], suggestions: [] } }),
      ...overrides
    })
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return (path = '/api/explore', options: RequestInit = {}) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: 'POST',
      headers: { origin: 'https://thingelstad.xyz', 'content-type': 'application/json' },
      body: JSON.stringify(question),
      ...options
    });
}
test('HTTP guide rejects requests before quota or model work', async (t) => {
  let calls = 0;
  const request = await fixture(t, {
    allowance: async () => {
      calls++;
      return true;
    },
    curate: async () => {
      calls++;
    }
  });
  for (const [path, options, status] of [
    ['/api/explore', { method: 'GET', body: undefined }, 405],
    ['/api/explore', { headers: { origin: 'https://other.example', 'content-type': 'application/json' } }, 403],
    ['/api/explore', { headers: { 'content-type': 'application/json' } }, 403],
    ['/api/explore', { headers: { origin: 'https://thingelstad.xyz', 'content-type': 'text/plain' } }, 415],
    ['/api/explore', { body: 'x'.repeat(17000) }, 400],
    ['/api/explore', { body: JSON.stringify({ question: '', contextId: 'private-file' }) }, 400],
    ['/api/explore', { body: '{' }, 400],
    ['/research/project-inventory.json', {}, 404]
  ] as [string, RequestInit, number][]) {
    const response = await request(path, options);
    assert.equal(response.status, status);
    await response.text();
  }
  assert.equal(calls, 0);
});
test('daily exhaustion stops model work and health remains independent', async (t) => {
  let model = 0,
    quota = 0;
  const request = await fixture(t, {
    allowance: async () => {
      quota++;
      return false;
    },
    curate: async () => {
      model++;
    }
  });
  const refusal = await request();
  assert.equal(refusal.status, 429);
  await refusal.text();
  const health = await request('/api/health', { method: 'GET', body: undefined });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  assert.equal(quota, 1);
  assert.equal(model, 0);
});
test('thinking is streamed before model completion and busy requests do not claim quota', async (t) => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  t.after(() => finish());
  let quota = 0;
  const request = await fixture(t, {
    allowance: async () => {
      quota++;
      return true;
    },
    curate: async (_body, signal, emit) => {
      assert.equal(signal.aborted, false);
      emit({ type: 'thinking', text: 'Following the connections…' });
      await pending;
      emit({ ...result, result: { ...result.result, projectIds: ['elixir'], suggestions: [] } });
    }
  });
  const response = await request();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-type')!, /application\/x-ndjson/);
  const reader = response.body!.getReader();
  assert.equal(JSON.parse(new TextDecoder().decode((await reader.read()).value)).type, 'thinking');
  const busy = await request();
  assert.equal(busy.status, 429);
  await busy.text();
  assert.equal(quota, 1);
  finish();
  let text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += new TextDecoder().decode(value);
  }
  assert.deepEqual(JSON.parse(text), result);
  const next = await request();
  assert.equal(next.status, 200);
  await next.text();
  assert.equal(quota, 2);
});
test('client disconnect aborts model work and releases the concurrency slot', async (t) => {
  let aborted!: () => void;
  const cancelled = new Promise<void>((resolve) => {
    aborted = resolve;
  });
  let calls = 0;
  const request = await fixture(t, {
    curate: async (_body, signal, emit) => {
      calls++;
      if (calls !== 1) return;
      emit({ type: 'thinking', text: 'Working' });
      await new Promise<void>((resolve) =>
        signal.addEventListener(
          'abort',
          () => {
            resolve();
            aborted();
          },
          { once: true }
        )
      );
    }
  });
  const response = await request();
  await response.body!.cancel();
  await cancelled;
  const next = await request();
  assert.equal(next.status, 200);
  await next.text();
});
test('model failures become stream errors and allowance failures fail closed', async (t) => {
  const request = await fixture(t, {
    curate: async () => {
      throw new Error('private prompt');
    }
  });
  const response = await request();
  assert.equal(response.status, 200);
  const error = JSON.parse(await response.text());
  assert.equal(error.type, 'error');
  assert.doesNotMatch(error.message, /private prompt/);
  const failed = await fixture(t, {
    allowance: async () => {
      throw new Error('counter failure');
    }
  });
  const refusal = await failed();
  assert.equal(refusal.status, 503);
  assert.doesNotMatch(await refusal.text(), /counter failure/);
});

test('the 24-second deadline aborts model work and health fails closed on identity errors', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let aborted = false;
  const request = await fixture(t, {
    verify: async () => {
      throw new Error('wrong role');
    },
    curate: async (_body, signal, emit) => {
      emit({ type: 'thinking', text: 'Working' });
      await new Promise<void>((_resolve, reject) =>
        signal.addEventListener(
          'abort',
          () => {
            aborted = true;
            reject(new Error('deadline'));
          },
          { once: true }
        )
      );
    }
  });
  const response = await request();
  const reader = response.body!.getReader();
  await reader.read();
  t.mock.timers.tick(24000);
  let text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += new TextDecoder().decode(value);
  }
  assert.equal(aborted, true);
  assert.equal(JSON.parse(text).type, 'error');
  assert.match(JSON.parse(text).message, /took too long/);
  const health = await request('/api/health', { method: 'GET', body: undefined });
  assert.equal(health.status, 503);
  assert.deepEqual(await health.json(), { ok: false });
});
