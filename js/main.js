(function (root) {
  const S = root.Story;
  // Order matters: peel and copy reflow the page first, so redact and redline measure the final layout.
  const NAMES = ['glitch', 'drift', 'peel', 'copy', 'redact', 'notes', 'toasts', 'redline', 'atmosphere', 'rot', 'eyes', 'reactive', 'address'];
  const tracker = S.visitor.createTracker(() => root.performance.now());
  const snapshot = () => tracker.snapshot({ w: root.innerWidth, h: root.innerHeight });
  const de = document.documentElement;
  let queued = false, needMeasure = true, lastW = root.innerWidth, lastH = root.innerHeight, cleanH = 0;

  const lerp = (a, b, t) => a + (b - a) * t;

  // The rotting design changes the page's height (default fonts, placeholders). Progress is measured against
  // the CLEAN height, so effects can never move their own thresholds: no flicker, and reload lands where you were.
  // The measure resets every effect, reads the height, and re-applies, all inside one task, so nothing paints between.
  function measureClean() {
    for (let i = NAMES.length - 1; i >= 0; i--) {
      const fx = S.effects[NAMES[i]];
      try { if (fx) fx.reset(); } catch (err) { console.error('effect reset failed:', NAMES[i], err); }
    }
    cleanH = de.scrollHeight;
  }

  // If the rotted page ever came out shorter than the clean one, use the real height so the end stays reachable.
  const effectiveHeight = () => Math.min(cleanH || de.scrollHeight, de.scrollHeight);
  S.layout = {
    maxScroll: () => Math.max(0, effectiveHeight() - root.innerHeight),
    progress: () => S.engine.progressFrom(root.scrollY, effectiveHeight(), root.innerHeight)
  };

  // One read per frame. Everything shown is a pure function of current progress, never of scroll history,
  // so jumping, reloading mid-page, resizing and scrolling back up all land in the right state.
  function render() {
    queued = false;
    if (needMeasure) { measureClean(); needMeasure = false; }
    const progress = S.layout.progress();
    const { act, local } = S.engine.resolveAct(progress);
    const ctx = { act, local, progress, snapshot };
    de.dataset.act = act.id;
    for (const name of NAMES) {
      const fx = S.effects[name];
      if (!fx) continue;
      const cfg = act.effects[name];
      try {
        if (cfg === undefined) { fx.reset(); continue; }
        fx.apply(Array.isArray(cfg) ? lerp(cfg[0], cfg[1], local) : cfg, ctx);
      } catch (err) {
        // One broken effect must not take the others (or the page) down with it.
        console.error('effect failed:', name, err);
      }
    }
  }

  function onScroll() {
    tracker.onScroll(root.scrollY); // sampled on every event so speed is real, not frame-gated
    request();
  }

  function request() {
    if (queued) return;
    queued = true;
    root.requestAnimationFrame(render);
  }

  root.addEventListener('scroll', onScroll, { passive: true });
  // Re-measure on a real size change, not on the small height changes of a mobile address bar sliding away.
  root.addEventListener('resize', () => {
    if (root.innerWidth !== lastW || Math.abs(root.innerHeight - lastH) > 150) {
      lastW = root.innerWidth; lastH = root.innerHeight; needMeasure = true;
    }
    request();
  });
  root.addEventListener('load', () => {
    needMeasure = true;
    request();
    root.setTimeout(() => de.classList.add('is-smooth'), 300);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { needMeasure = true; request(); });
  request();
})(window);
