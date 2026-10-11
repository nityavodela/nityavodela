
(() => {
  const root = document.documentElement;
  const track = document.getElementById('track');
  const canvas = document.getElementById('heat');
  const ctx = canvas.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  const hand = document.getElementById('hand');
  const handIn = document.getElementById('handIn');
  const bar = document.getElementById('bar');
  const pct = document.getElementById('pct');
  const btnTheme = document.getElementById('theme');
  const navBtns = [...document.querySelectorAll('.nav [data-target]')];
  const sections = [...document.querySelectorAll('[data-section]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  /* ---------- Theme ---------- */
  function syncThemeLabel() {
    const dark = root.getAttribute('data-theme') === 'dark';
    btnTheme.textContent = dark ? 'Light' : 'Dark';
    btnTheme.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  btnTheme.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeLabel();
  });
  syncThemeLabel();

  /* ---------- Colour ramp ---------- */
  const stops = [
    [0.00, [9, 23, 223]],
    [0.20, [0, 229, 255]],
    [0.40, [140, 255, 0]],
    [0.60, [244, 255, 26]],
    [0.80, [255, 122, 0]],
    [1.00, [255, 0, 0]]
  ];
  const LUTN = 1024;
  // Interpolate in HSV rather than RGB so every step of the ramp stays fully saturated.
  function rgb2hsv(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, mx ? d / mx : 0, mx];
  }
  function hsv2rgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  const hsvStops = stops.map(st => [st[0], rgb2hsv(st[1])]);
  const lut = new Uint8ClampedArray(LUTN * 3);
  for (let i = 0; i < LUTN; i++) {
    const t = i / (LUTN - 1);
    let k = 0;
    while (k < hsvStops.length - 2 && t > hsvStops[k + 1][0]) k++;
    const [t0, c0] = hsvStops[k];
    const [t1, c1] = hsvStops[k + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const rgb = hsv2rgb(c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f);
    lut[i * 3] = rgb[0]; lut[i * 3 + 1] = rgb[1]; lut[i * 3 + 2] = rgb[2];
  }

  /* ---------- Heat lens ---------- */
  // Two fields: "raw" is how much heat is present (fades), "temp" is how warm
  // that spot is. Temperature comes from where the cursor is in the WHOLE
  // horizontal page, so the lens core slides from yellow to orange to red.
  const DECAY = 0.92;
  const STRENGTH = 0.16;   // resting core heat = STRENGTH / (1 - DECAY) = 2
  let gw, gh, cell, raw, temp, img;

  function sizeHeat() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    // About one heat cell per 4 CSS pixels, so there are no visible blocks.
    gw = Math.min(480, Math.max(120, Math.round(innerWidth / 4)));
    gh = Math.max(30, Math.round(gw * innerHeight / innerWidth));
    cell = innerWidth / gw;
    off.width = gw;
    off.height = gh;
    raw = new Float32Array(gw * gh);
    temp = new Float32Array(gw * gh);
    img = octx.createImageData(gw, gh);
  }
  sizeHeat();
  window.addEventListener('resize', sizeHeat);

  function lensRadius() { return innerWidth < 700 ? 105 : 190; }

  // Circular kernel that reaches exactly zero at the radius: no square or
  // octagonal cut-off, so the rim dissolves instead of ending in an edge.
  function stamp(px, py, T) {
    const gx = px / cell, gy = py / cell;
    const R = lensRadius() / cell, R2 = R * R;
    const span = Math.ceil(R);
    const x0 = Math.max(0, Math.floor(gx - span)), x1 = Math.min(gw - 1, Math.ceil(gx + span));
    const y0 = Math.max(0, Math.floor(gy - span)), y1 = Math.min(gh - 1, Math.ceil(gy + span));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - gx, dy = y - gy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R2) continue;
        const u = 1 - d2 / R2;
        const w = STRENGTH * u * u;
        const i = y * gw + x;
        const cur = raw[i];
        temp[i] += (T - temp[i]) * (w / (cur + w + 1e-4));
        raw[i] = Math.min(6, cur + w);
      }
    }
  }

  function renderHeat() {
    const d = img.data;
    for (let i = 0, p = 0; i < raw.length; i++, p += 4) {
      const r = raw[i];
      if (r < 0.01) { d[p + 3] = 0; continue; }
      // Opacity reaches full very early, so the blue rim is solid, not a ghost.
      let t = (r - 0.01) / 0.09; if (t > 1) t = 1;
      const a = t * t * (3 - 2 * t);
      // Heat rises smoothly from rim to core; the exponent gives blue a wider ring.
      const k = Math.pow(1 - Math.exp(-r * 1.8), 1.35);
      const core = 0.6 + 0.4 * temp[i];
      let idx = core * (0.01 + 0.99 * k) + (Math.random() - 0.5) * 0.003; // tiny dither hides banding
      idx = idx < 0 ? 0 : idx > 1 ? 1 : idx;
      const li = ((idx * (LUTN - 1)) | 0) * 3;
      d[p] = lut[li];
      d[p + 1] = lut[li + 1];
      d[p + 2] = lut[li + 2];
      d[p + 3] = a * 255 + (Math.random() - 0.5);
    }
    octx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }

  /* ---------- Hover-to-read details ---------- */
  const detailEl = document.getElementById('detail');
  const dStatus = document.getElementById('dStatus');
  const dTitle = document.getElementById('dTitle');
  const dSummary = document.getElementById('dSummary');
  const dPoints = document.getElementById('dPoints');
  const dTags = document.getElementById('dTags');
  const dGallery = document.getElementById('dGallery');
  const dMore = document.getElementById('dMore');
  const detailItems = [...document.querySelectorAll('[data-detail]')];
  let openEl = null, openBy = '', mouseMode = false;

  function fillDetail(d) {
    dStatus.textContent = d.status;
    dTitle.textContent = d.title;
    dSummary.textContent = d.summary;
    dPoints.textContent = '';
    d.points.forEach(t => { const li = document.createElement('li'); li.textContent = t; dPoints.appendChild(li); });
    dTags.textContent = '';
    d.tags.forEach(t => { const sp = document.createElement('span'); sp.textContent = t; dTags.appendChild(sp); });
    dGallery.textContent = '';
    (d.images || []).slice(0, 4).forEach(src => {
      const im = document.createElement('img');
      im.src = src; im.alt = ''; im.decoding = 'async';
      dGallery.appendChild(im);
    });
  }
  function openDetail(el, by) {
    if (caseOpen) return;
    const d = DETAILS[el.dataset.detail];
    if (!d) return;
    detailEl.classList.toggle('compact', !!d.compact);
    const noun = DETAILS[el.dataset.detail].noun || 'project';
    dMore.textContent = by === 'touch' ? 'Tap again to open the full ' + noun : by === 'focus' ? 'Press Enter to open the full ' + noun : 'Click to open the full ' + noun;
    if (openEl !== el) fillDetail(d);
    openEl = el; openBy = by;
    detailEl.classList.add('on');
    track.classList.add('has-focus');
    detailItems.forEach(i => i.classList.toggle('is-hot', i === el));
  }
  function closeDetail() {
    openEl = null; openBy = '';
    detailEl.classList.remove('on');
    track.classList.remove('has-focus');
    detailItems.forEach(i => i.classList.remove('is-hot'));
  }
  // Mouse hover is resolved from the pointer position, so it also stays correct
  // while the page slides under a still cursor.
  function syncHover(el) {
    if (openBy === 'focus' || openBy === 'touch') return;
    if (el) { if (el !== openEl) openDetail(el, 'mouse'); }
    else if (openEl) closeDetail();
  }
  function hoverTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest('[data-detail]') : null;
  }
  detailItems.forEach(el => {
    el.addEventListener('focus', () => openDetail(el, 'focus'));
    el.addEventListener('blur', () => { if (openBy === 'focus') closeDetail(); });
    el.addEventListener('pointerup', e => {
      if (e.pointerType !== 'touch') return;
      if (openEl === el) openCase(el); else openDetail(el, 'touch');
    });
    el.addEventListener('click', e => {
      if (e.pointerType === 'touch') return; // touch uses tap-to-preview, tap-again-to-open
      openCase(el);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(el); }
    });
  });
  window.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && openBy === 'touch' && !(e.target.closest && e.target.closest('[data-detail]'))) closeDetail();
  });

  /* ---------- Pointer, hand and touch ---------- */
  let cx = -1000, cy = -1000, active = false;

  let over = false, overMedia = false;
  function place(x, y, target) {
    cx = x; cy = y;
    root.classList.add('has-hand');
    hand.style.transform = 'translate3d(' + (x - 17) + 'px,' + (y - 1) + 'px,0)';
    hand.classList.add('on');
    over = !!(target && target.closest && target.closest('button, a, [data-detail]'));
    overMedia = caseOpen && inStage(x, y);
    mouseMode = true;
    syncHover(target && target.closest ? target.closest('[data-detail]') : null);
  }
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    active = true;
    place(e.clientX, e.clientY, e.target);
  });
  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget) { active = false; hand.classList.remove('on'); if (openBy === 'mouse') closeDetail(); }
  });
  function touchUpdate(e) {
    const t = e.touches[0];
    if (!t) return;
    active = true;
    cx = t.clientX; cy = t.clientY;
  }
  window.addEventListener('touchstart', touchUpdate, { passive: true });
  window.addEventListener('touchmove', touchUpdate, { passive: true });
  window.addEventListener('touchend', () => { active = false; }, { passive: true });
  window.addEventListener('touchcancel', () => { active = false; }, { passive: true });

  /* ---------- Full project view ---------- */
  // Draft copy: replace with your own words as you share each project.

  const caseEl = document.getElementById('case');
  const caseTrack = document.getElementById('caseTrack');
  const casePull = document.getElementById('pull');
  const caseBackBtn = document.getElementById('caseBack');
  const PULL_MAX = 240;
  let caseOpen = false, caseOrigin = null, pull = 0, wheelBlockUntil = 0;
  let sc = track; // the scroller currently in charge
  [track, caseTrack].forEach(el => { el._t = el.scrollLeft; el._last = el.scrollLeft; });

  function mk(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // The stage: one centred slot that crossfades between the project's images / motion graphics
  // as the story scrolls, so the work stays in the middle and the text stays at the bottom.
  const stageEl = document.getElementById('stage');
  let stageItems = [], stageOn = -2;

  let galleryMode = false, galleryEl = null, gSlides = [], gAccum = 0, gCool = 0, gCount = null, gPrev = null, gNext = null;

  function gCurrent() {
    const c = galleryEl.scrollLeft + galleryEl.clientWidth / 2;
    let best = 0, bd = 1e12;
    gSlides.forEach((sl, i) => {
      const d = Math.abs(sl.offsetLeft + sl.offsetWidth / 2 - c);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function gGo(i) {
    i = Math.max(0, Math.min(gSlides.length - 1, i));
    const sl = gSlides[i];
    galleryEl.scrollTo({ left: sl.offsetLeft + sl.offsetWidth / 2 - galleryEl.clientWidth / 2, behavior: 'smooth' });
  }
  function gUpdate() {
    if (!galleryEl) return;
    const i = gCurrent();
    gCount.textContent = (i + 1) + ' / ' + gSlides.length;
    gPrev.disabled = i === 0;
    gNext.disabled = i === gSlides.length - 1;
  }
  function buildGallery(media) {
    galleryMode = true;
    stageEl.classList.add('gallery');
    galleryEl = mk('div', 'gallery-track');
    gSlides = [];
    media.forEach(m => {
      const fig = mk('figure', 'slide');
      const im = document.createElement('img');
      im.src = m.src; im.alt = m.alt || ''; im.decoding = 'async';
      im.className = 'c-media';
      fig.appendChild(im);
      const cap = mk('figcaption', 'c-cap');
      if (m.title) {
        cap.appendChild(mk('span', 'pl-t', m.title));
        if (m.meta) cap.appendChild(mk('span', 'pl-m', m.meta));
      } else if (m.caption) cap.textContent = m.caption;
      fig.appendChild(cap);
      galleryEl.appendChild(fig); gSlides.push(fig);
    });
    stageEl.appendChild(galleryEl);
    const arrow = d => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
    const ctrl = mk('div', 'g-ctrl');
    gPrev = mk('button'); gPrev.type = 'button'; gPrev.setAttribute('aria-label', 'Previous piece'); gPrev.innerHTML = arrow('M10 3.5L5.5 8 10 12.5');
    gNext = mk('button'); gNext.type = 'button'; gNext.setAttribute('aria-label', 'Next piece'); gNext.innerHTML = arrow('M6 3.5L10.5 8 6 12.5');
    gCount = mk('span', null, '1 / ' + media.length);
    gPrev.addEventListener('click', () => gGo(gCurrent() - 1));
    gNext.addEventListener('click', () => gGo(gCurrent() + 1));
    ctrl.appendChild(gPrev); ctrl.appendChild(gCount); ctrl.appendChild(gNext);
    stageEl.appendChild(ctrl);
    galleryEl.addEventListener('scroll', gUpdate, { passive: true });
    gUpdate();
  }

  function buildStage(media, emptyLabel, gallery) {
    stageEl.textContent = '';
    stageItems = []; stageOn = -2;
    galleryMode = false; galleryEl = null; gSlides = []; gAccum = 0;
    stageEl.classList.remove('gallery');
    if (gallery && media.length) { buildGallery(media); return; }
    if (!media.length) {
      const it = mk('div', 'stage-item');
      it.appendChild(mk('div', 'stage-empty', emptyLabel || 'Images and motion graphics of the work go here'));
      stageEl.appendChild(it); stageItems.push(it);
      return;
    }
    media.forEach(m => {
      const it = mk('figure', 'stage-item');
      let node;
      if (m.type === 'video') {
        node = document.createElement('video');
        node.src = m.src;
        if (m.poster) node.poster = m.poster;
        node.muted = true; node.loop = true; node.playsInline = true; node.preload = 'metadata';
        node.setAttribute('aria-label', m.alt || 'Motion graphic');
        if (reduce) node.controls = true; // no autoplay for people who prefer less motion
      } else {
        node = document.createElement('img');
        node.src = m.src; node.alt = m.alt || ''; node.decoding = 'async';
      }
      node.className = 'c-media';
      it.appendChild(node);
      if (m.title) {
        const cap = mk('figcaption', 'c-cap');
        cap.appendChild(mk('span', 'pl-t', m.title));
        if (m.meta) cap.appendChild(mk('span', 'pl-m', m.meta));
        it.appendChild(cap);
      } else if (m.caption) it.appendChild(mk('figcaption', 'c-cap', m.caption));
      stageEl.appendChild(it); stageItems.push(it);
    });
  }

  function updateStage() {
    if (!stageItems.length) return;
    const kids = caseTrack.children;
    const probe = caseTrack.scrollLeft + innerWidth * 0.5;
    let m = -1;
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].offsetLeft > probe) break;
      if (kids[i].dataset.m !== undefined) m = +kids[i].dataset.m;
    }
    const idx = Math.max(0, Math.min(stageItems.length - 1, m));
    if (idx === stageOn) return;
    stageOn = idx;
    stageItems.forEach((it, i) => {
      const on = i === idx;
      it.classList.toggle('on', on);
      const v = it.querySelector('video');
      if (v) {
        if (on && !reduce) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
        else v.pause();
      }
    });
  }

  function inStage(x, y) {
    if (galleryMode) {
      const gr = stageEl.getBoundingClientRect();
      return x >= gr.left && x <= gr.right && y >= gr.top && y <= gr.bottom;
    }
    const it = stageItems[Math.max(0, stageOn)];
    const node = it && it.querySelector('.c-media, .stage-empty');
    if (!node) return false;
    const r = node.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // {{key phrase}} in copy is set at full strength; the rest of the statement stays quieter.
  function richText(node, text) {
    text.split(/(\{\{.*?\}\})/).forEach(part => {
      if (part.indexOf('{{') === 0) node.appendChild(mk('span', 'hl', part.slice(2, -2)));
      else if (part) node.appendChild(document.createTextNode(part));
    });
  }

  function buildCase(el) {
    const id = el.dataset.detail;
    const d = DETAILS[id], c = CASES[id] || {};
    caseTrack.textContent = '';
    const media = (c.media || []).concat((c.images || []).map(src => ({ type: 'image', src })));
    const M = c.gallery ? 0 : media.length;
    buildStage(media, c.empty, !!c.gallery);
    caseEl.classList.toggle('museum', !!c.museum);

    const cover = mk('section', 'cpanel cover');
    cover.dataset.m = M ? 0 : -1;
    cover.appendChild(mk('p', 'c-status', d.status));
    cover.appendChild(mk('h2', 'c-title', d.title));
    cover.appendChild(mk('p', 'c-summary', d.summary));
    const tags = mk('div', 'c-tags');
    d.tags.forEach(t => tags.appendChild(mk('span', null, t)));
    cover.appendChild(tags);

    // Builds the closing "Keep going." actions (Back to portfolio / Next: ...).
    function buildActions() {
      const actions = mk('div', 'c-actions');
      const back = mk('button', 'cta', 'Back to portfolio');
      back.type = 'button';
      back.addEventListener('click', () => closeCase());
      actions.appendChild(back);
      const group = detailItems.filter(i => i.closest('[data-section]') === el.closest('[data-section]'));
      if (group.length > 1) {
        const nextEl = group[(group.indexOf(el) + 1) % group.length];
        const nb = mk('button', 'cta', 'Next: ' + DETAILS[nextEl.dataset.detail].title);
        nb.type = 'button';
        nb.addEventListener('click', () => {
          buildCase(nextEl);
          caseOrigin = nextEl;
          caseTrack.scrollLeft = 0; caseTrack._t = 0; caseTrack._last = 0;
          prevSL = 0; shiftAcc = 0;
        });
        actions.appendChild(nb);
      }
      return actions;
    }

    if (c.gallery) {
      // The gallery itself is what you explore here, so the text never needs to
      // scroll: the description sits alongside "Keep going." in one static row,
      // both visible from the start, while the frame above does the browsing.
      cover.classList.add('flat');
      const row = mk('div', 'flat-row');
      const sections = c.sections || [];
      if (sections.length) {
        const block = mk('div', 'c-block');
        block.appendChild(mk('h3', 'c-label', sections[0].h));
        const pp = mk('p', 'c-p');
        richText(pp, sections[0].p);
        block.appendChild(pp);
        row.appendChild(block);
      }
      const endBlock = mk('div', 'c-block end');
      endBlock.appendChild(mk('h3', 'c-h', 'Keep going.'));
      endBlock.appendChild(buildActions());
      row.appendChild(endBlock);
      cover.appendChild(row);
      caseTrack.appendChild(cover);
      return;
    }

    cover.appendChild(mk('p', 'c-hint', 'Scroll sideways to read. Scroll back to return.'));
    caseTrack.appendChild(cover);

    const sections = c.sections || [];
    sections.forEach((sec, i) => {
      const pn = mk('section', 'cpanel sec');
      pn.dataset.m = M ? Math.min(i + 1, M - 1) : -1;
      pn.appendChild(mk('h3', 'c-label', sec.h));
      const pp = mk('p', 'c-p');
      richText(pp, sec.p);
      pn.appendChild(pp);
      caseTrack.appendChild(pn);
    });
    // Any further pieces get a quiet scroll step of their own; the stage swaps as you pass.
    for (let k = sections.length + 1; k < M; k++) {
      const sp = mk('section', 'cpanel spacer');
      sp.dataset.m = k;
      sp.appendChild(mk('p', 'c-count', (k + 1) + ' of ' + M));
      caseTrack.appendChild(sp);
    }

    if (c.links && c.links.length) {
      const pn = mk('section', 'cpanel sec end');
      pn.appendChild(mk('h3', 'c-h', 'See it live'));
      const wrap = mk('div', 'c-links');
      c.links.forEach(l => {
        const a = mk('a', 'cta', l.label);
        a.href = l.url; a.target = '_blank'; a.rel = 'noopener';
        wrap.appendChild(a);
      });
      pn.appendChild(wrap);
      caseTrack.appendChild(pn);
    }

    const end = mk('section', 'cpanel sec end');
    end.appendChild(mk('h3', 'c-h', 'Keep going.'));
    end.appendChild(buildActions());
    caseTrack.appendChild(end);
    layoutCaseText();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (caseOpen) layoutCaseText(); });
  }

  // Sit the text as low as the tallest description allows, so little empty space is left under it.
  function layoutCaseText() {
    let maxH = 0;
    caseTrack.querySelectorAll('.cpanel.sec:not(.end), .cpanel.spacer').forEach(pn => {
      const f = pn.firstElementChild, l = pn.lastElementChild;
      if (!f) return;
      const h = l.getBoundingClientRect().bottom - f.getBoundingClientRect().top;
      if (h > maxH) maxH = h;
    });
    const stageBottom = stageEl.getBoundingClientRect().bottom;
    const gap = caseEl.classList.contains('museum') ? 64 : 36;
    let top = innerHeight - maxH - innerHeight * 0.05;
    top = Math.max(stageBottom + gap, Math.min(innerHeight * 0.74, top));
    caseTrack.style.setProperty('--text-top', Math.round(top) + 'px');
  }
  window.addEventListener('resize', () => { if (caseOpen) layoutCaseText(); });

  function openCase(el) {
    if (caseOpen || !DETAILS[el.dataset.detail]) return;
    closeDetail();
    buildCase(el);
    caseOrigin = el;
    caseOpen = true;
    caseEl.classList.add('open');
    caseEl.insertBefore(canvas, caseTrack);
    caseEl.setAttribute('aria-hidden', 'false');
    track.setAttribute('inert', '');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    sc = caseTrack;
    caseTrack.scrollLeft = 0; caseTrack._t = 0; caseTrack._last = 0;
    prevSL = 0; shiftAcc = 0; pull = 0; overMedia = false;
    caseBackBtn.classList.remove('gone'); caseBackBtn.tabIndex = 0;
    caseBackBtn.classList.add('peek');
    setTimeout(() => caseBackBtn.classList.remove('peek'), 1900);
    caseTrack.focus({ preventScroll: true });
  }

  function closeCase() {
    if (!caseOpen) return;
    caseOpen = false;
    caseEl.classList.remove('open');
    document.body.appendChild(canvas);
    caseEl.setAttribute('aria-hidden', 'true');
    track.removeAttribute('inert');
    sc = track;
    prevSL = track.scrollLeft; shiftAcc = 0; pull = 0;
    caseTrack.style.transform = '';
    casePull.style.setProperty('--pull', '0');
    stageEl.querySelectorAll('video').forEach(v => v.pause());
    stageOn = -2;
    overMedia = false;
    wheelBlockUntil = performance.now() + 450; // swallow leftover trackpad momentum
    if (mouseMode && active) syncHover(hoverTarget(cx, cy));
  }
  caseBackBtn.addEventListener('click', () => closeCase());

  /* ---------- Horizontal navigation ---------- */
  const maxScroll = () => Math.max(0, sc.scrollWidth - sc.clientWidth);
  const clampT = v => Math.min(maxScroll(), Math.max(0, v));

  window.addEventListener('wheel', e => {
    if (viewerOpen) return; // the resume viewer scrolls vertically on its own
    if (performance.now() < wheelBlockUntil) { e.preventDefault(); return; }
    const unit = e.deltaMode === 1 ? 32 : 1;
    const dx = e.deltaX * unit, dy = e.deltaY * unit;
    const nativeHoriz = Math.abs(dx) > Math.abs(dy);
    const d = nativeHoriz ? dx : dy;
    if (galleryMode && caseOpen && gSlides.length && inStage(e.clientX, e.clientY)) {
      const gi = gCurrent();
      if ((d > 0 && gi < gSlides.length - 1) || (d < 0 && gi > 0)) {
        e.preventDefault();
        if (Math.sign(d) !== Math.sign(gAccum)) gAccum = 0;
        gAccum += d;
        const gnow = performance.now();
        if (Math.abs(gAccum) > 45 && gnow > gCool) { gGo(gi + (gAccum > 0 ? 1 : -1)); gCool = gnow + 420; gAccum = 0; }
        return;
      }
      // at either end the wheel passes through, so the page keeps scrolling
    }
    // At the very start of a project, scrolling further left pulls you back to the portfolio.
    if (caseOpen && d < 0 && sc.scrollLeft <= 1 && sc._t <= 1) {
      e.preventDefault();
      pull = Math.min(PULL_MAX, pull + (-d));
      if (pull >= PULL_MAX) closeCase();
      return;
    }
    if (nativeHoriz) return; // let native horizontal gestures scroll normally
    e.preventDefault();
    sc._t = clampT(sc._t + dy);
    if (reduce) sc.scrollLeft = sc._t;
  }, { passive: false });

  // Touch: drag right at the start of a project to go back.
  let touchX0 = null;
  window.addEventListener('touchstart', e => { touchX0 = e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (!caseOpen || touchX0 == null || !e.touches[0]) return;
    const dx = e.touches[0].clientX - touchX0;
    if (sc.scrollLeft <= 1 && dx > 0) {
      pull = Math.min(PULL_MAX, dx * 1.2);
      if (pull >= PULL_MAX) { touchX0 = null; closeCase(); }
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { touchX0 = null; }, { passive: true });

  window.addEventListener('keydown', e => {
    if (viewerOpen) { if (e.key === 'Escape') { e.preventDefault(); closeViewer(); } return; }
    if (e.key === 'Escape') {
      if (caseOpen) { e.preventDefault(); closeCase(); } else if (openEl) closeDetail();
      return;
    }
    const step = innerWidth * 0.5;
    let d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') d = step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') d = -step;
    else if (e.key === 'Home') { e.preventDefault(); sc._t = 0; return; }
    else if (e.key === 'End') { e.preventDefault(); sc._t = maxScroll(); return; }
    if (d) { e.preventDefault(); sc._t = clampT(sc._t + d); if (reduce) sc.scrollLeft = sc._t; }
  });

  navBtns.forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.target);
    if (!el) return;
    if (caseOpen) closeCase();
    track._t = clampT(el.offsetLeft);
    if (reduce) track.scrollLeft = track._t;
  }));

  [track, caseTrack].forEach(el => el.addEventListener('scroll', () => {
    if (Math.abs(el.scrollLeft - el._last) > 2) el._t = el.scrollLeft; // user scrolled natively
    el._last = el.scrollLeft;
  }, { passive: true }));

  function updateProgress() {
    const max = maxScroll();
    const p = max > 0 ? sc.scrollLeft / max : 0;
    bar.style.setProperty('--p', p.toFixed(4));
    pct.textContent = Math.round(p * 100) + '%';
    let current = sections[0];
    if (caseOpen && caseOrigin) {
      current = caseOrigin.closest('[data-section]') || current;
    } else {
      const probe = track.scrollLeft + innerWidth * 0.4;
      sections.forEach(s => { if (s.offsetLeft <= probe) current = s; });
      const tmax = Math.max(0, track.scrollWidth - track.clientWidth);
      if (tmax > 0 && track.scrollLeft >= tmax - 4) current = sections[sections.length - 1];
    }
    navBtns.forEach(b => b.setAttribute('aria-current', String(b.dataset.target === current.id)));
  }

  /* ---------- Contact: socials and resume ---------- */
  const socialsEl = document.getElementById('socials');
  const paperBtn = document.getElementById('paper');
  const previewBtn = document.getElementById('resumePreviewBtn');
  const dlBtn = document.getElementById('resumeDl');
  const noteEl = document.getElementById('resumeNote');
  const viewerEl = document.getElementById('viewer');
  const viewerScroll = document.getElementById('viewerScroll');
  const viewerPages = document.getElementById('viewerPages');
  const viewerDl = document.getElementById('viewerDl');
  const viewerClose = document.getElementById('viewerClose');
  let viewerOpen = false;

  CONTACT.socials.forEach(sn => {
    let el;
    if (sn.url) { el = mk('a', 'pill', sn.label); el.href = sn.url; el.target = '_blank'; el.rel = 'noopener'; }
    else { el = mk('span', 'pill off', sn.label); el.title = 'Link coming soon'; }
    socialsEl.appendChild(el);
  });

  const writingLinks = document.getElementById('writingLinks');
  if (writingLinks) {
    let md;
    if (MEDIUM_URL) { md = mk('a', 'pill', 'Read on Medium'); md.href = MEDIUM_URL; md.target = '_blank'; md.rel = 'noopener'; }
    else { md = mk('span', 'pill off', 'Medium'); md.title = 'Link coming soon'; }
    writingLinks.appendChild(md);
  }

  function placeholderSheet() {
    const sh = mk('div', 'paper-ph');
    [62, 40, 92, 88, 94, 70, 90, 84, 92, 58, 90, 86, 76].forEach(w => {
      const bar = document.createElement('i'); bar.style.width = w + '%'; sh.appendChild(bar);
    });
    sh.appendChild(mk('b', null, 'Resume preview'));
    return sh;
  }
  const R = CONTACT.resume;
  if (R.pages.length) {
    const im = document.createElement('img');
    im.src = R.pages[0]; im.alt = 'Resume, first page';
    paperBtn.appendChild(im);
  } else paperBtn.appendChild(placeholderSheet());

  [dlBtn, viewerDl].forEach(a => {
    if (R.pdf) { a.href = R.pdf; a.setAttribute('download', R.filename); }
    else { a.href = '#'; a.setAttribute('aria-disabled', 'true'); a.tabIndex = -1; }
  });
  if (!R.pdf) noteEl.textContent = 'Resume file coming soon.';

  function dataUriToBlob(uri) {
    const parts = uri.split(',');
    const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  // In a framed preview a plain download link is inert, so use the viewer's save prompt there.
  // On a normal host there is no window.claude and the plain link just works.
  let saveCap = null;
  if (window.claude && window.claude.use) {
    window.claude.use('downloads').then(cap => { saveCap = cap; }).catch(() => {});
  }
  [dlBtn, viewerDl].forEach(a => a.addEventListener('click', e => {
    if (!R.pdf || !saveCap) return;
    e.preventDefault();
    saveCap.save({ filename: R.filename, data: dataUriToBlob(R.pdf) }).catch(() => {});
  }));

  function openViewer() {
    if (viewerOpen) return;
    viewerPages.textContent = '';
    if (R.pages.length) {
      R.pages.forEach((src, i) => {
        const im = document.createElement('img');
        im.src = src; im.alt = 'Resume, page ' + (i + 1); im.decoding = 'async';
        viewerPages.appendChild(im);
      });
    } else {
      const sh = mk('div', 'sheet');
      sh.appendChild(placeholderSheet());
      viewerPages.appendChild(sh);
    }
    viewerOpen = true;
    viewerEl.classList.add('open');
    viewerEl.setAttribute('aria-hidden', 'false');
    track.setAttribute('inert', '');
    viewerScroll.scrollTop = 0;
    viewerClose.focus({ preventScroll: true });
  }
  function closeViewer() {
    if (!viewerOpen) return;
    viewerOpen = false;
    viewerEl.classList.remove('open');
    viewerEl.setAttribute('aria-hidden', 'true');
    track.removeAttribute('inert');
    paperBtn.focus({ preventScroll: true });
  }
  paperBtn.addEventListener('click', openViewer);
  previewBtn.addEventListener('click', openViewer);
  viewerClose.addEventListener('click', closeViewer);
  viewerEl.addEventListener('click', e => { if (e.target === viewerEl || e.target === viewerScroll) closeViewer(); });

  /* ---------- Frame loop ---------- */
  let prevSL = sc.scrollLeft, shiftAcc = 0, prevCx = 0, tilt = 0, handScale = 0.78;

  function shiftHeat(n) {
    if (Math.abs(n) >= gw) { raw.fill(0); temp.fill(0); return; }
    for (let y = 0; y < gh; y++) {
      const base = y * gw;
      if (n > 0) {
        raw.copyWithin(base, base + n, base + gw);
        temp.copyWithin(base, base + n, base + gw);
        raw.fill(0, base + gw - n, base + gw);
        temp.fill(0, base + gw - n, base + gw);
      } else {
        const m = -n;
        raw.copyWithin(base + m, base, base + gw - m);
        temp.copyWithin(base + m, base, base + gw - m);
        raw.fill(0, base, base + m);
        temp.fill(0, base, base + m);
      }
    }
  }

  function frame() {
    if (!reduce) {
      const cur = sc.scrollLeft;
      const diff = sc._t - cur;
      if (Math.abs(diff) > 1) {
        const stepPx = Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.11);
        sc.scrollLeft = cur + stepPx;
        sc._last = sc.scrollLeft;
      } else if (diff !== 0 && Math.abs(diff) <= 1) {
        sc.scrollLeft = sc._t;
        sc._last = sc.scrollLeft;
      }
    }
    updateProgress();

    if (caseOpen) {
      // Rubber-band while pulling back; it relaxes if you stop.
      pull *= 0.92; if (pull < 0.5) pull = 0;
      const pr = pull / PULL_MAX;
      casePull.style.setProperty('--pull', pr.toFixed(3));
      caseTrack.style.transform = pr > 0 ? 'translateX(' + (pr * 70).toFixed(1) + 'px)' : '';
      // The top-left Back button gets out of the way near the end, where the ending panel takes over.
      const cmax = maxScroll();
      const done = cmax > 0 && sc.scrollLeft / cmax >= 0.9;
      caseBackBtn.classList.toggle('gone', done);
      caseBackBtn.tabIndex = done ? -1 : 0;
      updateStage();
      overMedia = active && inStage(cx, cy);
    } else overMedia = false;

    // Heat lives on the page: as the page slides, the trail slides with it,
    // so scrolling with a still cursor paints a streak instead of freezing.
    const sl = sc.scrollLeft;
    const dScroll = sl - prevSL;
    prevSL = sl;
    shiftAcc += dScroll / cell;
    const n = Math.trunc(shiftAcc);
    shiftAcc -= n;
    if (n !== 0) shiftHeat(n);
    if (dScroll !== 0 && mouseMode && active) {
      const under = document.elementFromPoint(cx, cy);
      syncHover(under && under.closest ? under.closest('[data-detail]') : null);
    }

    for (let i = 0; i < raw.length; i++) raw[i] *= DECAY;
    if (active && !overMedia) { // the lens steps aside over media so work is seen in its true colour
      const T = Math.min(1, Math.max(0, (sc.scrollLeft + cx) / sc.scrollWidth));
      stamp(cx, cy, T);
    }

    // The hand leans with the flow of the page and with its own motion.
    const pv = cx - prevCx; prevCx = cx;
    const tiltTarget = Math.max(-20, Math.min(20, -dScroll * 0.45 + pv * 0.3)) + (over ? -8 : 0);
    tilt += (tiltTarget - tilt) * 0.18;
    const scaleTarget = over ? 0.92 : 0.78;
    handScale += (scaleTarget - handScale) * 0.2;
    handIn.style.transform = 'scale(' + handScale.toFixed(3) + ') rotate(' + tilt.toFixed(2) + 'deg)';
    renderHeat();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
