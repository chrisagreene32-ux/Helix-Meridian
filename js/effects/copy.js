(function (root) {
  const Story = (root.Story = root.Story || {});
  const originals = new Map(); // element -> its untouched text
  const current = new Map();   // element -> text we last wrote (or null for original)
  let groups = null;           // selector -> entries sorted by `at`

  function build() {
    groups = new Map();
    Story.copy.forEach((c) => {
      if (!groups.has(c.sel)) groups.set(c.sel, []);
      groups.get(c.sel).push(c);
    });
    groups.forEach((list) => list.sort((a, b) => a.at - b.at));
  }

  function write(el, text) {
    if (!originals.has(el)) originals.set(el, el.textContent);
    const want = text === null ? originals.get(el) : text;
    if (current.get(el) === want) return;
    current.set(el, want);
    el.textContent = want;
  }

  Story.effects.copy = {
    apply(_, ctx) {
      if (!groups) build();
      groups.forEach((list, sel) => {
        let pick = null;
        for (const c of list) if (c.at <= ctx.progress) pick = c;
        document.querySelectorAll(sel).forEach((el) => write(el, pick ? pick.text : null));
      });
    },
    reset() {
      originals.forEach((orig, el) => write(el, null));
    }
  };
})(window);
