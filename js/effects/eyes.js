(function (root) {
  const Story = (root.Story = root.Story || {});
  // Almond eye: sclera, iris, slit pupil and a lid that blinks. The iris moves via --px / --py (unitless, 50 = centred).
  const ALMOND = 'M2 23 C 22 -3, 78 -3, 98 23 C 78 49, 22 49, 2 23 Z';
  const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<clipPath id="eye-clip"><path d="' + ALMOND + '"/></clipPath>' +
    '<radialGradient id="eye-sclera" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#efe8dc"/><stop offset="0.7" stop-color="#cfc6b8"/><stop offset="1" stop-color="#7a6f66"/></radialGradient>' +
    '<radialGradient id="eye-iris" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d4263c"/><stop offset="0.75" stop-color="#8a0c1e"/><stop offset="1" stop-color="#3d0510"/></radialGradient>' +
    '</defs></svg>';
  const EYE = '<svg class="eye__svg" viewBox="0 0 100 46" aria-hidden="true"><g clip-path="url(#eye-clip)">' +
    '<rect width="100" height="46" fill="url(#eye-sclera)"/>' +
    '<g class="eye__iris"><circle cx="50" cy="23" r="17" fill="url(#eye-iris)"/><ellipse cx="50" cy="23" rx="3.2" ry="13" fill="#000"/></g>' +
    '<rect class="eye__lid" width="100" height="46" fill="#050304"/></g>' +
    '<path d="' + ALMOND + '" fill="none" stroke="#050304" stroke-width="2.5"/></svg>';
  let layer = null, els = [], lastOn = '', target = null, queued = false, lastPointer = 0, lastY = 0;

  function build() {
    layer = document.createElement('div');
    layer.className = 'eyes';
    layer.setAttribute('aria-hidden', 'true');
    layer.insertAdjacentHTML('beforeend', DEFS);
    Story.eyes.forEach((e, i) => {
      const el = document.createElement('div');
      el.className = 'eye';
      el.innerHTML = EYE;
      el.style.left = e.x;
      el.style.top = e.y;
      el.style.setProperty('--s', String(e.s));
      el.style.setProperty('--d', (-((i * 2.7) % 8)).toFixed(1) + 's'); // staggered blinks
      layer.appendChild(el);
      els.push(el);
    });
    document.body.appendChild(layer);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function look() {
    queued = false;
    if (!target) target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    els.forEach((el) => {
      if (!el.classList.contains('is-on')) return;
      const r = el.getBoundingClientRect();
      const dx = target.x - (r.left + r.width / 2), dy = target.y - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 260);
      el.style.setProperty('--px', (50 + (dx / dist) * k * 26).toFixed(1));
      el.style.setProperty('--py', (50 + (dy / dist) * k * 24).toFixed(1));
    });
  }

  function request() { if (!queued) { queued = true; requestAnimationFrame(look); } }

  function onPointer(e) {
    lastPointer = performance.now();
    target = { x: e.clientX, y: e.clientY };
    request();
  }

  // With no pointer (touch), the eyes look the way you are scrolling, then past you.
  function onScroll() {
    const y = window.scrollY, dir = y >= lastY ? 1 : -1;
    lastY = y;
    if (performance.now() - lastPointer < 1500) return;
    target = { x: window.innerWidth / 2, y: dir > 0 ? window.innerHeight * 1.2 : -window.innerHeight * 0.2 };
    request();
  }

  function show(progress) {
    const on = Story.eyes.map((e) => (progress >= e.at ? '1' : '0')).join('');
    if (on === lastOn) return;
    lastOn = on;
    els.forEach((el, i) => el.classList.toggle('is-on', on[i] === '1'));
    request();
  }

  Story.effects.eyes = {
    apply(_, ctx) { if (!layer) build(); show(ctx.progress); },
    reset() { if (layer) show(-1); }
  };
})(window);
