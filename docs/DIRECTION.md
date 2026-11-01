# Direction: Things I’ve Built as a content repository

Things I’ve Built is an index and archive of Jamie’s projects, including the ones he has stepped away from. The site is a durable static site that is easy to update weekly or monthly, with an RSS feed and `llms.txt`. thingelstad.xyz is where Jamie keeps point-in-time project things, and this site is the index of them.

The first version wrapped a small dataset in a React application, a Lambda guide, and a private editor. Producing and refreshing content was the expensive step. This direction makes content the center and treats rendering as a build.

## Three layers, three owners

| Layer        | Where                                                                                                                                                                                    | Nature                                                                                                                                                                                        | Who writes it                           | Cadence                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Registry     | `content/things/*.md`, `content/topics.yaml`, `content/featured.yaml`, `content/artifacts/<id>/*`                                                                                        | Things, sources, connections, topics, the featured shelf, artifacts                                                                                                                           | Jamie or an agent, in Markdown and YAML | Monthly                                            |
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
bundles: # optional; named groups of the artifacts, shown in this order
  - id: early-days
    title: The early days
    caption: What it looked like in its first year.
artifacts: # optional; files from the project itself, in content/artifacts/<id>/
  - file: masthead-logo.png
    bundle: early-days # required once the thing has bundles
    title: The masthead
    caption: The logo and its tagline, from the top of every page.
    date: 2009-05
    source: https://www.thingelstad.com/2009/05/12/introducing-velotweets-the.html
  - file: jerseys.zip
    preview: jerseys.png # an image of a file a browser cannot show
    title: Jersey icons
---
The body is the idea behind the thing, in Markdown.
```

The site is Jamie speaking about his own work. Summaries, bodies, connection details and ledger summaries are written in the first person (I, my, we), never “Jamie” or “he”. Quotations stay verbatim; only their attribution changes. The `story.questions` are a reader’s, so they stay in the third person.

### Stories

A story (`content/stories/<id>.md`) is one idea told across several things, for a reader who would otherwise meet them one at a time: Road Sign Math across its three sites and twenty-one years, three runs at a links site, Your Version Number growing into Release Notes and Changelog, how the Weekly Thing gets made. It is told in Thingy’s voice, in the third person, from the records and Jamie’s published writing, and adds no fact the records do not have.

```yaml
---
title: Twenty-one years of Road Sign Math
summary: One sign on I-94 in 2005 became a website, then a wiki, ... Three things, one game.
things: # in the order the story tells them; at least two
  - road-sign-math
  - road-sign-math-2021
  - road-sign-math-2026
started: '2005-02-13' # otherwise the earliest of its things
# ended: when the story has; otherwise it is still going while any of its things is
---
The story, in Markdown.
```

The page lists the things in that order, then the story, then every history event of those things, oldest first. A thing’s facts link the stories it is in. The front page and `/stories/` show the cards, the story with the newest event first. Stories are in the sitemap, `llms.txt` and `things.json`. A story never sets a status or adds an event: it reads the ledger, it does not write it.

### Voice

Since 2026-11-01 the site is written and kept by Thingy, Jamie’s librarian. Jamie asked for it on 2026-10-31 (“the site authored and run by Thingy”) and gave the go on 2026-11-01 after reading Thingy’s interview with him: “go ahead and redraft the website in Thingy’s voice and bring in Thingy’s personality.” Before that the pages were written as Jamie, in the first person; that pass (2026-10-31) is gone, and its one lasting rule stays: never invent a feeling he did not publish.

Thingy’s character is the print persona kept in the Librarian (`docs/THINGY.md` restates it for this site): a small, cheerful robot librarian who has read every word Jamie has published and is glad about it, and who is not Jamie. On this site that means:

- Third person about Jamie (Jamie, he/him). Thingy says “I” only where it introduces itself, on `/about/`. Page ledes, status words, the footer, the 404 and the machine outputs name Jamie or are impersonal.
- The archive librarian’s register: composed and warm where Jamie writes loose. Open with the thing and what it is. Short declarative sentences, links on natural phrases, dates as words, never ISO in prose. Delight is a kept detail, not an adjective.
- Specific or silent. No superlatives, no hype words, no marketing, no emoji, no imperatives. No speculation about Jamie’s mood, family or motives beyond what a cited source shows.
- A “why” is Jamie’s. Quote him verbatim and link where he wrote or said it: a post, an issue of the Weekly Thing, or a question of an interview (`/interviews/<id>/#qN`). Where he never said why, say what the thing is and stop. The archivist’s hedges (“no public source says”, “most likely”) stay out; so does a guess dressed as a fact.
- His things are things. He said what the word means (question 2: “a purpose, a story, a reason that it exists”) and what it is not (question 8: not a hustle, not a business, built “for the love of doing it”). Never hustle, side project, startup, monetize, growth or an economic frame.
- Jamie stays the author of record: his h-card is every entry’s p-author and the footer names him first, then Thingy’s byline. `/about/` is Thingy’s introduction and says who writes what.

Status words, Jamie’s own from questions 3 and 28 of the interview:

- **active**: Jamie is building or running it.
- **dormant**: still available, but Jamie is not working on it right now. It may come back.
- **retired**: no longer available. Jamie ended it on purpose.
- **abandoned**: Jamie left it before it worked out. Jamie decides this one, like every status.
- **archived**: finished. It came to a natural conclusion and is kept as it is. Books, events, and one-time projects.

### Interviews

An interview (`content/interviews/<id>.md`, `/interviews/<id>/`) is Thingy asking and Jamie answering by voice, published as he spoke it. The first, `jamie-october-2026`, is thirty-five questions over two days (2026-10-31 and 2026-11-01); the brief that ran it is `docs/INTERVIEW.md`. It exists so the site can quote Jamie on why he built things without putting words in his mouth: every “why” on a page is a quotation linked to its question.

Jamie called everything in it publishable (2026-11-01: “you can quote the interview at length … you can quote pull quotes from this interview”), so a page may quote him at length, and every quotation links its question. Two forms, both checked by `tests/quotes.test.ts` against the transcript: inline, a link whose text is the quotation in curly quotes (`[“his words”](/interviews/<id>/#qN)`); and block, a blockquote of his words whose last paragraph is the attribution link (`[Jamie, question N](/interviews/<id>/#qN)`). A quotation is verbatim; `…` may join parts of one answer, in order. A page quotes only questions that are about it (the question’s `things` in the interview’s front matter), so the “In his words” row on the thing lists every question the page draws on.

```yaml
---
title: Jamie on the things he built
summary: One or two sentences.
started: '2026-10-31'
ended: '2026-11-01'
notes:
  - What was done to the transcript, so a reader knows.
questions:
  - n: 9
    things:
      - road-sign-math
---
## Session 1

### 1. The question, as asked.

**Jamie:** The answer, as spoken.
```

The transcript is a source, not a page Thingy writes: on the way in only filler words come out and misheard names are fixed, each such change named in `notes`; after that it is never rewritten. A later correction is another note, and another sitting is another file. The page gives every question the address `#qN` (the number, so a reworded question keeps its link), lists the questions first, and shows the things a question is about as tags under it; a thing’s facts carry “In his words” with links to its questions. Interviews are in the sitemap, `llms.txt` (`## Interviews`) and `things.json` (`interviews`, each question with its URL). Not in the header nav.

Sources are inline. Two things that name the same repository or URL share one observation; the collector stores it once. A GitHub source can carry a `path` to scope activity to a directory. A website source can carry a `sitemap` and a `feed`, which is what makes it observable. A website without either is a reference only.

Connections live on the thing they start from. Topics are a short list in `topics.yaml` with an ID, a title, and a description; membership is declared on each thing.

Artifacts (added 2026-10-24, Jamie: “We should allow any kind of artifact. Images, archives, files.”) are files from a project itself, kept to make its page richer, never to bring it back: a logo, a screenshot from its time, a design file, an archive of icons. They live in `content/artifacts/<id>/`, and the thing lists each one under `artifacts` with a `file` (a lowercase name with an extension), a `title`, and optionally a `caption`, a `date`, a public `source` page that shows or describes it, and, for a file a browser cannot show, a `preview` image in the same folder. The folder holds exactly the files its record lists (the Finder’s dotfiles aside), each up to 25 MB; the loader checks that and reads each image’s size from its header (`collection/load.ts`, `collection/artifacts.ts`). The build publishes the files unchanged at `/things/<id>/artifacts/<file>`, an address that stays good for as long as the thing does. The page shows them as a grid of cards, each image or preview in a white frame with the file’s name, kind, size and date, and the Markdown twin and `things.json` list them with their URLs. Images, PDFs, ZIP archives and text (Markdown as plain text) are served as what they are; anything else, HTML and SVG included, as `application/octet-stream`, so an old project’s page or script never runs as part of this site. The repository is public, so an artifact is published when it is committed: read a file before adding it, and keep credentials, private data, and licensed stock art out.

Bundles (added 2026-10-30, Jamie: “If we could have multiple “bundles” of artifacts it would be awesome to include the plan we used to build it out. Various screen shots before and after design.”) group a thing’s artifacts when one grid would hide the story: a plan, the first scaffold, the screens before a redesign and after it. The thing lists them under `bundles`, each with an `id` (a lowercase, hyphenated id), a `title` and optionally a `caption`, and each artifact names its `bundle`. They are all or nothing: once a thing has bundles, every artifact is in one and none is empty, and a thing without them names none (`collection/validate.ts`). The page shows each bundle under its own heading, in the listed order, with its artifacts in theirs and an anchor at `#artifacts-<id>`; the Markdown twin and `things.json` carry `bundles` as written, and each artifact its `bundle`. Files stay in the one flat folder, so a bundle never changes an artifact’s address.

The featured shelf (added 2026-10-24, Jamie: “I need a way on the site to show the FEATURED projects… things like Release Notes and Elixir that are actively being used and promoted”) is `content/featured.yaml`: a list of `thing:` IDs, in the order the front page shows them, above the full index. Featured is a decision of its own, like status, and the collector never sets it: 26 things are active, and the shelf is the few I want a visitor to see first. It holds at most six things, each once and each active. Each card leads with the site’s front page as the collector last captured it (or the sticker on the story colour when there is no capture), its title leads to the thing’s page, and a second link goes straight to the thing’s own address. Those links carry `?ref=xyz-featured` when Tinylytics counts the site, so its Sources report shows what the shelf sends; any other address, a GitHub repository say, stays as the record has it. Release Notes counts only the path of each page and drops the query by design, so there the shelf shows up only as the referring site. `things.json` lists the shelf as `featured`, and `llms.txt` opens with it.

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

- HTML: index (the featured shelf, then every thing by collection), one page per thing, one per topic, a history page, a timeline, and an activity page. The timeline is server-rendered SVG with a small script for hover and focus.
- `feed.xml` and `feed.json`: the ledger.
- `/activity/` and `activity.xml` (2026-10-23): what landed in each thing, from the commit and publication logs (`collection/activity.ts`). Days and weeks are US Central, a week starts on Monday, and every total counts distinct commits, so a commit two things share is counted once. A thing’s commits are its own repositories’ (a `successor` repository is someone else’s), within the directory a source names. The page shows commits per year split by who made them, then twelve weeks of things with up to three headlines each (tags, then pull request titles, then other subjects). The feed has one item per complete day, the thirty newest, kept apart from the ledger feed so the ledger stays quiet. A thing’s page shows its commits per year and its latest weeks. Activity is evidence; it never sets a status.
- `llms.txt`: the featured things first, then one line per thing linking to its Markdown twin. `llms-full.txt`: every thing’s front matter and story concatenated. Each thing is published as both `/things/<id>/` and `/things/<id>.md`, since a static host cannot content-negotiate.
- `things.json`: the registry plus the latest observation for each source, in one file. This is the ingestion surface for Librarian, so Thingy can answer questions about Jamie’s projects without this site running a model.

## What is being retired

The Bedrock guide, its Lambda Web Function, the DynamoDB quota counter, the tailnet editor and its client build, and the CloudFormation template generator for those pieces. Hosting stays on the existing private S3 bucket behind CloudFront; the deploy role shrinks to S3 and CloudFront invalidation. The React application is replaced by Eleventy, which Jamie already runs for the Weekly Thing archive. Until then, `npm run collection:build` regenerates the two JSON files the React site reads from the content tree, so the current site keeps working during the transition.

## Risks

- **Status drift.** Automated signals will disagree with editorial status. Show both; never let the collector change status.
- **Run noise.** Change detection ignores time stamps. If a source emits noisy fields, round or drop them in the adapter.
- **Dead sites.** Retired things should point at Wayback captures or blog project pages, not at hosts that no longer answer. A failed fetch is “no new observation,” not an error in content.
- **Losing the graph.** Decided 2026-10-18: each thing page draws its own neighborhood as build-time SVG with Pele (`collection/diagram.ts`). The site still has no whole-registry graph.
