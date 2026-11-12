// Linking Things' gadget: links Jamie saved on this day in earlier years, and a random saved link, read in the
// reader's browser from Linking Things' day files (/on/MM-DD.json: every link saved on one calendar day in any year,
// a few dozen at most, newest first). Today's file is read once a visit; a random link reads one more day.
// A note is Jamie's only when its voice is "jamie" (Linking Things' src/lib/voice.ts): an excerpt is the page's words,
// a mixed note quotes the page inside his, and an agent's note is a summary written for him, so none of those is
// shown as his. Links carry ?ref=xyz-gadget, like every link from this site to another of Jamie's. A failed read says
// so in the gadget and never throws.
const ZONE = 'America/Chicago'; // Linking Things files a link under its US Central calendar day
const SHOWN = 6; // at most this many earlier years on the day
const NOTE_LENGTH = 220;

const parts = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const today = () => {
  const { year, month, day } = Object.fromEntries(parts.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { year: Number(year), key: `${month}-${day}` };
};
// Every day a year can have, 29 February too, as Linking Things names its files.
const DAYS = Array.from({ length: 366 }, (_, i) => {
  const date = new Date(Date.UTC(2024, 0, 1 + i));
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
});

const yearOf = (link) => Number(String(link.day).slice(0, 4));
const isJamie = (link) => link.voice === 'jamie' && typeof link.note === 'string' && link.note.trim() !== '';
// The links Linking Things' Surprise me draws from: a note in Jamie's voice (his own or around a quotation), or a
// Weekly Thing issue that carried it.
const isPick = (link) => link.voice === 'jamie' || link.voice === 'mixed' || (link.issues?.length ?? 0) > 0;

// A note as one line of plain text: Markdown links keep their words, emphasis marks go, and a long note is cut at a
// word with an ellipsis.
const plain = (note) => {
  const text = note
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= NOTE_LENGTH) return text;
  const cut = text.slice(0, NOTE_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : NOTE_LENGTH).replace(/[\s,.;:]+$/, '')}…`;
};

const withRef = (url, ref) => {
  const link = new URL(url);
  link.searchParams.set('ref', ref);
  return link.href;
};

// One earlier year's link for each of up to SHOWN years, spread from the oldest year to the newest, newest first; in
// a year, a link with Jamie's note comes before one an issue carried, and that before the rest.
const choose = (links) => {
  const byYear = new Map();
  for (const link of links) byYear.set(yearOf(link), [...(byYear.get(yearOf(link)) ?? []), link]);
  const years = [...byYear.keys()].sort((a, b) => b - a);
  const picked =
    years.length <= SHOWN
      ? years
      : [
          ...new Set(Array.from({ length: SHOWN }, (_, i) => years[Math.round((i * (years.length - 1)) / (SHOWN - 1))]))
        ];
  const rank = (link) => (isJamie(link) ? 0 : (link.issues?.length ?? 0) > 0 ? 1 : 2);
  return picked.map((year) => [...byYear.get(year)].sort((a, b) => rank(a) - rank(b))[0]);
};

function gadget(panel) {
  const site = panel.dataset.site;
  const ref = new URL(panel.dataset.ref).searchParams.get('ref');
  const status = panel.querySelector('[data-links-status]');
  const dayList = panel.querySelector('[data-links-day]');
  const pickList = panel.querySelector('[data-links-pick]');
  const button = panel.querySelector('[data-links-random]');
  const days = new Map(); // MM-DD to its file's promise, so a day is read once a visit

  const readDay = (key) => {
    if (!days.has(key)) {
      const read = fetch(new URL(`on/${key}.json`, site), { signal: AbortSignal.timeout(15_000) }).then(
        async (response) => {
          if (!response.ok) throw new Error(`on/${key}.json: ${response.status}`);
          const body = await response.json();
          if (!Array.isArray(body.links)) throw new Error(`on/${key}.json: no links`);
          return body;
        }
      );
      read.catch(() => days.delete(key)); // a failed read is tried again next time
      days.set(key, read);
    }
    return days.get(key);
  };

  const item = (link) => {
    const li = document.createElement('li');
    const title = document.createElement('a');
    title.href = withRef(link.record, ref);
    title.textContent = link.title?.trim() || new URL(link.url).hostname;
    const year = document.createElement('span');
    year.className = 'links-year';
    year.textContent = String(yearOf(link));
    li.append(title, ' ', year);
    if (isJamie(link)) {
      const note = document.createElement('p');
      note.className = 'links-note';
      note.textContent = plain(link.note);
      li.append(note);
    }
    return li;
  };

  const showToday = async () => {
    const now = today();
    try {
      const body = await readDay(now.key);
      const earlier = body.links.filter((link) => yearOf(link) < now.year);
      const years = new Set(earlier.map(yearOf));
      const page = document.createElement('a');
      page.href = withRef(body.page, ref);
      if (!earlier.length) {
        page.textContent = `Every link saved on ${body.label}`;
        status.replaceChildren(`Nothing was saved on ${body.label} in an earlier year. `, page, '.');
        dayList.replaceChildren();
        return;
      }
      page.textContent = earlier.length === 1 ? 'See it' : 'See them all';
      const count = earlier.length === 1 ? 'One link was' : `${earlier.length.toLocaleString('en-US')} links were`;
      const span = years.size === 1 ? 'one earlier year' : `${years.size} earlier years`;
      status.replaceChildren(`${count} saved on ${body.label} in ${span}. `, page, '.');
      dayList.replaceChildren(...choose(earlier).map(item));
    } catch {
      status.textContent = 'Linking Things could not be reached just now. It is read once a visit.';
      dayList.replaceChildren();
    }
  };

  const random = async () => {
    button.disabled = true;
    try {
      for (let tries = 0; tries < 4; tries++) {
        const body = await readDay(DAYS[Math.floor(Math.random() * DAYS.length)]);
        const pool = body.links.filter(isPick);
        if (!pool.length) continue;
        pickList.replaceChildren(item(pool[Math.floor(Math.random() * pool.length)]));
        return;
      }
      throw new Error('no link to pick');
    } catch {
      const li = document.createElement('li');
      li.className = 'links-failed';
      li.textContent = 'Linking Things could not be reached just now. Try again in a moment.';
      pickList.replaceChildren(li);
    } finally {
      button.disabled = false;
    }
  };

  panel.hidden = false;
  button.addEventListener('click', random);
  showToday();
}

for (const panel of document.querySelectorAll('[data-links-gadget]')) gadget(panel);
