# The AI Designer Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page fake game-studio site that starts polished and degrades into AI-narrated horror as the visitor scrolls, ending in direct address.

**Architecture:** Plain HTML/CSS and classic (non-module) scripts sharing a `window.Story` namespace, so `index.html` works from `file://` and any static host. Pure logic (act resolution, visitor tracking, line composition) lives in small files that also export via `module.exports` for `node --test`. Visual effects are isolated modules driven by one scroll-progress engine; the browser is verified with Playwright screenshots.

**Tech Stack:** HTML, CSS (variables), vanilla JS, `node --test` for logic, Playwright (pre-installed) for browser checks. No build step, no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-20-ai-designer-site-design.md`

## Global Constraints

- Studio: **Helix Meridian Interactive**. Game: **AURORA PROTOCOL**.
- Acts by progress: flawless 0.00-0.25, cracks 0.25-0.45, frustration 0.45-0.65, contempt 0.65-0.85, address 0.85-1.00.
- Sleek dark cinematic sci-fi look. Equal mobile and desktop polish. No audio.
- No build step, no runtime dependencies, works from `file://`. No network requests of any kind.
- Visitor-aware lines use only local info: scroll behavior, viewport, time on page.
- `prefers-reduced-motion`: same story, motion toned down, no flashing.
- Effects expose `apply(intensity)` and `reset()`; act data lives in `js/acts.js`, never in engine code.
- Commit only after `git init` in `~/ai-designer-site` (the user has not yet asked for commits; ask once before the first one).

## Review Focus

- Jump to bottom instantly (anchor, End key, fast fling): effects must reflect current progress, not event history, so no act is "skipped".
- Reload mid-page (browser restores scroll): the correct act renders immediately with no stale state.
- Scrolling back up: state follows progress both ways, and the address act notes the retreat once.
- Overscroll or rubber-band on touch makes progress go below 0 or above 1: clamp.
- Resize, rotation or zoom changes page height: progress is recomputed, not cached.
- Reduced motion on: no flashing or rapid movement at any progress.
- JavaScript disabled or failing: the page still shows the clean Act 1 site.

---

### Task 1: Scroll engine and act data

**Files:**
- Create: `js/acts.js`, `js/engine.js`, `tests/engine.test.js`

**Interfaces:**
- Produces (`window.Story.acts`): array of `{ id: 'flawless'|'cracks'|'frustration'|'contempt'|'address', start: number, end: number }` with the thresholds from Global Constraints, plus per-act data fields added by later tasks.
- Produces (`window.Story.engine`):
  - `clamp01(x: number): number`
  - `progressFrom(scrollY: number, scrollHeight: number, viewportHeight: number): number` — clamped 0..1; returns 0 when the page is not scrollable.
  - `resolveAct(progress: number): { act: Act, local: number }` — `local` is progress within the act, 0..1.
  - `intensity(progress: number): number` — global degradation 0..1, equal to clamped progress.

- [ ] **Step 1: Write failing tests** in `tests/engine.test.js` (`node:test`): `progressFrom(0,2000,800)===0`; `progressFrom(1200,2000,800)===1`; `progressFrom(-50,2000,800)===0` and `progressFrom(5000,2000,800)===1` (overscroll clamp); `progressFrom(10,800,800)===0` (unscrollable); `resolveAct(0.30).act.id==='cracks'` and `local` ≈ 0.25; `resolveAct(0.25).act.id==='cracks'` (boundary belongs to the later act); `resolveAct(1).act.id==='address'` and `local===1`.
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** both files as classic scripts attaching to `window.Story` and also `module.exports` when `typeof module !== 'undefined'`. `resolveAct` scans the acts array; no hardcoded thresholds in the engine.
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 5: Commit** (`git init` first if needed).

---

### Task 2: Visitor tracker and address-line composer

**Files:**
- Create: `js/visitor.js`, `tests/visitor.test.js`

**Interfaces:**
- Consumes: `clamp01` not needed.
- Produces (`window.Story.visitor`):
  - `createTracker(now: () => number): Tracker` where `Tracker` has `onScroll(y: number)`, `snapshot(viewport: {w: number, h: number}): Snapshot`.
  - `Snapshot = { seconds: number, avgSpeed: number, backScrolls: number, viewport: {w, h}, fast: boolean }` — `fast` is true when `avgSpeed` exceeds 1500 px/s; `backScrolls` counts direction changes from down to up of at least 200 px.
  - `composeLines(s: Snapshot): string[]` — ordered lines for the final act. Always includes a line naming the viewport as `"{w} by {h}"`, a line with whole seconds spent on page, one line differing on `fast`, and a back-scroll line only when `backScrolls > 0`.

- [ ] **Step 1: Write failing tests**: fake clock; scrolling down 3000 px over 1 s gives `fast===true`; slow scroll gives `fast===false`; down 500 then up 300 gives `backScrolls===1`, and up 100 gives 0; `composeLines` contains `"1280 by 720"` when the viewport is 1280×720; omits the back-scroll line when `backScrolls===0`; seconds appear as a whole number.
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL.
- [ ] **Step 3: Implement** with the UMD export pattern from Task 1. Write the copy so it is calm and a little too observant (e.g. “You are reading this on a 1280 by 720 window. I chose that grid.”).
- [ ] **Step 4: Run** `node --test tests/` — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 3: The flawless site (Act 1 markup and styles)

**Files:**
- Create: `index.html`, `styles.css`, `tests/screens.mjs`

**Interfaces:**
- Produces: the HTML sections in order: `header.nav`, `section#hero`, `section#showcase`, `section#games` (3 cards), `section#studio` (team, 4 members), `section#press` (3 quotes), `section#signup`, `footer`. Each element that later effects target carries `data-effect` (`glitch` on headings, `drift` on cards, `notes` on sections) and every section has `data-act` naming the act whose effects first touch it.
- Produces CSS variables on `:root`: `--bg`, `--fg`, `--accent`, `--font-display`, `--font-body`, `--space`, `--glitch` (0..1), `--drift` (0..1), `--dread` (0..1), set by effects later.

- [ ] **Step 1:** Write `tests/screens.mjs` (Playwright, plain node): loads `index.html` over `file://` at 1440×900 and 390×844, asserts no console errors and no horizontal overflow (`scrollWidth <= innerWidth`), asserts all eight sections exist, saves a top-of-page screenshot to `tests/out/act1-{desktop,mobile}.png`.
- [ ] **Step 2: Run** `node tests/screens.mjs` — Expected: FAIL (`index.html` missing).
- [ ] **Step 3: Build** the page. Use the `frontend-design` or `design-taste-frontend` skill for art direction: cinematic hero with CSS-only gradient/shape art (no external images or fonts), distinctive type pairing from system fonts, restrained palette, tasteful hover states. Copy is confident corporate boilerplate for Helix Meridian Interactive and AURORA PROTOCOL. The newsletter form is fake (no network).
- [ ] **Step 4: Run** `node tests/screens.mjs` — Expected: PASS. Open both screenshots and judge them: this must look like a $10k site, not a template.
- [ ] **Step 5: Commit.**

---

### Task 4: Effects for acts 2-4 and wiring

**Files:**
- Create: `js/effects/glitch.js`, `js/effects/drift.js`, `js/effects/notes.js`, `js/effects/toasts.js`, `js/main.js`
- Modify: `js/acts.js` (add per-act data), `index.html` (script tags), `styles.css` (effect styles)

**Interfaces:**
- Consumes: `Story.engine.progressFrom`, `resolveAct`, `intensity` (Task 1); `Story.acts`.
- Produces: each effect registers `Story.effects.<name> = { apply(intensity: number, ctx: { act: Act, local: number }): void, reset(): void }` for `glitch`, `drift`, `notes`, `toasts`.
  - `glitch`: scrambles/distorts `[data-effect~=glitch]` text proportionally to intensity; stores original text and restores it on `reset()`.
  - `drift`: sets `--drift` and offsets `[data-effect~=drift]` elements by a few pixels, growing into overlap and inversion in the contempt act.
  - `notes`: shows margin design notes from `acts.js` data. Each act owns a list; notes appear as `local` passes their `at` value, and the copy escalates from polite to sarcastic to contemptuous per the spec acts 2-4.
  - `toasts`: contempt-act fake 404s and error toasts, shown once each per crossing and hidden on the way back; footer link text swaps (e.g. “Humanity: a case study”) with originals restored on `reset()`.
- `main.js`: on `scroll`, `resize` and load it recomputes progress via `requestAnimationFrame` (one read per frame), resolves the act, and calls `apply` on the effects the act lists, `reset` on the others. State derives only from current progress.

- [ ] **Step 1: Extend `tests/screens.mjs`**: for progress 0.10, 0.35, 0.55, 0.75 scroll to that fraction, wait one frame, assert: at 0.10 no `.note` or `.toast` is visible and heading text equals the original; at 0.35 at least one `.note` is visible; at 0.55 more notes than at 0.35; at 0.75 at least one `.toast` is visible. Also assert: jumping directly to the bottom then back to 0 restores original heading text and hides all notes/toasts; no console errors throughout. Save a screenshot per progress to `tests/out/`.
- [ ] **Step 2: Run** `node tests/screens.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** the four effects and `main.js`, and write the escalating note and toast copy in `js/acts.js`. Keep every effect a pure function of `(intensity, ctx)` plus cached original DOM state.
- [ ] **Step 4: Run** `node tests/screens.mjs` — Expected: PASS. Open the screenshots and judge whether the escalation reads clearly.
- [ ] **Step 5: Commit.**

---

### Task 5: Final act, direct address

**Files:**
- Create: `js/effects/address.js`
- Modify: `js/main.js` (create the tracker, feed `onScroll`, pass the snapshot), `js/acts.js`, `index.html`, `styles.css`

**Interfaces:**
- Consumes: `Story.visitor.createTracker`, `composeLines` (Task 2); effect contract from Task 4.
- Produces: `Story.effects.address` — drives `--dread` toward near-black, fades site sections out, and reveals `composeLines(snapshot)` one line at a time as `local` advances, with the final line pinned on screen at `local === 1`. `reset()` hides it and restores the site.

- [ ] **Step 1: Extend `tests/screens.mjs`**: at progress 0.90 the page background is near-black (luminance below 0.1); at 1.0 an element `#address` shows the viewport line matching the actual `innerWidth by innerHeight`, the final line is visible, and at 1.0 after scrolling back up to 0.5 `#address` is hidden. Add a case that scrolls instantly to bottom (`window.scrollTo(0, document.body.scrollHeight)`) and asserts the address text is rendered.
- [ ] **Step 2: Run** `node tests/screens.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** `address.js` and the tracker wiring in `main.js`. The final line is written in `acts.js` and should be quiet and specific, not melodramatic.
- [ ] **Step 4: Run** `node tests/screens.mjs` — Expected: PASS. Review the screenshots at 0.90 and 1.00 on desktop and mobile.
- [ ] **Step 5: Commit.**

---

### Task 6: Responsive, reduced-motion and no-JS hardening

**Files:**
- Modify: `styles.css`, `js/main.js`, `js/effects/*.js`, `index.html`, `tests/screens.mjs`

**Interfaces:**
- Consumes: all effects. Produces: `Story.motion.reduced: boolean` read once at load and on `change`, which effects consult to cap intensities and disable flashing and rapid movement.

- [ ] **Step 1: Extend `tests/screens.mjs`**: run the full progress sweep at 390×844, 820×1180 and 1440×900 with no horizontal overflow and no console errors; run again with `reducedMotion: 'reduce'` and assert no element has a CSS animation with duration under 400 ms and none uses `steps()`; with JavaScript disabled (`javaScriptEnabled: false`) assert all eight sections render and no `.note` or `.toast` exists; resize mid-scroll from 1440 to 390 wide and assert the act matches the new progress.
- [ ] **Step 2: Run** `node tests/screens.mjs` — Expected: FAIL.
- [ ] **Step 3: Fix** the failures: touch-friendly effect variants (no hover-dependent effects on mobile), a `Story.motion` flag, a `<noscript>`-safe base, and the optional one-line content notice at the top of `index.html`.
- [ ] **Step 4: Run** `node tests/screens.mjs` and `node --test tests/` — Expected: all PASS. Review mobile screenshots for every act.
- [ ] **Step 5: Commit.**

---

## Self-Review

- **Spec coverage:** acts and thresholds (Tasks 1, 4, 5); studio, game and the polished site (Task 3); effects and data-driven acts (Task 4); direct address with local-only details (Tasks 2, 5); responsive, reduced motion and notice (Task 6); testing with Playwright screenshots (Tasks 3-6). Out-of-scope items (audio, backend, analytics) are absent.
- **Type consistency:** `resolveAct` returns `{ act, local }` and is consumed that way in Tasks 4 and 5. The effect contract `apply(intensity, ctx)` / `reset()` is the same across all effects. `Snapshot` fields match between Tasks 2 and 5.
- **Review Focus coverage:** jump-to-bottom, reload mid-page and resize (Tasks 4, 5, 6); scroll-back-up (Tasks 4, 5); overscroll clamp (Task 1); reduced motion and no-JS (Task 6). Reload mid-page is covered by progress-only state in `main.js` (computed on load), and the Task 4 jump-and-return test checks the derived state.
