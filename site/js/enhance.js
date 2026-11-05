// What a script adds to pages that already read without one: the arrows on a shelf, the current place on a contents
// rail, and the filter chips over a list. Each list item carries its values in data-filters ("status:active topic:mcp "), and a page's chosen values
// stay in its address, so a filtered list can be shared (and /topics/<id>/ can redirect to one).
for (const element of document.querySelectorAll('[data-enhanced]')) element.hidden = false;

for (const shelf of document.querySelectorAll('[data-shelf]')) {
  const track = shelf.querySelector('.shelf-track');
  for (const button of shelf.querySelectorAll('[data-shelf-move]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const distance = Math.max(240, track.clientWidth * 0.8);
      track.scrollBy({ left: Number(button.dataset.shelfMove) * distance, behavior: motion });
    });
  }
}

// A contents rail marks the part of the page being read. Without a script it is still a list of links.
for (const rail of document.querySelectorAll('[data-toc]')) {
  const links = new Map();
  for (const link of rail.querySelectorAll('a[href^="#"]')) {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target) links.set(target, link);
  }
  const mark = (target) => {
    for (const link of links.values()) {
      link.classList.toggle('is-current', links.get(target) === link);
      if (links.get(target) === link) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };
  // The reader's place is the last section begun within the top quarter of the window, in either direction.
  const inBand = new Set();
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inBand.add(entry.target);
        else inBand.delete(entry.target);
      }
      const current = [...links.keys()].filter((target) => inBand.has(target)).at(-1);
      if (current) mark(current);
    },
    { rootMargin: '0px 0px -75% 0px' }
  );
  for (const target of links.keys()) seen.observe(target);
}

for (const scope of document.querySelectorAll('[data-filter-scope]')) {
  const axes = [...scope.querySelectorAll('[data-filter-axis]')];
  if (!axes.length) continue;
  const items = [...scope.querySelectorAll('[data-filter-item]')];
  const groups = [...scope.querySelectorAll('[data-filter-group]')];
  const whens = [...scope.querySelectorAll('[data-filter-when]')];
  const status = scope.querySelector('[data-filter-status]');
  const none = scope.querySelector('[data-filter-none]');
  const params = new URLSearchParams(location.search);
  const chosen = new Map();
  for (const axis of axes) {
    const name = axis.dataset.filterAxis;
    const wanted = params.get(name) ?? '';
    const known = [...axis.querySelectorAll('[data-value]')].some((chip) => chip.dataset.value === wanted);
    chosen.set(name, known ? wanted : '');
  }
  const render = () => {
    const required = [...chosen].filter(([, value]) => value).map(([name, value]) => `${name}:${value}`);
    let shown = 0;
    for (const item of items) {
      const values = item.dataset.filters.split(' ');
      item.hidden = !required.every((value) => values.includes(value));
      if (!item.hidden) shown++;
    }
    for (const group of groups) group.hidden = !group.querySelector('[data-filter-item]:not([hidden])');
    for (const axis of axes)
      for (const chip of axis.querySelectorAll('[data-value]'))
        chip.setAttribute('aria-pressed', String(chip.dataset.value === chosen.get(axis.dataset.filterAxis)));
    for (const when of whens) when.hidden = !required.includes(when.dataset.filterWhen);
    if (status) status.textContent = `Showing ${shown} of ${items.length}`;
    if (none) none.hidden = shown > 0;
  };
  for (const axis of axes)
    axis.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-value]');
      if (!chip) return;
      chosen.set(axis.dataset.filterAxis, chip.dataset.value);
      const next = new URLSearchParams(location.search);
      for (const [name, value] of chosen)
        if (value) next.set(name, value);
        else next.delete(name);
      const query = next.toString();
      history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
      render();
    });
  render();
}
