const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/acts.js');
const { visitor } = require('../js/visitor.js');

function clock() {
  let t = 0;
  const now = () => t;
  now.set = (v) => { t = v; };
  return now;
}
const VP = { w: 1280, h: 720 };

test('fast scroll: 3000px in 1s is flagged fast', () => {
  const now = clock();
  const tr = visitor.createTracker(now);
  tr.onScroll(0);
  now.set(1000);
  tr.onScroll(3000);
  assert.equal(tr.snapshot(VP).fast, true);
});

test('slow scroll: 300px in 10s is not fast', () => {
  const now = clock();
  const tr = visitor.createTracker(now);
  tr.onScroll(0);
  now.set(10000);
  tr.onScroll(300);
  assert.equal(tr.snapshot(VP).fast, false);
});

test('down 500 then up 300 counts one back-scroll', () => {
  const now = clock();
  const tr = visitor.createTracker(now);
  tr.onScroll(0);
  tr.onScroll(500);
  tr.onScroll(200);
  assert.equal(tr.snapshot(VP).backScrolls, 1);
});

test('down 500 then up 100 is not a back-scroll', () => {
  const now = clock();
  const tr = visitor.createTracker(now);
  tr.onScroll(0);
  tr.onScroll(500);
  tr.onScroll(400);
  assert.equal(tr.snapshot(VP).backScrolls, 0);
});

test('seconds on page is a whole number', () => {
  const now = clock();
  const tr = visitor.createTracker(now);
  now.set(12999);
  assert.equal(tr.snapshot(VP).seconds, 12);
});

test('composeLines names the viewport', () => {
  const lines = visitor.composeLines({ seconds: 5, avgSpeed: 10, backScrolls: 0, viewport: VP, fast: false });
  assert.ok(lines.some((l) => l.includes('1280 by 720')));
});

test('composeLines includes whole seconds', () => {
  const lines = visitor.composeLines({ seconds: 47, avgSpeed: 10, backScrolls: 0, viewport: VP, fast: false });
  assert.ok(lines.some((l) => l.includes('47')));
});

test('composeLines omits back-scroll line when none, includes when present', () => {
  const base = { seconds: 5, avgSpeed: 10, viewport: VP, fast: false };
  const none = visitor.composeLines({ ...base, backScrolls: 0 });
  const some = visitor.composeLines({ ...base, backScrolls: 2 });
  assert.equal(some.length, none.length + 1);
});

test('composeLines differs on fast', () => {
  const base = { seconds: 5, avgSpeed: 10, backScrolls: 0, viewport: VP };
  const a = visitor.composeLines({ ...base, fast: true });
  const b = visitor.composeLines({ ...base, fast: false });
  assert.notDeepEqual(a, b);
});
