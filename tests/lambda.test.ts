import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/lambda';

const event = (overrides = {}) => ({
  rawPath: '/api/explore',
  headers: { origin: 'https://thingelstad.xyz', 'content-type': 'application/json' },
  body: JSON.stringify({ question: 'How are these connected?', contextId: 'elixir', history: [] }),
  requestContext: { http: { method: 'POST' } },
  ...overrides
});
test('public API rejects invalid requests before quota or model invocation', async () => {
  let calls = 0;
  const handler = createHandler({
    origins: () => ['https://thingelstad.xyz'],
    verify: async () => {},
    allowance: async () => {
      calls++;
      return true;
    },
    curate: async () => {
      calls++;
    }
  });
  assert.equal(
    (await handler(event({ headers: { origin: 'https://other.example', 'content-type': 'application/json' } })))
      .statusCode,
    403
  );
  assert.equal((await handler(event({ body: 'x'.repeat(17000) }))).statusCode, 400);
  assert.equal(
    (await handler(event({ body: JSON.stringify({ question: '', contextId: 'private-file' }) }))).statusCode,
    400
  );
  assert.equal(calls, 0);
});
test('quota exhaustion stops model work while health remains independent', async () => {
  let model = 0,
    quota = 0;
  const handler = createHandler({
    origins: () => ['https://thingelstad.xyz'],
    verify: async () => {},
    allowance: async () => {
      quota++;
      return false;
    },
    curate: async () => {
      model++;
    }
  });
  assert.equal((await handler(event())).statusCode, 429);
  assert.equal(
    (await handler(event({ rawPath: '/api/health', requestContext: { http: { method: 'GET' } } }))).statusCode,
    200
  );
  assert.equal(quota, 1);
  assert.equal(model, 0);
});
test('public adapter preserves the guide event contract and timeout', async () => {
  const handler = createHandler({
    origins: () => ['https://thingelstad.xyz'],
    verify: async () => {},
    allowance: async () => true,
    curate: async (body, signal, emit) => {
      assert.equal(signal.aborted, false);
      emit({ type: 'result', result: { message: 'Connected projects.', projectIds: ['elixir'], suggestions: [] } });
    }
  });
  const response = await handler(event());
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).result.projectIds[0], 'elixir');
  assert.equal(response.headers['cache-control'], 'no-store');
});
