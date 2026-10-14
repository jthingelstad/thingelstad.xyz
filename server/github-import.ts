import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { repositoryName, repositoryPath } from './collection-validation';
import type { Activity, RepositorySnapshot, Source } from '../src/data/schema';

const exec = promisify(execFile);
type GitHubReader = (endpoint: string) => Promise<unknown>;
const readGitHub: GitHubReader = async (endpoint) => {
  // Fixed executable and API host; no shell, arbitrary command, credential output, or writes.
  const { stdout } = await exec('gh', ['api', '--hostname', 'github.com', '--method', 'GET', endpoint], {
    timeout: 20_000,
    maxBuffer: 4_000_000
  });
  return JSON.parse(stdout);
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unexpected GitHub response.');
  return value as Record<string, unknown>;
}
function instant(value: unknown) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))
    throw new Error('GitHub returned an invalid date.');
  return new Date(value).toISOString();
}
function publicGitHubUrl(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('https://github.com/') || new URL(value).hostname !== 'github.com')
    throw new Error('Invalid GitHub evidence URL.');
  return value;
}
function commit(value: unknown) {
  const item = record(value),
    details = record(item.commit),
    committer = record(details.committer);
  if (typeof item.sha !== 'string' || !/^[a-f0-9]{40}$/.test(item.sha)) throw new Error('Invalid commit.');
  return { sha: item.sha, date: instant(committer.date), url: publicGitHubUrl(item.html_url) };
}
async function activity(
  reader: GitHubReader,
  repository: string,
  branch: string,
  path: string | null,
  now: Date
): Promise<Activity> {
  const since = new Date(now.valueOf() - 90 * 86400000).toISOString();
  const base = `repos/${repository}/commits?sha=${encodeURIComponent(branch)}${path ? `&path=${encodeURIComponent(path)}` : ''}`;
  const latest = await reader(`${base}&per_page=1`);
  if (!Array.isArray(latest)) throw new Error('Unexpected commit response.');
  const commits = new Map<string, ReturnType<typeof commit>>();
  let complete = false;
  // A bounded 90-day observation, not a lifetime total. Exactly-full pages remain lower bounds.
  for (let page = 1; page <= 3; page++) {
    const response = await reader(
      `${base}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(now.toISOString())}&per_page=100&page=${page}`
    );
    if (!Array.isArray(response)) throw new Error('Unexpected commit response.');
    for (const raw of response) {
      const item = commit(raw);
      if (item.date >= since && item.date <= now.toISOString()) commits.set(item.sha, item);
    }
    if (response.length < 100) {
      complete = true;
      break;
    }
  }
  const months = new Map<string, number>();
  for (const item of commits.values()) {
    const month = item.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + 1);
  }
  const newest = latest.length ? commit(latest[0]) : null;
  return {
    path,
    branch,
    since,
    until: now.toISOString(),
    count: commits.size,
    complete,
    months: [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
    latestCommit: newest ? { date: newest.date, url: newest.url } : null
  };
}
export async function importRepository(
  source: Extract<Source, { kind: 'github' }>,
  paths: (string | null)[],
  reader = readGitHub,
  now = new Date()
): Promise<RepositorySnapshot> {
  repositoryName(source.repository);
  for (const path of paths) if (path) repositoryPath(path);
  const repo = record(await reader(`repos/${source.repository}`));
  if (repo.private !== false || repo.visibility !== 'public')
    throw new Error('Only public repository metadata can be imported.');
  repositoryName(repo.full_name);
  const repository = repo.full_name;
  if (typeof repo.default_branch !== 'string' || !repo.default_branch) throw new Error('No default branch.');
  const branch = repo.default_branch;
  const languages = record(await reader(`repos/${repository}/languages`));
  let release: RepositorySnapshot['release'] = null;
  const releases = await reader(`repos/${repository}/releases?per_page=100`);
  if (!Array.isArray(releases)) throw new Error('Unexpected releases response.');
  const published = releases.map(record).filter((r) => r.draft === false && r.prerelease === false && r.published_at);
  published.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
  if (published[0])
    release = {
      name: String(published[0].tag_name).slice(0, 160),
      date: instant(published[0].published_at),
      url: publicGitHubUrl(published[0].html_url)
    };
  const observations: Activity[] = [];
  for (const path of [...new Set(paths)]) observations.push(await activity(reader, repository, branch, path, now));
  return {
    sourceId: source.id,
    repository,
    url: publicGitHubUrl(repo.html_url),
    fetchedAt: now.toISOString(),
    repositoryCreatedAt: instant(repo.created_at),
    archived: repo.archived === true,
    description: typeof repo.description === 'string' ? repo.description.slice(0, 1000) : '',
    languages: Object.entries(languages)
      .map(([name, bytes]) => {
        if (typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes < 0)
          throw new Error('Invalid language count.');
        return { name: name.slice(0, 80), bytes };
      })
      .sort((a, b) => b.bytes - a.bytes),
    release,
    activity: observations
  };
}
