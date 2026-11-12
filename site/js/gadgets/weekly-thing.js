// The Weekly Thing's gadget: the latest issue and the last 52 weeks of sends, from the newsletter's own JSON Feed, read
// once a visit in the reader's browser (the feed changes once a week). It shows only what has been sent. A countdown
// or a "next issue" line would promise readers a send time, which is Jamie's to promise, so there is none. Links to
// the newsletter carry ?ref=xyz-gadget, like every link from this site to another of Jamie's. A failed read says so
// in the gadget and never throws.
const WEEKS = 52;
const DAY = 86_400_000;
const ZONE = 'America/Chicago'; // the newsletter's calendar: issues go out on Saturday mornings in Minnesota

const longDate = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});
const shortDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
const parts = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: 'numeric', day: 'numeric' });

// The day an instant falls on in Minnesota, as a count of days, so weeks and "days ago" follow the local calendar.
const localDay = (date) => {
  const { year, month, day } = Object.fromEntries(parts.formatToParts(date).map((p) => [p.type, p.value]));
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY;
};
// The Monday that starts a day's week (1970-01-01, day 0, was a Thursday).
const weekOf = (day) => day - ((day + 3) % 7);

const ago = (days) => {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30.44);
  return months < 24 ? `${months} months ago` : `${Math.round(days / 365.25)} years ago`;
};

const withRef = (url, ref) => {
  const link = new URL(url);
  link.searchParams.set('ref', ref);
  return link.href;
};

async function gadget(panel) {
  const latestText = panel.querySelector('[data-weekly-latest]');
  const countText = panel.querySelector('[data-weekly-count]');
  const cells = [...panel.querySelectorAll('.weekly-weeks li')];
  const ref = new URL(panel.dataset.ref).searchParams.get('ref');
  panel.hidden = false;
  try {
    const response = await fetch(panel.dataset.feed, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`feed: ${response.status}`);
    const issues = (await response.json()).items
      .map((item) => ({
        number: Number(/\/archive\/(\d+)\//.exec(item.url)?.[1]),
        title: item.title,
        url: item.url,
        date: new Date(item.date_published)
      }))
      .filter((issue) => Number.isFinite(issue.number) && !Number.isNaN(issue.date.getTime()))
      .sort((a, b) => b.date - a.date);
    if (!issues.length) throw new Error('feed: no issues');

    const today = localDay(new Date());
    const latest = issues[0];
    const link = document.createElement('a');
    link.href = withRef(latest.url, ref);
    link.textContent = latest.title;
    latestText.replaceChildren(
      link,
      ` went out on ${longDate.format(latest.date)}, ${ago(today - localDay(latest.date))}.`
    );

    // One cell a week, oldest on the left and this week on the right; a cell is filled when an issue went out in it.
    const thisWeek = weekOf(today);
    const byWeek = new Map();
    for (const issue of issues) {
      const week = weekOf(localDay(issue.date));
      byWeek.set(week, [...(byWeek.get(week) ?? []), issue]);
    }
    let sent = 0;
    for (const [i, cell] of cells.entries()) {
      const week = thisWeek - (WEEKS - 1 - i) * 7;
      const there = byWeek.get(week) ?? [];
      cell.classList.toggle('is-sent', there.length > 0);
      cell.title = `Week of ${shortDate.format(new Date(week * DAY))}${
        there.length ? `: ${there.map((issue) => `WT${issue.number}`).join(', ')}` : ', no issue'
      }`;
      sent += there.length;
    }
    countText.textContent = `${sent === 0 ? 'No issues' : sent === 1 ? 'One issue' : `${sent} issues`} in the last ${WEEKS} weeks.`;
  } catch {
    latestText.textContent = 'The newsletter’s feed could not be reached just now. It is read once a visit.';
    countText.textContent = '';
  }
}

for (const panel of document.querySelectorAll('[data-weekly-gadget]')) gadget(panel);
