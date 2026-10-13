import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { curate, verifyIdentity } from './curator';
import { validateRequest } from './validation';
import type { GuideEvent } from '../src/lib/guide';

type Event = {
  rawPath: string;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext: { http: { method: string } };
};
type Dependencies = {
  curate: typeof curate;
  allowance: () => Promise<boolean>;
  verify: typeof verifyIdentity;
  origins: () => string[];
};
const database = new DynamoDBClient({ region: 'us-east-1', maxAttempts: 2 });
async function allowance() {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await database.send(
      new UpdateItemCommand({
        TableName: process.env.ALLOWANCE_TABLE!,
        Key: { day: { S: day } },
        UpdateExpression: 'SET #expires = :expiry ADD #requests :one',
        ConditionExpression: 'attribute_not_exists(#requests) OR #requests < :limit',
        ExpressionAttributeNames: { '#requests': 'requests', '#expires': 'expiresAt' },
        ExpressionAttributeValues: {
          ':expiry': { N: String(Math.floor(Date.now() / 1000) + 172800) },
          ':one': { N: '1' },
          ':limit': { N: process.env.GUIDE_DAILY_LIMIT ?? '100' }
        }
      })
    );
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') return false;
    throw error;
  }
}

export function createHandler(dependencies: Dependencies) {
  return async (event: Event) => {
    const headers = Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value])
    );
    const json = (statusCode: number, value: unknown) => ({
      statusCode,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      body: JSON.stringify(value)
    });
    if (event.rawPath === '/api/health' && event.requestContext.http.method === 'GET') {
      try {
        await dependencies.verify(AbortSignal.timeout(5000));
        return json(200, { ok: true, ai: 'bedrock', scope: 'public-site' });
      } catch {
        return json(503, { ok: false });
      }
    }
    if (event.rawPath !== '/api/explore') return json(404, { message: 'Unknown endpoint.' });
    if (event.requestContext.http.method !== 'POST') return json(405, { message: 'Use POST to ask the guide.' });
    if (!headers.origin || !dependencies.origins().includes(headers.origin))
      return json(403, { message: 'Use the guide from this site.' });
    if (!headers['content-type']?.startsWith('application/json'))
      return json(415, { message: 'The guide accepts JSON.' });
    let body: unknown;
    try {
      const text = event.isBase64Encoded
        ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
        : (event.body ?? '');
      if (Buffer.byteLength(text) > 16384) throw new Error('The request is too large.');
      body = JSON.parse(text);
      validateRequest(body);
    } catch (error) {
      return json(400, { message: error instanceof Error ? error.message : 'Invalid question.' });
    }
    try {
      if (!(await dependencies.allowance()))
        return json(429, {
          message: 'The guide has used today’s allowance. Come back tomorrow, or keep browsing the collection.'
        });
      const events: GuideEvent[] = [];
      await dependencies.curate(body, AbortSignal.timeout(24000), (event) => events.push(event));
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
        body: events.map((event) => JSON.stringify(event) + '\n').join('')
      };
    } catch (error) {
      console.error('AI guide:', error instanceof Error ? error.name : 'UnknownError');
      return json(503, { message: 'The AI guide could not connect just now. You can still explore every project.' });
    }
  };
}
export const handler = createHandler({
  curate,
  allowance,
  verify: verifyIdentity,
  origins: () => (process.env.ALLOWED_ORIGINS ?? '').split(',')
});
