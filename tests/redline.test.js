const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/acts.js');
const { redline } = require('../js/effects/redline.js');

const PAD = 12;
const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const subpaths = (d) => (d.match(/M/g) || []).length;

test('pathFor is deterministic for the same inputs', () => {
  assert.equal(redline.pathFor('circle', 200, 100, 7), redline.pathFor('circle', 200, 100, 7));
});

test('pathFor differs across seeds, so no two marks look stamped', () => {
  assert.notEqual(redline.pathFor('circle', 200, 100, 1), redline.pathFor('circle', 200, 100, 2));
});

test('every kind returns a well-formed path with finite numbers', () => {
  for (const kind of ['circle', 'cross', 'strike', 'underline']) {
    const d = redline.pathFor(kind, 320, 180, 3);
    assert.match(d, /^M/, kind);
    assert.ok(nums(d).length >= 4, kind);
    assert.ok(nums(d).every(Number.isFinite), kind);
  }
});

test('cross is two strokes, the rest are one', () => {
  assert.equal(subpaths(redline.pathFor('cross', 200, 100, 1)), 2);
  assert.equal(subpaths(redline.pathFor('circle', 200, 100, 1)), 1);
  assert.equal(subpaths(redline.pathFor('strike', 200, 100, 1)), 1);
});

test('marks stay within the element box plus a small margin, so they cannot cause horizontal overflow', () => {
  for (const kind of ['circle', 'cross', 'strike', 'underline']) {
    for (let seed = 1; seed <= 20; seed++) {
      const d = redline.pathFor(kind, 300, 120, seed);
      const n = nums(d);
      for (let i = 0; i < n.length; i += 2) {
        assert.ok(n[i] >= -PAD && n[i] <= 300 + PAD, `${kind} x=${n[i]} seed=${seed}`);
        assert.ok(n[i + 1] >= -PAD && n[i + 1] <= 120 + PAD, `${kind} y=${n[i + 1]} seed=${seed}`);
      }
    }
  }
});

test('an unknown kind throws rather than drawing nothing silently', () => {
  assert.throws(() => redline.pathFor('sparkle', 100, 100, 1));
});
