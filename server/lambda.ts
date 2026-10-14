import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { createServer } from 'node:http';
import { curate, verifyIdentity } from './curator';
import { createGuideHandler } from './web-handler';
const database = new DynamoDBClient({ region: 'us-east-1', maxAttempts: 2 });
async function allowance(signal: AbortSignal) {
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
      }),
      { abortSignal: signal }
    );
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') return false;
    throw error;
  }
}

const server = createServer(
  createGuideHandler({
    curate,
    allowance,
    verify: verifyIdentity,
    origins: () => (process.env.ALLOWED_ORIGINS ?? '').split(',')
  })
);
const [host, port] = (process.env.AWS_LAMBDA_HTTP_ENDPOINT ?? '127.0.0.1:5174').split(':');
if (!host || !/^\d+$/.test(port ?? '') || Number(port) < 1 || Number(port) > 65535)
  throw new Error('Invalid guide listen address.');
server.listen(Number(port), host);
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
