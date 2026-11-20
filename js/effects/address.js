(function (root) {
  const Story = (root.Story = root.Story || {});
  const html = document.documentElement;
  let layer = null, box = null, lastDread = -1;

  function build() {
    layer = document.createElement('div');
    layer.id = 'address';
    layer.className = 'address';
    layer.setAttribute('role', 'status');
    box = document.createElement('div');
    box.className = 'address__lines';
    layer.appendChild(box);
    document.body.appendChild(layer);
  }

  function setDread(v) {
    if (v === lastDread) return;
    lastDread = v;
    html.style.setProperty('--dread', String(v));
  }

  // Line i appears at 0.2 + 0.75 * i / (n - 1) of the way through the act, so the last one lands just before the bottom.
  function threshold(i, n) { return n > 1 ? 0.2 + (0.75 * i) / (n - 1) : 0.2; }

  function render(lines, local) {
    while (box.children.length < lines.length) box.appendChild(document.createElement('p'));
    while (box.children.length > lines.length) box.lastChild.remove();
    let current = -1;
    lines.forEach((line, i) => {
      const p = box.children[i];
      if (p.textContent !== line) p.textContent = line;
      const shown = local >= threshold(i, lines.length);
      p.classList.toggle('is-shown', shown);
      if (shown) current = i;
    });
    Array.from(box.children).forEach((p, i) => p.classList.toggle('is-current', i === current));
  }

  Story.effects.address = {
    apply(_, ctx) {
      if (!layer) build();
      setDread(Math.min(1, Math.round(ctx.local * 3 * 1000) / 1000));
      layer.classList.add('is-on');
      render(Story.visitor.composeLines(ctx.snapshot()), ctx.local);
    },
    reset() {
      if (!layer) return;
      setDread(0);
      layer.classList.remove('is-on');
      render([], 0);
    }
  };
})(window);
