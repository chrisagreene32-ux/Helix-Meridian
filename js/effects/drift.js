(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;
  let ready = false, lastDrift = -1, lastOverlap = -1, lastInvert = null;

  // Deterministic per-element offsets, assigned once, so drift is stable rather than random each frame.
  function seed() {
    if (ready) return;
    ready = true;
    document.querySelectorAll('[data-effect~=drift]').forEach((el, i) => {
      const r = (n) => { const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
      el.style.setProperty('--dx', (r(1) * 14).toFixed(2));
      el.style.setProperty('--dy', (r(2) * 10).toFixed(2));
      el.style.setProperty('--dr', (r(3) * 1.6).toFixed(2));
    });
  }

  function setInverted(on) {
    if (on === lastInvert) return;
    lastInvert = on;
    ['#games', '#press'].forEach((s) => {
      const el = document.querySelector(s);
      if (el) el.classList.toggle('is-inverted', on);
    });
  }

  // Layout stays untouched (transforms only), so drifting can never change page height and feed back into progress.
  function set(drift, overlap) {
    if (drift !== lastDrift) { lastDrift = drift; html.style.setProperty('--drift', String(drift)); }
    if (overlap !== lastOverlap) { lastOverlap = overlap; html.style.setProperty('--overlap', String(overlap)); }
  }

  Story.effects.drift = {
    apply(intensity, ctx) {
      seed();
      const contempt = ctx.act.id === 'contempt';
      const late = contempt || ctx.act.id === 'address';
      set(Math.round(intensity * 1000) / 1000, contempt ? Math.round(ctx.local * 1000) / 1000 : late ? 1 : 0);
      setInverted(late && (!contempt || ctx.local > 0.35));
    },
    reset() { set(0, 0); setInverted(false); }
  };
})(window);
