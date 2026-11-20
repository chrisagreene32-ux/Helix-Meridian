(function (root) {
  const Story = (root.Story = root.Story || {});

  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  function progressFrom(scrollY, scrollHeight, viewportHeight) {
    const max = scrollHeight - viewportHeight;
    if (max <= 0) return 0;
    return clamp01(scrollY / max);
  }

  function resolveAct(progress) {
    const p = clamp01(progress);
    const acts = Story.acts;
    let act = acts[acts.length - 1];
    for (let i = 0; i < acts.length; i++) {
      if (p < acts[i].end) { act = acts[i]; break; }
    }
    const span = act.end - act.start;
    return { act, local: clamp01((p - act.start) / span) };
  }

  function intensity(progress) {
    return clamp01(progress);
  }

  Story.engine = { clamp01, progressFrom, resolveAct, intensity };
  if (typeof module !== 'undefined') module.exports = Story;
})(typeof window !== 'undefined' ? window : globalThis);
