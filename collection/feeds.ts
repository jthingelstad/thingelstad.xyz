// The model as feeds: the quiet history ledger (RSS and JSON Feed) and the daily activity feed.
import { activitySummary, type ActivityDay } from './activity';
import { escapeHtml } from './html';
import { formatDate, toInstant, type SiteModel } from './site';
import { eventPage, weekPage } from './years';

function rfc822(instant: string) {
  return new Date(instant).toUTCString();
}

// The ledger as a feed: what changed in what Jamie has built, newest first.
type FeedItem = {
  id: string;
  url: string;
  title: string;
  summary: string;
  html: string;
  date: string; // as written
  instant: string;
  things: { id: string; title: string; page: string }[];
  source: string;
};
function feedItems(model: SiteModel): FeedItem[] {
  const byId = new Map(model.things.map((thing) => [thing.id, thing]));
  return model.history.map((event) => {
    const things = event.things.flatMap((id) => {
      const thing = byId.get(id);
      return thing ? [{ id, title: thing.title, page: `${model.url}${thing.page}` }] : [];
    });
    const links = things.map((t) => `<a href="${t.page}">${escapeHtml(t.title)}</a>`).join(', ');
    return {
      id: event.id,
      url: `${model.url}${eventPage(event)}`,
      title: event.title,
      summary: event.summary,
      html: `<p>${escapeHtml(event.summary)}</p><p>${formatDate(event.date)} · ${event.kind} · ${links}</p><p><a href="${escapeHtml(event.source)}">Source</a></p>`,
      date: event.date,
      instant: toInstant(event.date),
      things,
      source: event.source
    };
  });
}
export function jsonFeed(model: SiteModel) {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${model.title} History`,
    home_page_url: `${model.url}/`,
    feed_url: `${model.url}/feed.json`,
    description: 'What changed in the things Jamie Thingelstad has built, newest first, each with its source.',
    authors: [{ name: 'Jamie Thingelstad', url: 'https://www.thingelstad.com/' }],
    items: feedItems(model).map((item) => ({
      id: item.id,
      url: item.url,
      external_url: item.source,
      title: item.title,
      content_html: item.html,
      summary: item.summary,
      date_published: item.instant,
      tags: item.things.map((thing) => thing.title)
    }))
  };
}
// RSS carries the newest events, enough for a reader to catch up; feed.json and the year pages carry them all.
export const rssItems = 30;
export function rssFeed(model: SiteModel) {
  const items = feedItems(model).slice(0, rssItems);
  const newest = items[0]?.instant ?? model.generated;
  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="false">${escapeHtml(item.id)}</guid>
      <pubDate>${rfc822(item.instant)}</pubDate>
      <description>${escapeHtml(item.html)}</description>
${item.things.map((thing) => `      <category>${escapeHtml(thing.title)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(model.title)} History</title>
    <link>${model.url}/</link>
    <atom:link href="${model.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>What changed in the things Jamie Thingelstad has built, newest first, each with its source.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}

// The activity feed: one item a day, for the newest complete days with something in them. It is kept apart
// from the history feed, which stays quiet: this one is evidence, collected every day.
const activityFeedPath = '/activity.xml';
function activityItem(model: SiteModel, day: ActivityDay) {
  const names = day.things.map((t) => t.title);
  const title = `${formatDate(day.day)}: ${
    names.length <= 3
      ? names.join(', ').replace(/, ([^,]*)$/, ' and $1')
      : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
  }`;
  const link = (url: string) => (url.startsWith('/') ? `${model.url}${url}` : url);
  const things = day.things
    .map((thing) => {
      const lines = [...thing.headlines, ...thing.published]
        .map((line) => `<li><a href="${escapeHtml(link(line.url))}">${escapeHtml(line.text)}</a></li>`)
        .join('');
      const more =
        thing.more > 0
          ? `<p>${thing.moreUrl ? `<a href="${escapeHtml(thing.moreUrl)}">` : ''}And ${thing.more} more ${thing.more === 1 ? 'commit' : 'commits'}${thing.moreUrl ? ' on GitHub</a>' : ''}.</p>`
          : '';
      return `<li><p><a href="${model.url}${thing.page}">${escapeHtml(thing.title)}</a>: ${escapeHtml(activitySummary(thing))}.</p>${lines ? `<ul>${lines}</ul>` : ''}${more}</li>`;
    })
    .join('');
  return {
    title,
    url: `${model.url}${weekPage(day.week)}`,
    id: `activity-${day.day}`,
    instant: day.last,
    html: `<p>${escapeHtml(activitySummary(day))}.</p><ul>${things}</ul>`,
    things: day.things.map((t) => t.title)
  };
}
export function activityRss(model: SiteModel) {
  const items = model.activity.days.map((day) => activityItem(model, day));
  const newest = items[0]?.instant ?? model.generated;
  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="false">${item.id}</guid>
      <pubDate>${rfc822(item.instant)}</pubDate>
      <description>${escapeHtml(item.html)}</description>
${item.things.map((thing) => `      <category>${escapeHtml(thing)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(model.title)} Activity</title>
    <link>${model.url}/years/</link>
    <atom:link href="${model.url}${activityFeedPath}" rel="self" type="application/rss+xml"/>
    <description>What landed in what Jamie Thingelstad has built, one item a day: commits to each thing’s public repositories, with who made them, and what its feeds published.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}
