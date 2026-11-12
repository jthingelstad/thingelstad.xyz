// The nnxyz Rooms' gadget: one Nifty Ink drawing from the gallery, replayed stroke by stroke. The page reads fully
// without it; the panel stays hidden until this runs. The drawing is the gallery's own display SVG
// (nnxyz.thingelstad.xyz/art/display/<id>.svg, cross-origin reads allowed for thingelstad.xyz only), fetched once
// the panel nears the screen, one file a drawing, and replayed with the gallery's own timing
// (src/lib/timeline.ts and src/scripts/replay.ts in jthingelstad/nnxyz, ported here as they are). With
// prefers-reduced-motion it shows the finished drawing and replays only when asked. A failed read says so in the
// panel and never throws; a replay stops while the tab is hidden and picks up when it comes back.

// The drawings it chooses from: [id, title, room id, room], from the gallery's screensaver/data.json, the Nifty Ink
// works whose stored display SVG is 200 KB or less (113 of 574 on 2026-11-12, about 500 KB each once unpacked),
// the three with the most strokes in each of their 21 rooms, in gallery order. The gallery is an archive and its
// published files never change, so the list does not go stale; a drawing that went missing would say so here.
const WORKS = [
  ['QmQfFLRZRsfH2txa3e9uUNFCd8FeHWPPLhFBYQkuNQ1d9H', 'Nifty Faces #1', 'nifty-faces--boxes', 'Heads Built from Boxes'],
  ['QmaH3GpgzNGxuaRBGPGAr2gn6NdYbMyh6KZri5hynQLDc4', 'Nifty Faces #75', 'nifty-faces--boxes', 'Heads Built from Boxes'],
  ['QmWbdUPj39Zf8zsq7Ukprm3gKikQ53GSdfWJzcCVpW3ZRs', 'Nifty Faces #71', 'nifty-faces--dark', 'Skulls and Shadows'],
  ['QmbM9pwfyX86HxXetyVZkBKJ7WTLE7BNeVVkc7TkUeSCA5', 'Nifty Faces #72', 'nifty-faces--dark', 'Skulls and Shadows'],
  ['QmQemk6ETjruovocZ5tsYA86yh19hYLpJu18p2VSRPgNJ3', 'Nifty Faces #82', 'nifty-faces--line', 'Clean Lines, Flat Color'],
  [
    'QmTdPjPwTgTZWs6u25HvDsmoaAkTycNx8pY8fX3ChsqMbf',
    'Nifty Faces #113',
    'nifty-faces--line',
    'Clean Lines, Flat Color'
  ],
  ['QmZvaCoT8uMiU9fKeGvYwGEWsTptXxgYepAG4TiYiaTapL', 'NNOTB #49', 'nnotb--p1--silhouettes', 'Black Silhouettes'],
  ['QmbJgKJySUFXQxdVQjrB4VQWCA8oqBY2PCgoVjVz6Rc7P9', 'NNOTB #58', 'nnotb--p1--silhouettes', 'Black Silhouettes'],
  ['QmYFknz1yRhtQifr7tMJStKHuLgs8AdHepunYFwjo4yiER', 'NNOTB #96', 'nnotb--p1--silhouettes', 'Black Silhouettes'],
  ['QmUYwQDLUQyNwE345wqiFWPEAsYgJsAbdiEyFCDk8tbVya', 'NNOTB #135', 'nnotb--p1--framed', 'Framed Heads, First Masks'],
  ['QmRBFVqhZPekk6tq3jtSE4WL7WEyKzwRvhR9Leem9qhFBm', 'NNOTB #121', 'nnotb--p1--line', 'Line Figures and Crowds'],
  ['QmVWrRAokGq3gtJMag5Q6A9EfV73TcWA595UeYZHrBHSQ9', 'NNOTB #129', 'nnotb--p1--line', 'Line Figures and Crowds'],
  ['QmUTnPb5ctzeoZEu67b5dbdETQxq7wtWTGQewDTL32ESgo', 'NNOTB #16', 'nnotb--p1--skeletons', 'Skeletons and Monsters'],
  [
    'QmUQpYwrkKcXkwmac55Kby4xG4jGaYVUKe2crzidH7fBWh',
    'NNOTB #34',
    'nnotb--p1--painted',
    'Painted Figures, Places and Color Fields'
  ],
  [
    'QmRZgKKnxNpqKKg2rt8uRaE3LTF5KwUKorTvN3PRTjYmcv',
    'NNOTB #36',
    'nnotb--p1--painted',
    'Painted Figures, Places and Color Fields'
  ],
  [
    'QmfQ8ovXZpLsVRyrRmJbYGMTZ7wvG8ujxuKRMD63tFX3F1',
    'NNOTB #127',
    'nnotb--p1--painted',
    'Painted Figures, Places and Color Fields'
  ],
  ['QmZ7Uo5hyp4ykuRVkxoBgcQBoq6pSdcwhujPoRAmQGH53U', 'NNOTB #141', 'nnotb--p2--square', 'Square Masks'],
  ['QmZGjRiMJaUcYpSp4UQrjYS5P3tZaQPoZFrJbVc6wQvkGm', 'NNOTB #159', 'nnotb--p2--square', 'Square Masks'],
  ['QmcETCaFZsCmaQLrqjXF5ERUdWn7BPoR6bh7FrCKiynZUe', 'NNOTB #168', 'nnotb--p2--square', 'Square Masks'],
  ['QmdwkU2REbPAP5zP5bVoa9xP2tHkSg9L6CHabU3aoPooHB', 'NNOTB #175', 'nnotb--p2--round', 'Round Masks and Profiles'],
  ['Qmc5ro1RuHwWCkiyb9AgGTiRuapV5HHnBzsw6M2qyUokPk', 'NNOTB #147', 'nnotb--p2--scribbled', 'Scribbled Heads'],
  ['QmfUbbgNZZgoBmV2VGQLNmAABWzA48mTwFJWQQUj2nT8Y3', 'NNOTB #166', 'nnotb--p2--scribbled', 'Scribbled Heads'],
  ['QmUeDz9boqt5FYpPLNByYBGH7Z4QjfazYj1bwcuEPCwX5y', 'NNOTB #231', 'nnotb--p2--scribbled', 'Scribbled Heads'],
  ['QmTfiG8EufEr23BnFCm27R8GqB6zYNereym39nF7oP9KJL', 'NNOTB #156', 'nnotb--p2--between', 'Figures and Places'],
  ['QmZtzDmwLmDbnUDDcsEUPP4qu2dYeGWxGPuZ11e1iBmxap', 'NNOTB #225', 'nnotb--p2--between', 'Figures and Places'],
  ['QmcoSArtGiKyVCaftons1cE8v8d9S6JHKZHw2SSvwsEpEM', 'NNOTB #232', 'nnotb--p2--between', 'Figures and Places'],
  ['QmPE79K638FVWtpuzmMypmD2ujXodkqms47Upwdy4JGXaF', 'NNOTB #257', 'nnotb--p3--cats', 'Cats and Creatures'],
  ['QmUYisACWzT3CJT4yPHkzjrHr8pGjfPipe6MhB9rrSykYA', 'NNOTB #258', 'nnotb--p3--cats', 'Cats and Creatures'],
  ['QmRqfM5rD8Hu77YmntMuPa1Vs3hF43eUwZPZvZcr8qk8d3', 'NNOTB #264', 'nnotb--p3--cats', 'Cats and Creatures'],
  ['QmdjJR9xKKVUmL37okF2YLEcAyNUskviysbYRh5ZSbtPTL', 'NNOTB #275', 'nnotb--p3--portraits', 'Portraits'],
  ['QmQJQZHmxk2TRK63qHPFN1r1fzyS3VrxahgeV6jsjGvTsJ', 'NNOTB #281', 'nnotb--p3--portraits', 'Portraits'],
  ['QmdkNbgAx1tSkAA9WLWfJKocV2FqJXkDip9jKNAViSbY7u', 'NNOTB #295', 'nnotb--p3--portraits', 'Portraits'],
  ['QmaBypz9zG64MoM6Bna55MUcw778QChK23p5qXEPXFDPv3', 'NNOTB #273', 'nnotb--p3--crowns', 'Crowns and Last Masks'],
  ['QmXSgahauWXeVigxbB5JBTTKtrY2Lffv1i32fDfgcLBsLC', 'NNOTB #278', 'nnotb--p3--crowns', 'Crowns and Last Masks'],
  ['QmVVYH6nbJiZJ1xX9S7VAwampr6GmafFkpvf5Gk495Hi9T', 'Rawblocks #11', 'rawblocks--rb-portraits', 'Portraits'],
  ['QmcLwRBYXD3xkkYBZzx4QxSRw56bewjo6Sae9R7VM17wM7', 'Rawblocks #13', 'rawblocks--rb-portraits', 'Portraits'],
  ['QmT5kWjajHYc8Xp6ZCnLCBNuL8Fi52kNtyxdp8XmwU6Tnj', 'Rawblocks #15', 'rawblocks--rb-portraits', 'Portraits'],
  [
    'QmXkgNJAjpSwzSPLLvDVVAAHZ3TixuHFQMb2BW2D5MtpCU',
    'Rawblocks #34',
    'rawblocks--rb-figures',
    'Patterned Masks and Black Figures'
  ],
  [
    'QmcpYUExuvjdAnTYr3i1GkQcVdpLAbGy5bwnNABr5XPCAg',
    'Rawblocks #35',
    'rawblocks--rb-figures',
    'Patterned Masks and Black Figures'
  ],
  [
    'QmY71fXfB9ougVAHSTrvq73AWoTJfykiju3L1UuUtr6d3G',
    'Rawblocks #37',
    'rawblocks--rb-figures',
    'Patterned Masks and Black Figures'
  ],
  ['QmZuWBTZLwPBu3nRhR53M2HsGtfJa97a848zsUj2sfCkdB', 'Rawblocks #44', 'rawblocks--rb-late', 'Scribbled Heads'],
  ['QmNPoucCFgjtQ6Q2wcCxHPVTfSHMzh7UujtiexwVYEWCn2', 'Rawblocks #46', 'rawblocks--rb-late', 'Scribbled Heads'],
  ['QmXPizggQ9Yz5fBL9x3ZvQpyzFQGV2BxVfz36d1n1XbuGL', 'Rawblocks #62', 'rawblocks--rb-late', 'Scribbled Heads'],
  [
    'QmdHEg3abh9JKppBCdnRQYjfe6RywNqD49pMz29pg2GBRU',
    'nnxyz nifty summer ink',
    'nnxyz-other--ot-occasions',
    'Occasions and Figures'
  ],
  [
    'QmayAHxG78z89NTBfThyJxZZJsQQcRPQNHHKHgbc7EueER',
    'nnxyz nifty summer dance ink',
    'nnxyz-other--ot-occasions',
    'Occasions and Figures'
  ],
  ['QmSkHfHUDJGBWfQFo4EoijVqZd2rqem8rEJJfcrVN4sCGy', 'nnxyz #8', 'nnxyz-other--ot-occasions', 'Occasions and Figures'],
  [
    'QmPf7MVvkau79xwnY9SCnDaKvCrUmXAKqguyhiV3BVShhx',
    'nnxyz #11',
    'nnxyz-other--ot-masks',
    'Numbered Masks, 2022 to 2024'
  ],
  [
    'Qme91y8NhSp2zS7RkyuhDCRaFtoqvVnp6j9UKnqM3fFwPk',
    'nnxyz #20',
    'nnxyz-other--ot-masks',
    'Numbered Masks, 2022 to 2024'
  ],
  [
    'QmRJ2v2MWzABVtAMvq83FLoNBs4b9GWzRXdXJNkV1UJHbF',
    'nnxyz #32',
    'nnxyz-other--ot-masks',
    'Numbered Masks, 2022 to 2024'
  ],
  ['QmbRoSvkp2R7aEfup1YW4WVwqjWSDDHD9bLcKTyUKmsRgp', 'Scrimshaw6', 'scrimshaw--sc-scrimshaw', 'Scrimshaw'],
  ['QmR1U8DCiSXFPoyiqrVJ45zacgzpAk4ggXCSm5BqEvXcYX', 'Scrimshaw 33', 'scrimshaw--sc-scrimshaw', 'Scrimshaw'],
  ['QmVYHmNA8cFJtzqWwWmCHpBGvECV7tAbFLVDw2jdYrFr9i', 'Wobbler', 'scrimshaw--sc-scrimshaw', 'Scrimshaw']
];

// The gallery's timeline (src/lib/timeline.ts): each stroke gets a span weighted by its length, the whole drawing
// between 20 seconds and two minutes at 1×, with a short gap between strokes.
const createTimeline = (lengths) => {
  if (!lengths.length || lengths.some((n) => !Number.isFinite(n) || n < 0)) throw new Error('Invalid stroke lengths');
  const weights = lengths.map((length) => Math.max(4, length));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const duration = Math.max(lengths.length * 0.057, Math.min(120, Math.max(20, totalWeight / 600)));
  const variable = duration - lengths.length * 0.057;
  let cursor = 0;
  const spans = lengths.map((length, i) => {
    const start = cursor;
    const end = start + 0.045 + (variable * weights[i]) / totalWeight;
    cursor = end + 0.012;
    return { start, end, length };
  });
  return { spans, duration: cursor };
};
const strokeFraction = (span, time) => Math.max(0, Math.min(1, (time - span.start) / (span.end - span.start)));
const advance = (time, elapsedMs, speed, duration) =>
  Math.min(duration, time + (Math.max(0, elapsedMs) / 1000) * speed);

// A drawing is the gallery's file, parsed as SVG and kept to what the gallery's drawings are made of (an svg with a
// title, a description, groups and paths): any other element goes, and so does any event handler, link or style
// attribute, so nothing in the file can run or reach out from this page.
const KEEP = new Set(['svg', 'title', 'desc', 'g', 'path']);
const readDrawing = async (src, signal) => {
  const response = await fetch(src, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error(`${src}: ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('Invalid SVG');
  for (const node of [...doc.querySelectorAll('*')]) {
    if (!KEEP.has(node.localName)) {
      node.remove();
      continue;
    }
    for (const { name } of [...node.attributes]) if (/^on|href$|^style$/i.test(name)) node.removeAttribute(name);
  }
  const svg = document.importNode(doc.documentElement, true);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  return svg;
};

// Paint the drawing as it stood at `time` (src/scripts/replay.ts); true once it is complete.
const paintFrame = (drawing, time) => {
  const { paths, timeline } = drawing;
  if (time >= timeline.duration) {
    for (const path of paths) {
      path.style.removeProperty('visibility');
      path.removeAttribute('stroke-dasharray');
      path.removeAttribute('stroke-dashoffset');
    }
    return true;
  }
  for (const [index, path] of paths.entries()) {
    const span = timeline.spans[index];
    const fraction = strokeFraction(span, time);
    if (fraction <= 0) {
      if (path.style.visibility !== 'hidden') path.style.visibility = 'hidden';
    } else {
      if (path.style.visibility) path.style.removeProperty('visibility');
      if (fraction >= 1 || span.length === 0) {
        if (path.hasAttribute('stroke-dasharray')) {
          path.removeAttribute('stroke-dasharray');
          path.removeAttribute('stroke-dashoffset');
        }
      } else {
        path.setAttribute('stroke-dasharray', `${span.length} ${span.length + 1}`);
        path.setAttribute('stroke-dashoffset', String(span.length * (1 - fraction)));
      }
    }
  }
  return false;
};

function gadget(panel) {
  const gallery = panel.dataset.gallery;
  const canvas = panel.querySelector('[data-ink-canvas]');
  const title = panel.querySelector('[data-ink-title]');
  const room = panel.querySelector('[data-ink-room]');
  const bar = panel.querySelector('[data-ink-progress]');
  const play = panel.querySelector('[data-ink-play]');
  const another = panel.querySelector('[data-ink-another]');
  const speeds = [...panel.querySelectorAll('[data-ink-speed]')];
  const status = panel.querySelector('[data-ink-status]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = -1;
  let drawing = null;
  let time = 0;
  let speed = 1;
  let playing = false;
  let resume = false; // playing when the tab was hidden, so it picks up when the tab comes back
  let frame = 0;
  let last = 0;
  let reading = null; // the fetch in flight, aborted when another drawing is asked for
  let token = 0;

  const label = () => {
    const done = !drawing || time >= drawing.timeline.duration || time === 0;
    play.textContent = playing ? 'Pause' : done ? 'Replay' : 'Play';
  };
  const render = () => {
    paintFrame(drawing, time);
    bar.style.transform = `scaleX(${drawing.timeline.duration ? time / drawing.timeline.duration : 1})`;
  };
  const stop = () => {
    playing = false;
    cancelAnimationFrame(frame);
    label();
  };
  const tick = (now) => {
    if (!playing) return;
    time = advance(time, now - last, speed, drawing.timeline.duration);
    last = now;
    render();
    if (time >= drawing.timeline.duration) stop();
    else frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!drawing) return;
    if (time >= drawing.timeline.duration) time = 0;
    playing = true;
    last = performance.now();
    render();
    label();
    frame = requestAnimationFrame(tick);
  };

  const caption = (index) => {
    const [id, name, roomId, roomName] = WORKS[index];
    current = index;
    title.textContent = name;
    title.href = `${gallery}/artworks/${id}/`;
    room.textContent = roomName;
    room.href = `${gallery}/galleries/${roomId}/`;
    return id;
  };

  const show = async (index, autoplay) => {
    const mine = ++token;
    const id = caption(index);
    reading?.abort();
    reading = new AbortController();
    stop();
    resume = false;
    drawing = null;
    time = 0;
    canvas.replaceChildren();
    bar.style.transform = 'scaleX(0)';
    play.disabled = true;
    status.textContent = 'Fetching the drawing from the gallery.';
    try {
      const svg = await readDrawing(`${gallery}/art/display/${id}.svg`, reading.signal);
      if (mine !== token) return;
      canvas.replaceChildren(svg);
      const paths = [...svg.querySelectorAll('path[data-stroke]')];
      drawing = { paths, timeline: createTimeline(paths.map((path) => path.getTotalLength())) };
      status.textContent = '';
      play.disabled = false;
      if (autoplay && !motion.matches && !document.hidden) start();
      else {
        time = drawing.timeline.duration;
        render();
        label();
      }
    } catch {
      if (mine !== token) return;
      drawing = null;
      canvas.replaceChildren();
      label();
      status.textContent =
        'The drawing could not be read from the gallery just now. Its page in the gallery has it, or try another.';
    }
  };

  const pick = () => {
    if (WORKS.length < 2) return 0;
    let index;
    do index = Math.floor(Math.random() * WORKS.length);
    while (index === current);
    return index;
  };

  play.addEventListener('click', () => (playing ? stop() : start()));
  another.addEventListener('click', () => show(pick(), true));
  for (const button of speeds)
    button.addEventListener('click', () => {
      speed = Number(button.dataset.inkSpeed);
      for (const other of speeds) other.setAttribute('aria-pressed', String(other === button));
    });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      resume = true;
      stop();
    } else if (!document.hidden && resume) {
      resume = false;
      start();
    }
  });
  window.addEventListener('pagehide', stop);

  // The caption is there at once; the file waits until the panel is near the screen.
  caption(pick());
  panel.hidden = false;
  if (!('IntersectionObserver' in window)) {
    show(current, true);
    return;
  }
  const watch = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      show(current, true);
    },
    { rootMargin: '200px 0px' }
  );
  watch.observe(panel);
}

for (const panel of document.querySelectorAll('[data-ink-replay]')) gadget(panel);
