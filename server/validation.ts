import { catalog } from '../src/data/projects';
import type { GuideResult } from '../src/lib/guide';

const validIds = new Set(catalog.map((project) => project.id));

export function validateGuideResult(value: unknown): GuideResult {
  if (!value || typeof value !== 'object') throw new Error('The guide returned an invalid response.');
  const result = value as Record<string, unknown>;
  if (typeof result.message !== 'string' || !result.message.trim() || result.message.length > 2200)
    throw new Error('The guide returned an invalid explanation.');
  if (
    !Array.isArray(result.projectIds) ||
    result.projectIds.length > 8 ||
    result.projectIds.some((id) => typeof id !== 'string' || !validIds.has(id))
  )
    throw new Error('The guide referred to an unknown project.');
  if (
    !Array.isArray(result.suggestions) ||
    result.suggestions.length > 3 ||
    result.suggestions.some((text) => typeof text !== 'string' || text.length > 120)
  )
    throw new Error('The guide returned invalid suggestions.');
  return {
    message: result.message,
    projectIds: [...new Set(result.projectIds)] as string[],
    suggestions: result.suggestions as string[]
  };
}

export function validateRequest(value: unknown): {
  question: string;
  contextId: string | null;
  history: { question: string; answer: string }[];
} {
  if (!value || typeof value !== 'object') throw new Error('Ask a question about these things.');
  const input = value as Record<string, unknown>;
  if (typeof input.question !== 'string' || input.question.trim().length < 1 || input.question.length > 1000)
    throw new Error('Keep your question between 1 and 1,000 characters.');
  const contextId = typeof input.contextId === 'string' && validIds.has(input.contextId) ? input.contextId : null;
  const history = Array.isArray(input.history)
    ? input.history
        .slice(-4)
        .filter(
          (item): item is { question: string; answer: string } =>
            !!item &&
            typeof item.question === 'string' &&
            item.question.length <= 1000 &&
            typeof item.answer === 'string' &&
            item.answer.length <= 2200
        )
    : [];
  return { question: input.question.trim(), contextId, history };
}
