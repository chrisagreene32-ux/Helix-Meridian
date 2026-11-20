(function (root) {
  const Story = (root.Story = root.Story || {});
  Story.effects = Story.effects || {};

  // ---- Pure geometry: hand-drawn marks as SVG path strings, in the element's own coordinates. ----
  // Every coordinate stays within the box plus 12px, so a mark can never push the page wider.

  function rng(seed) { // mulberry32: deterministic, so a mark never changes shape between frames
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const pt = (p) => f(p[0]) + ' ' + f(p[1]);

  // Smooth closed-ish stroke through points (Catmull-Rom converted to cubic Beziers).
  function smooth(points) {
    let d = 'M ' + pt(points[0]);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C ' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
    }
    return d;
  }

  function line(a, b, r, wobble) {
    const mid = (t) => [a[0] + (b[0] - a[0]) * t + (r() - 0.5) * wobble, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * wobble];
    return 'M ' + pt(a) + ' C ' + pt(mid(0.33)) + ' ' + pt(mid(0.66)) + ' ' + pt(b);
  }

  function pathFor(kind, w, h, seed) {
    const r = rng(seed * 9973 + 17);
    switch (kind) {
      case 'circle': { // a loose, slightly overshot ring, like a pen that did not stop on time
        const n = 16, start = r() * Math.PI * 2, turns = 1.12;
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const a = start + (i / n) * Math.PI * 2 * turns;
          const drift = (i / n) * 4 + (r() - 0.5) * 3; // drifts outward and wobbles, in pixels so size never matters
          pts.push([w / 2 + Math.cos(a) * (w / 2 + 2 + drift), h / 2 + Math.sin(a) * (h / 2 + 2 + drift)]);
        }
        return smooth(pts);
      }
      case 'cross':
        return line([-2 + r() * 3, -2 + r() * 3], [w + 2 - r() * 3, h + 2 - r() * 3], r, 10) + ' ' +
               line([w + 2 - r() * 3, -2 + r() * 3], [-2 + r() * 3, h + 2 - r() * 3], r, 10);
      case 'strike':
        return line([-4, h * 0.45 + r() * 6], [w + 4, h * 0.55 - r() * 6], r, 12);
      case 'underline':
        return line([0, h + 4 + r() * 3], [w, h + 4 + r() * 3], r, 8);
      default:
        throw new Error('unknown redline kind: ' + kind);
    }
  }

  Story.redline = { pathFor };

  // ---- DOM: only in a browser ----
  if (typeof document !== 'undefined') {
    const SVGNS = 'http://www.w3.org/2000/svg';
    let layer = null, marks = [], layoutKey = '', lastOn = '';

    function build() {
      layer = document.createElement('div');
      layer.className = 'redline-layer';
      layer.setAttribute('aria-hidden', 'true');
      Story.redlines.forEach((m, i) => {
        const svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('class', 'redline');
        const path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('pathLength', '1');
        svg.appendChild(path);
        let text = null;
        if (m.label) {
          text = document.createElementNS(SVGNS, 'text');
          text.textContent = m.label;
          svg.appendChild(text);
        }
        layer.appendChild(svg);
        marks.push({ m, i, svg, path, text, top: Infinity });
      });
      document.body.appendChild(layer);
    }

    // Marks are laid over their elements in document coordinates and re-laid whenever the page reflows.
    function place() {
      const de = document.documentElement;
      const key = de.scrollHeight + 'x' + window.innerWidth + 'x' + window.innerHeight;
      if (key === layoutKey) return;
      layoutKey = key;
      const sx = window.scrollX, sy = window.scrollY;
      marks.forEach((k) => {
        const el = document.querySelector(k.m.sel);
        if (!el) { k.top = Infinity; return; }
        const r = el.getBoundingClientRect();
        const w = Math.max(8, Math.round(r.width)), h = Math.max(8, Math.round(r.height));
        k.top = r.top + sy;
        Object.assign(k.svg.style, { left: Math.round(r.left + sx) + 'px', top: Math.round(r.top + sy) + 'px', width: w + 'px', height: h + 'px' });
        k.path.setAttribute('d', pathFor(k.m.kind, w, h, k.i + 1));
        if (k.text) {
          const est = k.m.label.length * 11;
          const x = Math.max(4, Math.min(8, window.innerWidth - 8 - est - r.left));
          k.text.setAttribute('x', String(Math.min(8, Math.max(-r.left + 8, x))));
          k.text.setAttribute('y', String(-10));
          k.text.setAttribute('transform', 'rotate(' + (-3 + ((k.i * 7) % 7) / 2) + ' 0 ' + -10 + ')');
        }
      });
    }

    function show(progress) {
      const seen = window.scrollY + window.innerHeight * 0.7;
      const on = marks.map((k) => (progress >= k.m.at && seen >= k.top ? '1' : '0')).join('');
      if (on === lastOn) return;
      lastOn = on;
      marks.forEach((k, i) => k.svg.classList.toggle('is-on', on[i] === '1'));
    }

    Story.effects.redline = {
      apply(_, ctx) { if (!layer) build(); place(); show(ctx.progress); },
      reset() { if (layer) show(-1); }
    };
  }

  if (typeof module !== 'undefined') module.exports = Story;
})(typeof window !== 'undefined' ? window : globalThis);
