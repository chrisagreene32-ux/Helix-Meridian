(function (root) {
  const Story = (root.Story = root.Story || {});
  let layer = null, els = [], layoutKey = '', lastOn = '';

  function build() {
    layer = document.createElement('div');
    layer.className = 'notes-layer';
    layer.setAttribute('aria-hidden', 'true');
    Story.notes.forEach((n, i) => {
      const act = Story.engine.resolveAct(n.at).act.id;
      const el = document.createElement('aside');
      el.className = 'note note--' + act + ' note--' + n.side;
      el.dataset.i = String(i);
      const who = document.createElement('span');
      who.className = 'note__who';
      who.textContent = 'design-agent';
      const p = document.createElement('p');
      p.textContent = n.text;
      el.append(who, p);
      layer.appendChild(el);
      els.push(el);
    });
    document.body.appendChild(layer);
  }

  // A note sits in the document at the exact scroll position where its moment arrives,
  // so it is in view when `at` is reached and scrolls away naturally afterwards.
  function place() {
    const max = Story.layout.maxScroll();
    const key = max + 'x' + window.innerHeight;
    if (key === layoutKey) return;
    layoutKey = key;
    Story.notes.forEach((n, i) => {
      els[i].style.top = Math.round(n.at * max + window.innerHeight * 0.3) + 'px';
    });
  }

  function show(progress) {
    const on = Story.notes.map((n) => (n.at <= progress ? '1' : '0')).join('');
    if (on === lastOn) return;
    lastOn = on;
    els.forEach((el, i) => el.classList.toggle('is-on', on[i] === '1'));
  }

  Story.effects.notes = {
    apply(_, ctx) {
      if (!layer) build();
      place();
      show(ctx.progress);
    },
    reset() {
      if (!layer) return;
      show(-1);
    }
  };
})(window);
