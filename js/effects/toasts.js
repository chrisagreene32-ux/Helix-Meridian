(function (root) {
  const Story = (root.Story = root.Story || {});
  let box = null, els = [], lastOn = '';

  function build() {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('role', 'presentation');
    Story.toasts.forEach((t) => {
      const el = document.createElement('div');
      el.className = 'toast';
      const title = document.createElement('strong');
      title.textContent = t.title;
      const p = document.createElement('p');
      p.textContent = t.text;
      el.append(title, p);
      box.appendChild(el);
      els.push(el);
    });
    document.body.appendChild(box);
  }

  function show(progress) {
    const on = Story.toasts.map((t) => (progress >= t.at && progress <= t.until ? '1' : '0')).join('');
    if (on === lastOn) return;
    lastOn = on;
    els.forEach((el, i) => el.classList.toggle('is-on', on[i] === '1'));
  }

  Story.effects.toasts = {
    apply(_, ctx) { if (!box) build(); show(ctx.progress); },
    reset() { if (box) show(-1); }
  };
})(window);
