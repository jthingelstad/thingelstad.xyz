# Direction: Things I’ve Built as a content repository

Things I’ve Built is an index and archive of Jamie’s projects, including the ones he has stepped away from. The site is a durable static site that is easy to update weekly or monthly, with an RSS feed and `llms.txt`. thingelstad.xyz is where Jamie keeps point-in-time project things, and this site is the index of them.

The first version wrapped a small dataset in a React application, a Lambda guide, and a private editor. Producing and refreshing content was the expensive step. This direction makes content the center and treats rendering as a build.

## Three layers, three owners

| Layer        | Where                                                                                                                                                                                    | Nature                                                                                                                                                                                        | Who writes it                           | Cadence                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Registry     | `content/things/*.md`, `content/topics.yaml`                                                                                                                                             | Things, sources, connections, topics                                                                                                                                                          | Jamie or an agent, in Markdown and YAML | Monthly                                            |
| Ledger       | `content/history/<year>.yaml`                                                                                                                                                            | Curated, sourced history events                                                                                                                                                               | Jamie, often from collector proposals   | Weekly or monthly                                  |
| Observations | `data/observations/github/*.json`, `.../commits/*.json`, `.../web/*.json`, `.../publications/*.json`, `.../tinylytics/*.json`, `.../wayback/*.json`, `.../screenshot/*.json` and `*.jpg` | Commits, releases, every commit and who made it, sitemap and feed dates, every feed item, stars and forks, monthly page views, Internet Archive capture days, a monthly front-page screenshot | `npm run collect`, never a person       | Daily, automated (the Internet Archive on Mondays) |

Observations never change editorial fields. Status is a decision; activity is evidence. The site shows both and never lets the collector set a status.

## The registry

One Markdown file per thing. The file name is the ID. Front matter holds the facts; the body is the story.

```yaml
---
title: Weekly Thing
summary: A weekly collection of links and ideas.
collection: Publishing
status: active # active | dormant | retired | abandoned | archived
url: https://weekly.thingelstad.com/
started: 2017 # YYYY, YYYY-MM, or YYYY-MM-DD, exactly as precise as the source
topics: [open-web, archives]
sources:
  - kind: github
    repository: jthingelstad/weekly.thingelstad.com
    role: implementation
  - kind: website
    url: https://weekly.thingelstad.com/
    role: website
    sitemap: https://weekly.thingelstad.com/sitemap.xml
    feed: https://weekly.thingelstad.com/feed.xml
connections:
  - to: librarian
    label: is indexed by
    detail: Librarian builds a searchable corpus from Weekly Thing content.
    source: https://thingy.thingelstad.com/about/
story: # optional; the current site’s richer project page
  color: '#eaa18f'
  introduction: Curiosity, collected and shared.
  engineering: [...]
  stack: [...]
  related: [...]
  questions: [...]
---
The body is the idea behind the thing, in Markdown.
```

The site is Jamie speaking about his own work. Summaries, bodies, connection details and ledger summaries are written in the first person (I, my, we), never “Jamie” or “he”. Quotations stay verbatim; only their attribution changes. The `story.questions` are a reader’s, so they stay in the third person.

Status words:

- **active**: being built or operated.
- **dormant**: not currently worked on, and may return.
- **retired**: deliberately ended.
- **abandoned**: tried, and given up before it worked out. Jamie decides this one, like every status.
- **archived**: complete and preserved as it is. Books, events, and one-time projects.

Sources are inline. Two things that name the same repository or URL share one observation; the collector stores it once. A GitHub source can carry a `path` to scope activity to a directory. A website source can carry a `sitemap` and a `feed`, which is what makes it observable. A website without either is a reference only.

Connections live on the thing they start from. Topics are a short list in `topics.yaml` with an ID, a title, and a description; membership is declared on each thing.

Validation is strict and runs in tests: unknown fields, non-HTTPS URLs, private hosts, local paths, invalid dates, unknown references, and duplicate IDs all fail the build. Date precision is preserved as written. A recorded first commit is development evidence, never a launch date.

## The ledger

`content/history/<year>.yaml` holds events, each with a date, a kind (`launch`, `milestone`, `retirement`, `archive`, `development`), a title, a summary, a public source URL, and the things it concerns. A shared event appears once and names several things. The ledger is editorial. The collector may propose events, for example a new release or a repository archived on GitHub, but a person accepts them.

The ledger is also the RSS feed: “what changed in what I’ve built,” newest first. Automated observations stay out of the main feed so it remains quiet and worth subscribing to.

## Observations

`npm run collect` reads the registry and observes every source:

- **GitHub**: creation date, archived flag, latest non-prerelease release, languages by bytes, commits per month since the first day of the month three months back, for each attached directory scope, and the latest commit. Only public repositories, only GET requests, a small allowlist of fields.
- **Sitemap**: page count, newest `lastmod`, and `lastmod` counts per month for twelve months. Modification evidence.
- **Feed** (RSS, Atom, or JSON Feed): item count, newest publication date, and publications per month within the feed’s window. Publishing evidence, and the better signal for the blog, newsletter, and podcast.
- **Commit log** (`commits/`, added 2026-10-23): every commit on a public repository’s default branch, read from a commits-only clone (`git clone --bare --filter=tree:0`, or `blob:none` where a source names a directory, so `git log -- <path>` can answer), with no credential helper. Each commit keeps a short SHA, its date, its subject (a merge commit’s pull request title), its pull request number, and who made it: `me`, `agent` (with `claude` or `codex` when an author or `Co-authored-by` line names one; my agents also commit as themselves at my domain), or `others`. No email addresses. Bots’ commits are left out, the collector’s own included, so a run never makes news of itself; the GitHub observation’s counts leave them out too.
- **Publication log** (`publications/`, added 2026-10-23): every item a thing’s own feed (role `website` or `podcast`) has carried, with its link, title (or opening words, for an untitled post), and date. A feed holds only its newest items, so this log only grows: an item that ages out of the feed stays.

An observation is written only when the evidence changed. Time stamps alone never produce a diff, so a daily run with nothing new is a no-op. A failed fetch keeps the previous observation. Git history is the time series; there is no separate append-only store.

The daily GitHub Actions workflow runs the collector (asking the Internet Archive only on Mondays, since its CDX API rate-limits) and the tests, then opens a pull request with the changed observations, because `main` takes changes only through pull requests with passing checks. Work done with the workflow’s own token starts no other workflow, so the job dispatches the checks on its branch, merges when they pass, and dispatches the deploy on `main`. GitHub does not link a dispatched run’s checks to a pull request, so after each required job passes on the branch’s exact commit, the job copies that result onto the commit as a status of the same name.

## Outputs of the static build

- HTML: index, one page per thing, one per topic, a history page, a timeline, and an activity page. The timeline is server-rendered SVG with a small script for hover and focus.
- `feed.xml` and `feed.json`: the ledger.
- `/activity/` and `activity.xml` (2026-10-23): what landed in each thing, from the commit and publication logs (`collection/activity.ts`). Days and weeks are US Central, a week starts on Monday, and every total counts distinct commits, so a commit two things share is counted once. A thing’s commits are its own repositories’ (a `successor` repository is someone else’s), within the directory a source names. The page shows commits per year split by who made them, then twelve weeks of things with up to three headlines each (tags, then pull request titles, then other subjects). The feed has one item per complete day, the thirty newest, kept apart from the ledger feed so the ledger stays quiet. A thing’s page shows its commits per year and its latest weeks. Activity is evidence; it never sets a status.
- `llms.txt`: one line per thing linking to its Markdown twin. `llms-full.txt`: every thing’s front matter and story concatenated. Each thing is published as both `/things/<id>/` and `/things/<id>.md`, since a static host cannot content-negotiate.
- `things.json`: the registry plus the latest observation for each source, in one file. This is the ingestion surface for Librarian, so Thingy can answer questions about Jamie’s projects without this site running a model.

## What is being retired

The Bedrock guide, its Lambda Web Function, the DynamoDB quota counter, the tailnet editor and its client build, and the CloudFormation template generator for those pieces. Hosting stays on the existing private S3 bucket behind CloudFront; the deploy role shrinks to S3 and CloudFront invalidation. The React application is replaced by Eleventy, which Jamie already runs for the Weekly Thing archive. Until then, `npm run collection:build` regenerates the two JSON files the React site reads from the content tree, so the current site keeps working during the transition.

## Risks

- **Status drift.** Automated signals will disagree with editorial status. Show both; never let the collector change status.
- **Run noise.** Change detection ignores time stamps. If a source emits noisy fields, round or drop them in the adapter.
- **Dead sites.** Retired things should point at Wayback captures or blog project pages, not at hosts that no longer answer. A failed fetch is “no new observation,” not an error in content.
- **Losing the graph.** Decided 2026-10-18: each thing page draws its own neighborhood as build-time SVG with Pele (`collection/diagram.ts`). The site still has no whole-registry graph.
