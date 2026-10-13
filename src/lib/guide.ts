export type GuideResult = { message: string; projectIds: string[]; suggestions: string[] };
export type GuideEvent =
  { type: 'thinking'; text: string } | { type: 'result'; result: GuideResult } | { type: 'error'; message: string };

export async function askGuide(
  question: string,
  history: { question: string; answer: string }[],
  contextId: string | null,
  signal: AbortSignal,
  onEvent: (event: GuideEvent) => void
): Promise<void> {
  const response = await fetch('/api/explore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ question, history, contextId })
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'The guide could not connect. You can still explore every project.');
  }
  if (!response.body) throw new Error('The guide returned an empty response.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as GuideEvent);
      if (done) {
        if (buffer.trim()) onEvent(JSON.parse(buffer) as GuideEvent);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
