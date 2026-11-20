(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;
  let layer = null, last = -1;

  // A vignette that closes in, film grain and scanlines. All strength comes from one variable, --atmo.
  function build() {
    layer = document.createElement('div');
    layer.className = 'atmo';
    layer.setAttribute('aria-hidden', 'true');
    ['v', 'g', 'l'].forEach((k) => {
      const d = document.createElement('div');
      d.className = 'atmo__' + k;
      layer.appendChild(d);
    });
    document.body.appendChild(layer);
  }

  function set(v) {
    if (v === last) return;
    last = v;
    html.style.setProperty('--atmo', String(v));
    if (layer) layer.classList.toggle('is-on', v > 0);
  }

  Story.effects.atmosphere = {
    apply(v) {
      if (!layer) build();
      set(Math.round(v * 1000) / 1000);
    },
    reset() { set(0); }
  };
})(window);
