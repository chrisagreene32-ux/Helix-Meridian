(function (root) {
  const Story = (root.Story = root.Story || {});

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function bar(text) {
    const s = document.createElement('span');
    s.className = 'redact';
    s.textContent = text;
    return s;
  }

  // Wrap the matching words (or the whole text) in black bars. The text stays in the DOM: hidden, not deleted.
  function redact(el, words) {
    const text = el.textContent;
    el.textContent = '';
    if (!words) { el.appendChild(bar(text)); return; }
    const re = new RegExp('(' + words.map(esc).join('|') + ')', 'gi');
    let last = 0;
    text.replace(re, (m, _g, idx) => {
      if (idx > last) el.append(text.slice(last, idx));
      el.appendChild(bar(m));
      last = idx + m.length;
      return m;
    });
    if (last < text.length) el.append(text.slice(last));
  }

  function unredact(el) {
    if (el.querySelector('.redact')) el.textContent = el.textContent;
  }

  // Runs after `copy`, so a rewritten element (which loses its bars) is simply redacted again on the same frame.
  Story.effects.redact = {
    apply(_, ctx) {
      Story.redactions.forEach((rule) => {
        const on = ctx.progress >= rule.at;
        document.querySelectorAll(rule.sel).forEach((el) => {
          const has = !!el.querySelector('.redact');
          if (on && !has) redact(el, rule.words);
          else if (!on && has) unredact(el);
        });
      });
    },
    reset() {
      Story.redactions.forEach((rule) => document.querySelectorAll(rule.sel).forEach(unredact));
    }
  };
})(window);
