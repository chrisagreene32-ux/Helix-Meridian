(function (root) {
  const S = root.Story;
  const NAMES = ['glitch', 'drift', 'copy', 'notes', 'toasts'];
  let queued = false;

  const lerp = (a, b, t) => a + (b - a) * t;

  // One read per frame. Everything shown is a pure function of current progress, never of scroll history,
  // so jumping, reloading mid-page, resizing and scrolling back up all land in the right state.
  function render() {
    queued = false;
    const de = document.documentElement;
    const progress = S.engine.progressFrom(root.scrollY, de.scrollHeight, root.innerHeight);
    const { act, local } = S.engine.resolveAct(progress);
    const ctx = { act, local, progress };
    for (const name of NAMES) {
      const fx = S.effects[name];
      if (!fx) continue;
      const cfg = act.effects[name];
      if (cfg === undefined) { fx.reset(); continue; }
      fx.apply(Array.isArray(cfg) ? lerp(cfg[0], cfg[1], local) : cfg, ctx);
    }
  }

  function request() {
    if (queued) return;
    queued = true;
    root.requestAnimationFrame(render);
  }

  root.addEventListener('scroll', request, { passive: true });
  root.addEventListener('resize', request);
  root.addEventListener('load', request);
  request();
})(window);
