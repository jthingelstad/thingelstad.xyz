// Kubb: Throwing Wood's gadget: a kept match of the game on the web, replayed in a frame from kubb.thingelstad.xyz.
// The frame is the game's own embed (the snippet its EMBED button gives), so the game does the replaying and this
// script only places it. Nothing is loaded until the gadget is near the screen. A frame cannot say whether it
// loaded, so the script first asks for the embed page without reading it (an opaque request, which needs no
// cross-origin permission): when the site cannot be reached, the gadget says so in place of the frame, keeps the
// link, and never throws. The game holds the replay until half of it is in view, and while the tab is hidden.
const WAIT = 15_000;

function gadget(panel) {
  const slot = panel.querySelector('[data-kubb-replay-frame]');
  const status = panel.querySelector('[data-kubb-replay-status]');
  const how = panel.querySelector('[data-kubb-replay-how]');
  panel.hidden = false;
  let started = false;
  const unreachable = () => {
    slot.hidden = true;
    how.hidden = true;
    status.textContent = 'The replay could not be reached just now. The link below opens it on kubb.thingelstad.xyz.';
    status.hidden = false;
  };
  const place = async () => {
    if (started) return;
    started = true;
    try {
      await fetch(panel.dataset.embed, { mode: 'no-cors', signal: AbortSignal.timeout(WAIT) });
    } catch {
      unreachable();
      return;
    }
    const frame = document.createElement('iframe');
    frame.src = panel.dataset.embed;
    frame.title = 'A match of Kubb: Throwing Wood';
    frame.allow = '';
    slot.append(frame);
  };
  if (!('IntersectionObserver' in window)) return void place();
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
