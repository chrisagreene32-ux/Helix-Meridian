(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;
  let last = -1;

  // Glitch never edits text. It drives CSS variables that split and jitter every [data-effect~=glitch] element,
  // and drifts the accent colour from aurora green toward red as the story sours.
  function set(v) {
    if (v === last) return;
    last = v;
    html.style.setProperty('--glitch', String(v));
    html.style.setProperty('--decay', String(v));
    html.classList.toggle('is-glitching', v > 0);
  }

  Story.effects.glitch = {
    apply(intensity) {
      const capped = Story.motion.reduced ? Math.min(intensity, 0.4) : intensity;
      set(Math.round(capped * 1000) / 1000);
    },
    reset() { set(0); }
  };
})(window);
