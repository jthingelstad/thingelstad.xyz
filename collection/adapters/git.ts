// Commit history from a commits-only clone of a public repository: `git clone --bare --filter=tree:0` holds
// the commits and nothing else, so all 41 registry repositories clone in seconds. A repository the registry
// scopes to a directory is cloned with its trees (`--filter=blob:none`) so `git log -- <path>` can answer.
// No file contents are fetched, nothing is checked out, and no credential helper is consulted, so a
// private repository fails to clone even on a machine that could read it.
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Agent, CommitAuthor, CommitEntry, CommitLogObservation } from '../schema';
import { repositoryName, repositoryPath } from '../validate';
import type { GitHubReader } from './github';

export type GitRunner = (args: string[]) => Promise<string>;
const exec = promisify(execFile);
export function defaultGitRunner(): GitRunner {
  return async (args) => {
    const { stdout } = await exec('git', args, {
      timeout: 180_000,
      maxBuffer: 256_000_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });
    return stdout;
  };
}

// Bots do upkeep: dependency bumps, translation syncs, the collector's own pull requests.
export function isBot(name: string, email: string) {
  const word = /(^|[^a-z])bot($|[^a-z])/i;
  return /\[bot\]$/i.test(name) || word.test(name) || word.test(email.split('@')[0]) || /libraryupgrader/i.test(email);
}
const isMe = (name: string) => /^(jamie thingelstad|jamie@thingelstad\.com|jthingelstad)$/i.test(name.trim());
function namedAgent(identity: string): Agent | null {
  if (/anthropic\.com|^claude\b/i.test(identity)) return 'claude';
  if (/openai\.com|\bcodex\b/i.test(identity)) return 'codex';
  return null;
}
// Who made a commit, or null for a bot's. An agent is named when it authored the commit or signed it with a
// Co-authored-by trailer. My agents also commit under their own names at my domain (Otto Thing, Run Elixir),
// so any other @thingelstad.com author is an agent too, unnamed. A commit a bot co-authored and no agent
// signed is a merged bot pull request.
export function attribute(
  name: string,
  email: string,
  coAuthors: string[]
): { by: CommitAuthor; agents: Agent[] } | null {
  if (isBot(name, email)) return null;
  const agents = [
    ...new Set(
      [`${name} <${email}>`, ...coAuthors].flatMap((identity) => {
        const agent = namedAgent(identity);
        return agent ? [agent] : [];
      })
    )
  ].toSorted();
  const coBot = coAuthors.some((identity) => {
    const match = /^(.*?)\s*<([^>]*)>\s*$/.exec(identity);
    return match ? isBot(match[1], match[2]) : isBot(identity, '');
  });
  if (agents.length) return { by: 'agent', agents };
  if (coBot) return null;
  if (isMe(name)) return { by: 'me', agents: [] };
  if (/@thingelstad\.com$/i.test(email.trim())) return { by: 'agent', agents: [] };
  return { by: 'others', agents: [] };
}

const clean = (value: string, max = 160) => {
  const text = value
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};
// The subject a reader sees. GitHub's merge commits say only "Merge pull request #12 from owner/branch";
// their pull request's title is the first line of the body.
export function subjectOf(subject: string, body: string): { subject: string; pr?: number } {
  const merge = /^Merge pull request #(\d+) from \S+/.exec(subject);
  if (merge) {
    const title = body.split('\n').find((line) => line.trim());
    return { subject: clean(title ?? subject), pr: Number(merge[1]) };
  }
  const squash = /\(#(\d+)\)\s*$/.exec(subject);
  return squash ? { subject: clean(subject), pr: Number(squash[1]) } : { subject: clean(subject) };
}

const field = '\u001f';
const record = '\u001e';
const trailerSeparator = '\u001d';
const logFormat = [
  '%H',
  '%cI',
  '%an',
  '%ae',
  `%(trailers:key=Co-authored-by,valueonly,separator=%x1d)`,
  '%s',
  '%b'
].join('%x1f');
export function parseLog(output: string): CommitEntry[] {
  const entries: CommitEntry[] = [];
  for (const raw of output.split(record)) {
    const line = raw.replace(/^\n+/, '');
    if (!line.trim()) continue;
    const [sha, date, name, email, trailers, subject, body = ''] = line.split(field);
    if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('git log returned an invalid commit.');
    if (!Number.isFinite(Date.parse(date))) throw new Error('git log returned an invalid date.');
    const who = attribute(
      name ?? '',
      email ?? '',
      (trailers ?? '')
        .split(trailerSeparator)
        .map((t) => t.trim())
        .filter(Boolean)
    );
    if (!who) continue;
    entries.push({
      sha: sha.slice(0, 12),
      date: new Date(date).toISOString(),
      ...subjectOf(subject ?? '', body),
      by: who.by,
      ...(who.agents.length ? { agents: who.agents } : {})
    });
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
function parseTags(output: string) {
  return output
    .split('\n')
    .flatMap((line) => {
      const [name, date] = line.split(field);
      if (!name || !/^[\w.+/-]{1,80}$/.test(name) || !Number.isFinite(Date.parse(date ?? ''))) return [];
      return [{ name, date: new Date(date).toISOString() }];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function observeCommits(
  repositoryInput: string,
  paths: (string | null)[],
  git: GitRunner,
  github: GitHubReader,
  now = new Date()
): Promise<CommitLogObservation> {
  repositoryName(repositoryInput, 'repository');
  const scopes = [...new Set(paths.filter((p): p is string => Boolean(p)))].toSorted();
  for (const path of scopes) repositoryPath(path, 'path');
  const repo = (await github(`repos/${repositoryInput}`)) as Record<string, unknown>;
  if (repo?.private !== false || repo.visibility !== 'public')
    throw new Error('Only public repositories are observed.');
  const repository = repositoryName(repo.full_name, 'repository');
  const url = String(repo.html_url);
  if (url !== `https://github.com/${repository}`) throw new Error('Invalid GitHub evidence URL.');
  const dir = await mkdtemp(join(tmpdir(), 'xyz-commits-'));
  try {
    const clone = join(dir, 'repo.git');
    await git([
      '-c',
      'credential.helper=',
      'clone',
      '--quiet',
      '--bare',
      '--single-branch',
      `--filter=${scopes.length ? 'blob:none' : 'tree:0'}`,
      `https://github.com/${repository}.git`,
      clone
    ]);
    const at = ['--git-dir', clone];
    const branch = (await git([...at, 'symbolic-ref', '--short', 'HEAD'])).trim();
    const commits = parseLog(await git([...at, 'log', 'HEAD', `--format=${logFormat}%x1e`]));
    if (scopes.length) {
      const touched = new Map<string, string[]>();
      for (const path of scopes)
        for (const sha of (await git([...at, 'log', 'HEAD', '--format=%H', '--', path])).split('\n'))
          if (sha.trim()) touched.set(sha.trim().slice(0, 12), [...(touched.get(sha.trim().slice(0, 12)) ?? []), path]);
      for (const commit of commits) {
        const hit = touched.get(commit.sha);
        if (hit) commit.paths = hit;
      }
    }
    const tags = parseTags(
      await git([...at, 'for-each-ref', 'refs/tags', '--format=%(refname:short)%x1f%(creatordate:iso-strict)'])
    );
    return { kind: 'commits', repository, url, observedAt: now.toISOString(), branch, commits, tags };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
