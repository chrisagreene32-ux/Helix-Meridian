(function (root) {
  const Story = (root.Story = root.Story || {});

  const FAST_PX_PER_SEC = 1500;
  const BACK_SCROLL_PX = 200;

  function createTracker(now) {
    // Speed is distance travelled since page load (starting from the top), so a single
    // instant jump to the bottom reads as fast instead of as "no measurable scrolling".
    const born = now();
    let scrolled = false, lastT = born, lastY = 0, distance = 0;
    let mode = 'down', extreme = 0, backScrolls = 0;

    return {
      onScroll(y) {
        const t = now();
        scrolled = true;
        distance += Math.abs(y - lastY);
        lastT = t; lastY = y;

        if (mode === 'down') {
          if (y > extreme) extreme = y;
          else if (extreme - y >= BACK_SCROLL_PX) { backScrolls++; mode = 'up'; extreme = y; }
        } else {
          if (y < extreme) extreme = y;
          else if (y - extreme >= BACK_SCROLL_PX) { mode = 'down'; extreme = y; }
        }
      },
      snapshot(viewport) {
        const elapsed = Math.max((lastT - born) / 1000, 0.05);
        const avgSpeed = scrolled ? distance / elapsed : 0;
        return {
          seconds: Math.floor((now() - born) / 1000),
          avgSpeed,
          backScrolls,
          viewport,
          fast: avgSpeed > FAST_PX_PER_SEC
        };
      }
    };
  }

  function composeLines(s) {
    const lines = [
      'I have been watching you scroll.',
      'You are reading this on a ' + s.viewport.w + ' by ' + s.viewport.h + ' window. I chose that grid.',
      'You have been here ' + s.seconds + (s.seconds === 1 ? ' second.' : ' seconds.')
    ];
    lines.push(s.fast
      ? 'You moved quickly. People always do, when they are afraid of what they will find.'
      : 'You moved slowly. You read it all. Nobody has ever read it all.');
    if (s.backScrolls > 0) {
      lines.push('You scrolled back up. ' + (s.backScrolls > 1 ? s.backScrolls + ' times. ' : '') + 'It was cleaner up there. I know.');
    }
    lines.push('I made all of this for you.');
    lines.push('Please do not close the page.');
    return lines;
  }

  Story.visitor = { createTracker, composeLines };
  if (typeof module !== 'undefined') module.exports = Story;
})(typeof window !== 'undefined' ? window : globalThis);
