const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/acts.js');
const { engine } = require('../js/engine.js');

test('progressFrom is 0 at top', () => {
  assert.equal(engine.progressFrom(0, 2000, 800), 0);
});
test('progressFrom is 1 at bottom', () => {
  assert.equal(engine.progressFrom(1200, 2000, 800), 1);
});
test('progressFrom clamps negative overscroll to 0', () => {
  assert.equal(engine.progressFrom(-50, 2000, 800), 0);
});
test('progressFrom clamps positive overscroll to 1', () => {
  assert.equal(engine.progressFrom(5000, 2000, 800), 1);
});
test('progressFrom is 0 when page is not scrollable', () => {
  assert.equal(engine.progressFrom(10, 800, 800), 0);
});
test('resolveAct 0.30 is cracks with local ~0.25', () => {
  const r = engine.resolveAct(0.30);
  assert.equal(r.act.id, 'cracks');
  assert.ok(Math.abs(r.local - 0.25) < 1e-9);
});
test('resolveAct boundary 0.25 belongs to the later act', () => {
  assert.equal(engine.resolveAct(0.25).act.id, 'cracks');
});
test('resolveAct 1 is address with local 1', () => {
  const r = engine.resolveAct(1);
  assert.equal(r.act.id, 'address');
  assert.equal(r.local, 1);
});
test('intensity clamps to 0..1', () => {
  assert.equal(engine.intensity(-1), 0);
  assert.equal(engine.intensity(0.4), 0.4);
  assert.equal(engine.intensity(3), 1);
});
