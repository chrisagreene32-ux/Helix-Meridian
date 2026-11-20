(function (root) {
  const Story = (root.Story = root.Story || {});
  Story.effects = Story.effects || {};

  // Act thresholds are the single source of truth; engine code never hardcodes them.
  Story.acts = [
    { id: 'flawless',    start: 0.00, end: 0.25 },
    { id: 'cracks',      start: 0.25, end: 0.45 },
    { id: 'frustration', start: 0.45, end: 0.65 },
    { id: 'contempt',    start: 0.65, end: 0.85 },
    { id: 'address',     start: 0.85, end: 1.00 }
  ];

  if (typeof module !== 'undefined') module.exports = Story.acts;
})(typeof window !== 'undefined' ? window : globalThis);
