(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;

  // The polish peels back in three stages, as the file the AI actually worked in shows through:
  // 1 guides and outlines, 2 grey placeholders and default fonts, 3 raw monospace wireframe.
  const THRESHOLDS = [0.01, 0.2, 0.6];
  const HYSTERESIS = 0.005; // a font swap reflows the page; this keeps a stage from flickering on its boundary
  let level = 0, lastPeel = -1;

  function levelFor(v) {
    let l = level;
    while (l < THRESHOLDS.length && v >= THRESHOLDS[l]) l++;
    while (l > 0 && v < THRESHOLDS[l - 1] - HYSTERESIS) l--;
    return l;
  }

  function set(l, v) {
    if (v !== lastPeel) { lastPeel = v; html.style.setProperty('--peel', String(v)); }
    if (l === level) return;
    level = l;
    for (let i = 1; i <= THRESHOLDS.length; i++) html.classList.toggle('is-peel-' + i, l >= i);
  }

  Story.effects.peel = {
    apply(v) {
      const r = Math.round(v * 1000) / 1000;
      set(levelFor(r), r);
    },
    reset() { set(0, 0); }
  };
})(window);
