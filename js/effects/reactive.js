(function (root) {
  const Story = (root.Story = root.Story || {});
  let active = false, ready = false, queued = false, pointer = null;
  const originals = new Map(); // element -> its real label
  let shy = [];                // elements that flinch from the cursor

  function swap(el, on) {
    const next = on ? el.dataset.react : originals.get(el);
    if (next !== undefined && el.textContent !== next) el.textContent = next;
  }

  function init() {
    ready = true;
    document.querySelectorAll('[data-react]').forEach((el) => {
      originals.set(el, el.textContent);
      const enter = () => { if (active) swap(el, true); };
      const leave = () => swap(el, false);
      el.addEventListener('pointerenter', enter);
      el.addEventListener('focus', enter);
      el.addEventListener('pointerleave', leave);
      el.addEventListener('blur', leave);
    });
    shy = Array.from(document.querySelectorAll('[data-effect~=glitch], [data-evade]'));
    window.addEventListener('pointermove', (e) => {
      if (!active || e.pointerType === 'touch' || Story.motion.reduced) return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!queued) { queued = true; requestAnimationFrame(flinch); }
    }, { passive: true });
  }

  // Headings flinch from the cursor; anything marked data-evade runs from it.
  function flinch() {
    queued = false;
    if (!active || !pointer) return;
    shy.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return; // only what is on screen
      const evade = el.hasAttribute('data-evade');
      const reach = evade ? 130 : 150, gain = evade ? 70 : 9;
      const dx = r.left + r.width / 2 - pointer.x, dy = r.top + r.height / 2 - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const push = dist < reach ? (1 - dist / reach) * gain : 0;
      el.style.setProperty('--fx', ((dx / dist) * push).toFixed(1));
      el.style.setProperty('--fy', ((dy / dist) * push).toFixed(1));
    });
  }

  function calm() {
    shy.forEach((el) => { el.style.removeProperty('--fx'); el.style.removeProperty('--fy'); });
    originals.forEach((_, el) => swap(el, false));
  }

  Story.effects.reactive = {
    apply() { if (!ready) init(); active = true; },
    reset() { if (!ready) return; active = false; calm(); }
  };
})(window);
