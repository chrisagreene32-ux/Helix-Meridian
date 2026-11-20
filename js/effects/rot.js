(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;

  // The brand turns on you. The logo mark opens as an eye, and jaws close in from the top and bottom of the
  // viewport as the story nears its end. (The hero itself is only ever on screen while the page is still clean,
  // so the teeth live where they will actually be seen.) Visuals are CSS; this drives --maw and a class.
  const EYE_AT = 0.68, JAWS_FROM = 0.66, JAWS_SPAN = 0.28;
  let layer = null, last = -1;

  function build() {
    layer = document.createElement('div');
    layer.className = 'jaws';
    layer.setAttribute('aria-hidden', 'true');
    ['t', 'b'].forEach((k) => {
      const d = document.createElement('div');
      d.className = 'jaws__' + k;
      layer.appendChild(d);
    });
    document.body.appendChild(layer);
  }

  function setMaw(v) {
    if (v === last) return;
    last = v;
    html.style.setProperty('--maw', String(v));
    if (layer) layer.classList.toggle('is-on', v > 0);
  }

  const mark = (on) => { const el = document.querySelector('.nav__mark'); if (el) el.classList.toggle('is-eye', on); };

  Story.effects.rot = {
    apply(_, ctx) {
      if (!layer) build();
      const t = Math.min(1, Math.max(0, (ctx.progress - JAWS_FROM) / JAWS_SPAN));
      setMaw(Math.round(t * t * 1000) / 1000); // eases in: barely there, then closing
      mark(ctx.progress >= EYE_AT);
    },
    reset() { setMaw(0); mark(false); }
  };
})(window);
