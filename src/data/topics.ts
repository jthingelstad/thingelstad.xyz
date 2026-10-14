import { collection } from './projects';
import type { Topic } from './schema';

export const topics: Topic[] = collection.topics;
export const topicById = new Map(topics.map((topic) => [topic.id, topic]));
export function topicsFor(id: string) {
  return topics.filter((topic) => topic.projectIds.includes(id));
}
