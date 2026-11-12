// Sync's gadget: what the sync probe saw at its last check, from the status.json the sync site publishes (and serves
// to other origins for this). It shows only what the sync page itself shows, in its words: when the probe checked
// and why, the hop counts, any hop that needs a look, and each receipt, the newest item of a kind and which systems
// hold it. The labels below are the sync page's own (src/evidence.mjs, src/stories.mjs, src/map.mjs and src/time.mjs
// in sync.thingelstad.xyz; the system names are shared/flows.json's). Fetched text only ever goes in as text. A failed
// read says so, keeps what was last shown, and tries again on the next round; it never throws.
const STATUS = 'https://sync.thingelstad.xyz/status.json';
// The probe writes status.json on the half-hour clock and at 2 to 60 minutes after a publication, and the CDN keeps
// it for a minute; five minutes is about as often as it changes.
const EVERY = 5 * 60 * 1000;

const SYSTEM = {
  pinboard: 'Pinboard',
  microblog: 'micro.blog',
  tinylytics: 'Tinylytics',
  'wt-builder': 'WT Builder',
  'library-agent': 'Library Agent',
  weekly: 'Weekly Thing (web)',
  buttondown: 'Buttondown',
  cdn: 'files.thingelstad.com',
  another: 'Another Thing',
  links: 'Linking Things',
  xyz: 'Things I’ve built',
  librarian: 'Librarian',
  thingy: 'Thingy',
  cards: 'cards.thingelstad.com',
  feedbin: 'Feedbin'
};
const KIND = {
  issue: 'Weekly Thing issue',
  post: 'Blog post',
  link: 'Saved link',
  episode: 'Podcast episode',
  audio: 'Audio edition',
  star: 'Feedbin star'
};
const STATE = {
  fresh: 'fresh',
  moving: 'moving',
  late: 'late',
  held: 'held',
  'no-fact': 'no fact yet',
  unknown: 'unknown'
};
const HOLDER = { has: 'Has it', behind: 'Behind', 'no-fact': 'No fact yet', unknown: 'Unknown' };
const COUNTS = [
  ['hops', 'hops'],
  ['fresh', 'fresh'],
  ['moving', 'moving'],
  ['late', 'late'],
  ['held', 'held'],
  ['no_fact', 'no fact yet'],
  ['unknown', 'unknown']
];

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const systemName = (id) => SYSTEM[id] ?? String(id);
const parts = (iso, options) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', ...options })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
// "Sat Oct 24, 7:00 a.m. CDT"
const central = (iso) => {
  const p = parts(iso, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
  return `${p.weekday} ${p.month} ${p.day}, ${p.hour}:${p.minute} ${p.dayPeriod === 'AM' ? 'a.m.' : 'p.m.'} ${p.timeZoneName}`;
};
// "Oct 25"
const centralDay = (iso) => {
  const p = parts(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso, { month: 'short', day: 'numeric' });
  return `${p.month} ${p.day}`;
};
// "20 min", "3 h", "2 d 4 h"
const age = (hours) => {
  hours = Math.max(0, hours);
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return rest ? `${days} d ${rest} h` : `${days} d`;
};

const itemLabel = (kind, item) => {
  if (!item) return '';
  if (item.scope === 'public-registry-snapshot') return `Registry snapshot ${String(item.id).slice(0, 10)}`;
  if (kind === 'issue' || kind === 'audio') return /^\d+$/.test(String(item.id)) ? `WT${item.id}` : String(item.id);
  if (kind === 'link') return item.at ? `saved ${central(item.at)}` : String(item.id);
  if (kind === 'post' && !String(item.title ?? '').trim())
    return item.at ? `post ${centralDay(item.at)}` : String(item.id);
  return item.title ?? String(item.id);
};
const shortItem = (kind, item) => {
  if (kind === 'issue' || kind === 'audio')
    return /^\d+$/.test(String(item.id)) ? `WT${item.id}` : `${kind} ${item.id}`;
  return /^\d+$/.test(String(item.id)) ? `${kind} ${item.id}` : kind;
};
const triggerText = (t) => {
  switch (t?.type) {
    case 'event':
      return `on the published event for the ${t.leg} leg of ${shortItem(t.kind, t)}${t.rehearsal ? ' (a rehearsal: nothing recorded)' : ''}`;
    case 'follow-up':
      return `on the ${t.minutes} min follow-up for the ${t.leg} leg of ${shortItem(t.kind, t)}`;
    case 'received':
      return `on ${systemName(t.system)}’s reported arrival of ${shortItem(t.kind, t)}`;
    case 'ran':
      return `on the ran event of Dagu job ${t.job}`;
    case 'deploy':
      return 'by a deploy';
    case 'manual':
      return 'by hand';
    default:
      return 'on the half-hour clock';
  }
};

// One element, its class and its text or children; text is always set as text.
const el = (tag, className, ...children) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of children) if (child !== null && child !== '') node.append(child);
  return node;
};

function receipt(r) {
  const li = el('li', 'sync-receipt');
  li.append(el('h4', null, KIND[r.kind] ?? String(r.kind)));
  if (!r.item) {
    li.append(el('p', 'muted', `No system publishes a fact for the newest ${r.kind} yet.`));
    return li;
  }
  const label = itemLabel(r.kind, r.item);
  const rest =
    r.item.title && !['post', 'episode', 'star'].includes(r.kind)
      ? String(r.item.title).replace(new RegExp(`^${escapeRegExp(label)}\\s*[—–-]?\\s*`), '')
      : '';
  li.append(el('p', 'sync-item', label, rest ? ' ' : '', rest ? el('span', 'muted', rest) : ''));
  const when = r.item.at && Number.isFinite(r.age_hours) ? `${central(r.item.at)}, ${age(r.age_hours)} ago` : 'undated';
  li.append(el('p', 'muted sync-when', `${when} · from ${systemName(r.origin)}`));
  for (const state of Object.keys(HOLDER)) {
    const holders = (r.holders ?? []).filter((h) => h.state === state);
    if (!holders.length) continue;
    const names = holders
      .map((h) => {
        const name = `${systemName(h.system)}${h.label ? ` (${h.label})` : ''}`;
        return state === 'behind' && h.newest ? `${name} (${itemLabel(h.kind, h.newest)})` : name;
      })
      .join('; ');
    li.append(
      el('p', `sync-holders sync-holders--${state}`, el('span', 'sync-state', `${HOLDER[state]}:`), ` ${names}`)
    );
  }
  return li;
}

function gadget(panel) {
  const checked = panel.querySelector('[data-sync-checked]');
  const counts = panel.querySelector('[data-sync-counts]');
  const open = panel.querySelector('[data-sync-open]');
  const receipts = panel.querySelector('[data-sync-receipts]');
  const error = panel.querySelector('[data-sync-error]');
  let readAt = 0;
  let shown = null; // the checked_at on screen, so an unchanged file is not redrawn
  let reading = false;

  const show = (status) => {
    checked.textContent = `Checked ${central(status.checked_at)}, ${triggerText(status.trigger)}.`;
    counts.replaceChildren(
      ...COUNTS.filter(([key]) => key !== 'unknown' || status.summary.unknown).map(([key, word]) =>
        el('li', `sync-count sync-count--${key}`, el('strong', null, String(status.summary[key] ?? 0)), ` ${word}`)
      )
    );
    const needs = Array.isArray(status.open) ? status.open : [];
    open.replaceChildren(
      ...(needs.length
        ? [
            el(
              'div',
              'sync-attention',
              el('h4', null, 'Needs a look'),
              el(
                'ul',
                null,
                ...needs.map((h) =>
                  el(
                    'li',
                    null,
                    `${systemName(h.from)} → ${systemName(h.to)} · ${h.kind} ${STATE[h.status] ?? h.status}`
                  )
                )
              )
            )
          ]
        : [])
    );
    receipts.replaceChildren(...(Array.isArray(status.receipts) ? status.receipts : []).map(receipt));
    shown = status.checked_at;
  };

  const refresh = async () => {
    if (reading) return;
    reading = true;
    readAt = Date.now();
    try {
      const response = await fetch(STATUS, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`status.json: ${response.status}`);
      const status = await response.json();
      if (!status?.checked_at || !status.summary) throw new Error('status.json has no check in it');
      if (status.checked_at !== shown) show(status);
      error.hidden = true;
    } catch {
      error.textContent = 'The sync page could not be read just now. The gadget tries again in five minutes.';
      error.hidden = false;
      if (!shown) checked.textContent = '';
    } finally {
      reading = false;
    }
  };

  panel.hidden = false;
  refresh();
  setInterval(() => document.hidden || refresh(), EVERY);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - readAt >= EVERY) refresh();
  });
}

for (const panel of document.querySelectorAll('[data-sync-now]')) gadget(panel);
