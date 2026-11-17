// Kubb: Throwing Wood's gadget: a kept match of the game on the web, replayed in a frame from kubb.thingelstad.xyz.
// The frame is the game's own embed (the snippet its EMBED button gives), so the game does the replaying and this
// script only places it. It goes in once the gadget is near the screen, never before, and the game holds the replay
// until half of it is in view and while the tab is hidden. A frame that cannot load shows the browser's own notice;
// the link under it still works, and nothing here throws.
function gadget(panel) {
  const slot = panel.querySelector('[data-kubb-replay-frame]');
  panel.hidden = false;
  const place = () => {
    if (slot.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.src = panel.dataset.embed;
    frame.title = 'A match of Kubb: Throwing Wood';
    frame.loading = 'lazy';
    frame.allow = '';
    slot.append(frame);
  };
  if (!('IntersectionObserver' in window)) return place();
  const watch = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      place();
    },
    { rootMargin: '400px 0px' }
  );
  watch.observe(panel);
}

for (const panel of document.querySelectorAll('[data-kubb-replay]')) gadget(panel);
