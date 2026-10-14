export type Story = {
  color: string;
  introduction: string;
  idea: string;
  engineering: string[];
  stack: string[];
  source?: string;
  sourceLabel?: string;
  related: string[];
  questions: string[];
  started?: string;
};
export type Source =
  | { id: string; kind: 'github'; repository: string }
  | { id: string; kind: 'website'; url: string; sitemap?: string }
  | { id: string; kind: 'archive'; url: string; sourceKind: 'blog' | 'weekly_thing' | 'podcast' };
type Attachment = { sourceId: string; role: string; path?: string };
export type Thing = {
  id: string;
  title: string;
  summary: string;
  collection: string;
  url: string | null;
  historical: boolean;
  story?: Story;
  sources: Attachment[];
};
export type Connection = { from: string; to: string; label: string; detail: string; source: string; kind?: 'lineage' };
export type Topic = { id: string; title: string; description: string; projectIds: string[] };
export type HistoryEvent = {
  id: string;
  projectIds: string[];
  date: string;
  kind: 'launch' | 'milestone' | 'retirement' | 'archive' | 'development';
  title: string;
  summary: string;
  source: string;
};
export type Collection = {
  schemaVersion: 1;
  things: Thing[];
  sources: Source[];
  connections: Connection[];
  topics: Topic[];
  history: HistoryEvent[];
};
type CommitEvidence = { date: string; url: string };
export type Activity = {
  path: string | null;
  branch: string;
  since: string;
  until: string;
  count: number;
  complete: boolean;
  months: { month: string; count: number }[];
  latestCommit: CommitEvidence | null;
};
export type RepositorySnapshot = {
  sourceId: string;
  repository: string;
  url: string;
  fetchedAt: string;
  repositoryCreatedAt: string;
  archived: boolean;
  description: string;
  languages: { name: string; bytes: number }[];
  release: { name: string; date: string; url: string } | null;
  activity: Activity[];
};
export type GitHubData = { schemaVersion: 1; repositories: RepositorySnapshot[] };
