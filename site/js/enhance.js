// What a script adds to pages that already read without one: the arrows on a shelf, and the filter chips over a
// list. Each list item carries its values in data-filters ("status:active topic:mcp "), and a page's chosen values
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
