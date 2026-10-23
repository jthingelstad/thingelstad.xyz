// Search and facets on /search/. The page already lists every thing, each row carrying its facet values
// (data-filters). This loads the Pagefind index the build writes to /pagefind/ (collection/search-index.ts)
// for the words, then narrows, counts and orders the rows here, so the counts always agree with the list.
// Within a facet the choices widen (Python or Go); across facets they narrow (Python and Active). Each count
// says how many things a choice would show, given the words and everything else chosen. The query, filters
// and sort live in the address, so a search can be shared.
const index = '/pagefind/pagefind.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Excerpts are escaped text with <mark> around the matches. Rebuild them as text and mark elements rather
// than parsing them as HTML.
const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };
const decode = (text) => text.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (entity) => entities[entity]);
function excerpt(text) {
  const paragraph = document.createElement('p');
  paragraph.className = 'search-excerpt';
  for (const part of text.split(/(<mark>.*?<\/mark>)/)) {
    const marked = /^<mark>(.*)<\/mark>$/.exec(part);
    if (marked) {
      const mark = document.createElement('mark');
      mark.textContent = decode(marked[1]);
      paragraph.append(mark);
    } else if (part) paragraph.append(decode(part));
  }
  return paragraph;
}

// The passage often opens with the thing's title, which its row already shows above it.
function withoutTitle(paragraph, title) {
  const text = paragraph.textContent;
  if (!text.startsWith(title)) return paragraph;
  let left = title.length + /^[.:!?]?\s*/.exec(text.slice(title.length))[0].length;
  for (const node of [...paragraph.childNodes]) {
    if (left <= 0) break;
    const length = node.textContent.length;
    if (length <= left) node.remove();
    else node.textContent = node.textContent.slice(left);
    left -= length;
  }
  return paragraph;
}

// Pagefind matches the start of a word ("wik" finds wiki), and when no word starts with the whole query it
// shortens the query until one does. "Podcasting" finds podcast, but "avatars" finds every "a". Keep a
// match when a highlighted word starts with a word of the query, or is most of one.
const words = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
function related(term, text) {
  const queried = words(term);
  const marked = [...text.matchAll(/<mark>(.*?)<\/mark>/g)].flatMap((match) => words(decode(match[1])));
  return (
    !marked.length ||
    marked.some((word) =>
      queried.some(
        (query) => word.startsWith(query) || (query.startsWith(word) && word.length >= Math.max(3, query.length - 3))
      )
    )
  );
}

async function start(root) {
  const form = document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-query]');
  const surprise = document.querySelector('[data-search-surprise]');
  const panel = root.querySelector('[data-search-facets]');
  const selectedNote = root.querySelector('[data-search-selected]');
  const clear = root.querySelector('[data-search-clear]');
  const status = root.querySelector('[data-search-status]');
  const sortLabel = root.querySelector('[data-search-sort-label]');
  const sortSelect = root.querySelector('[data-search-sort]');
  const list = root.querySelector('[data-search-results]');
  // The rows, in the page's order (A to Z), each with its facet values.
  const things = [...list.children].map((row) => {
    const values = new Map();
    for (const pair of row.dataset.filters.split(' ').filter(Boolean)) {
      const [name, value] = pair.split(':');
      values.set(name, (values.get(name) ?? new Set()).add(value));
    }
    return { row, page: row.dataset.page, started: row.dataset.started ?? '', values };
  });
  const byPage = new Map(things.map((thing) => [thing.page, thing]));
  const facets = [...root.querySelectorAll('[data-facet]')].map((element) => ({
    name: element.dataset.facet,
    buttons: [...element.querySelectorAll('button[data-value]')]
  }));

  // State from the address: ?q=wiki&status=active&topic=poap&topic=mcp&sort=newest
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') ?? '';
  const selected = new Map(
    facets.map((facet) => {
      const known = new Set(facet.buttons.map((button) => button.dataset.value));
      return [facet.name, new Set(params.getAll(facet.name).filter((value) => known.has(value)))];
    })
  );
  const sorts = ['match', 'title', 'newest', 'oldest'];
  let sort = sorts.includes(params.get('sort')) ? params.get('sort') : '';

  status.textContent = 'Loading the search…';
  let pagefind;
  try {
    pagefind = await import(index);
    await pagefind.options({ excerptLength: 26 });
    pagefind.init();
  } catch {
    status.textContent = 'Search could not load. Every thing I’ve built is listed below.';
    return;
  }
  form.hidden = false;
  panel.hidden = false;
  sortLabel.hidden = false;
  // The filters sit beside the list on a wide screen and fold away above it on a narrow one.
  const wide = matchMedia('(min-width: 900px)');
  panel.open = wide.matches || [...selected.values()].some((values) => values.size);
  wide.addEventListener('change', () => (panel.open = wide.matches));

  // Does a thing pass every facet with a choice, leaving one out?
  const passes = (thing, except) =>
    [...selected].every(
      ([name, values]) =>
        name === except || !values.size || [...values].some((value) => thing.values.get(name)?.has(value))
    );

  const writeAddress = (term) => {
    const next = new URLSearchParams();
    if (term) next.set('q', term);
    for (const [name, values] of selected) for (const value of values) next.append(name, value);
    if (sort) next.set('sort', sort);
    const query = next.toString();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
  };

  let run = 0;
  async function update() {
    const current = ++run;
    const term = input.value.trim();
    writeAddress(term);
    // The things the words match, best first, each with the passage that matched; every thing without words.
    let excerpts = null;
    if (term) {
      const search = await pagefind.search(term);
      const found = await Promise.all(search.results.map((result) => result.data()));
      if (current !== run) return;
      excerpts = new Map(found.filter((data) => related(term, data.excerpt)).map((data) => [data.url, data.excerpt]));
    }
    const candidates = excerpts ? [...excerpts.keys()].flatMap((page) => byPage.get(page) ?? []) : things;

    let shown = candidates.filter((thing) => passes(thing));
    const order = sort === 'match' && !term ? 'title' : sort || (term ? 'match' : 'title');
    if (order === 'title') shown = things.filter((thing) => shown.includes(thing));
    else if (order !== 'match') {
      // Undated things go last either way.
      const direction = order === 'newest' ? -1 : 1;
      const undated = (thing) => (thing.started ? 0 : 1);
      shown = shown.toSorted((a, b) => undated(a) - undated(b) || direction * a.started.localeCompare(b.started));
    }
    sortSelect.value = order;
    sortSelect.querySelector('[value="match"]').disabled = !term;

    // With words, the passage that matched takes the place of the summary.
    for (const thing of things) {
      thing.row.hidden = !shown.includes(thing);
      thing.row.querySelector('.search-excerpt')?.remove();
      const text = excerpts?.get(thing.page);
      const summary = thing.row.querySelector('.thing-summary');
      summary.hidden = Boolean(text);
      if (text) summary.after(withoutTitle(excerpt(text), thing.row.querySelector('.thing-title').textContent));
    }
    list.append(...shown.map((thing) => thing.row));

    // A facet with a choice is counted without its own choice, so its other values say what they would add.
    for (const facet of facets)
      for (const button of facet.buttons) {
        const value = button.dataset.value;
        const n = candidates.filter(
          (thing) => passes(thing, facet.name) && thing.values.get(facet.name)?.has(value)
        ).length;
        const pressed = selected.get(facet.name).has(value);
        button.setAttribute('aria-pressed', String(pressed));
        button.disabled = !n && !pressed;
        const count = button.querySelector('[data-count]');
        if (count) count.textContent = String(n);
        else {
          // A year's bar: its fill is the things it would show, inside its outline of every thing begun then.
          button.style.setProperty('--n', String(n));
          button.title = `${button.dataset.label}: ${plural(n, 'thing')}`;
          button.setAttribute('aria-label', `Started ${button.dataset.label}, ${plural(n, 'thing')}`);
        }
      }

    const choices = [...selected.values()].reduce((sum, values) => sum + values.size, 0);
    selectedNote.textContent = choices ? ` (${choices} chosen)` : '';
    clear.hidden = !term && !choices;
    status.textContent = shown.length
      ? term || choices
        ? `${shown.length} of ${plural(things.length, 'thing')}${term ? ` match “${term}”` : ''}`
        : `All ${plural(things.length, 'thing')}`
      : `Nothing I’ve built matches${term ? ` “${term}”` : ''}${choices ? ' with these filters' : ''}.`;
  }

  let typing;
  input.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(update, 180);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(typing);
    update();
  });
  for (const facet of facets)
    for (const button of facet.buttons)
      button.addEventListener('click', () => {
        const values = selected.get(facet.name);
        if (!values.delete(button.dataset.value)) values.add(button.dataset.value);
        update();
      });
  sortSelect.addEventListener('change', () => {
    sort = sortSelect.value;
    update();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    for (const values of selected.values()) values.clear();
    sort = '';
    update();
    input.focus();
  });
  // Off to one of the things on the list, at random.
  surprise.addEventListener('click', () => {
    const visible = things.filter((thing) => !thing.row.hidden);
    const pick = visible[Math.floor(Math.random() * visible.length)];
    if (pick) location.assign(pick.page);
  });
  await update();
}

const root = document.querySelector('[data-search]');
if (root) start(root);
