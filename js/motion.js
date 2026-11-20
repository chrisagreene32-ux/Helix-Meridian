(function (root) {
  const Story = (root.Story = root.Story || {});
  const mq = root.matchMedia('(prefers-reduced-motion: reduce)');

  // Effects read `Story.motion.reduced` each frame, so a change in the OS setting takes effect without a reload.
  Story.motion = { reduced: mq.matches };
  const update = (e) => { Story.motion.reduced = e.matches; };
  if (mq.addEventListener) mq.addEventListener('change', update);
  else if (mq.addListener) mq.addListener(update);
})(window);
