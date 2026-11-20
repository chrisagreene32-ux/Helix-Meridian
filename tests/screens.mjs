import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const outDir = path.join(root, 'tests', 'out');
fs.mkdirSync(outDir, { recursive: true });

const SECTIONS = ['#hero', '#showcase', '#games', '#studio', '#press', '#signup'];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 }
};

let failures = 0;
function check(name, ok, detail = '') {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !detail ? '' : ' -- ' + detail));
  if (!ok) failures++;
}

async function open(browser, vp, opts = {}) {
  const context = await browser.newContext({ viewport: vp, ...opts });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForTimeout(200);
  return { context, page, errors };
}

const browser = await chromium.launch();

// ---- Task 3: the flawless site ----
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { context, page, errors } = await open(browser, vp);
  check(`[${name}] header.nav exists`, (await page.locator('header.nav').count()) === 1);
  check(`[${name}] footer exists`, (await page.locator('footer').count()) >= 1);
  for (const sel of SECTIONS) {
    check(`[${name}] ${sel} exists`, (await page.locator(sel).count()) === 1);
  }
  check(`[${name}] 3 game cards`, (await page.locator('#games .card').count()) === 3);
  check(`[${name}] 4 team members`, (await page.locator('#studio .member').count()) === 4);
  check(`[${name}] 3 press quotes`, (await page.locator('#press blockquote').count()) === 3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`[${name}] no horizontal overflow`, overflow <= 0, `overflow ${overflow}px`);
  check(`[${name}] no console errors`, errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: path.join(outDir, `act1-${name}.png`) });
  await context.close();
}

// ---- helpers for scroll-driven checks ----
async function seek(page, p) {
  await page.evaluate((p) => {
    // Seek by the engine's own mapping, so seek(p) lands on progress p even while the design has rotted.
    window.scrollTo({ top: p * window.Story.layout.maxScroll(), behavior: 'instant' });
  }, p);
  await page.waitForTimeout(150);
}
const count = (page, sel) => page.locator(sel).count();
const cssVar = (page, name) =>
  page.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) || 0, name);
const text = (page, sel) => page.locator(sel).first().innerText();

// ---- Task 4: effects for acts 2-4 ----
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { context, page, errors } = await open(browser, vp);
  const tag = `[${name}]`;
  const lede0 = await text(page, '.hero__lede');
  const showcase0 = await text(page, '#showcase h2');
  const footer0 = await text(page, '.footer__links');

  await seek(page, 0.10);
  check(`${tag} p=0.10 no notes`, (await count(page, '.note.is-on')) === 0);
  check(`${tag} p=0.10 no toasts`, (await count(page, '.toast.is-on')) === 0);
  check(`${tag} p=0.10 --glitch is 0`, (await cssVar(page, '--glitch')) === 0);
  check(`${tag} p=0.10 hero copy untouched`, (await text(page, '.hero__lede')) === lede0);

  await seek(page, 0.35);
  const notes35 = await count(page, '.note.is-on');
  const glitch35 = await cssVar(page, '--glitch');
  check(`${tag} p=0.35 at least one note`, notes35 >= 1, `got ${notes35}`);
  check(`${tag} p=0.35 --glitch > 0`, glitch35 > 0, `got ${glitch35}`);

  await seek(page, 0.55);
  const notes55 = await count(page, '.note.is-on');
  check(`${tag} p=0.55 more notes than p=0.35`, notes55 > notes35, `${notes55} vs ${notes35}`);
  check(`${tag} p=0.55 showcase heading rewritten`, (await text(page, '#showcase h2')) !== showcase0);
  const glitch55 = await cssVar(page, '--glitch');
  check(`${tag} p=0.55 --glitch grows`, glitch55 > glitch35, `${glitch55} vs ${glitch35}`);

  await seek(page, 0.75);
  check(`${tag} p=0.75 at least one toast`, (await count(page, '.toast.is-on')) >= 1);
  check(`${tag} p=0.75 footer links rewritten`, (await text(page, '.footer__links')) !== footer0);
  check(`${tag} p=0.75 --glitch grows again`, (await cssVar(page, '--glitch')) > glitch55);
  check(`${tag} p=0.75 --drift > 0`, (await cssVar(page, '--drift')) > 0);

  // Each note appears in view when its scroll position is reached.
  const notes = await page.evaluate(() => window.Story.notes.map((n) => n.at));
  let placed = 0;
  for (let i = 0; i < notes.length; i++) {
    await seek(page, notes[i] + 0.003);
    const ok = await page.evaluate((i) => {
      const el = document.querySelector(`.note[data-i="${i}"]`);
      if (!el || !el.classList.contains('is-on')) return false;
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
    }, i);
    if (ok) placed++;
  }
  check(`${tag} every note lands inside the viewport at its moment`, placed === notes.length, `${placed}/${notes.length}`);

  // Jump straight to the bottom, then back to the top: state follows progress only.
  await seek(page, 1);
  await seek(page, 0);
  check(`${tag} after jump to bottom and back: no notes`, (await count(page, '.note.is-on')) === 0);
  check(`${tag} after jump to bottom and back: no toasts`, (await count(page, '.toast.is-on')) === 0);
  check(`${tag} after jump to bottom and back: copy restored`, (await text(page, '.hero__lede')) === lede0 && (await text(page, '#showcase h2')) === showcase0 && (await text(page, '.footer__links')) === footer0);
  check(`${tag} after jump to bottom and back: effects at rest`, (await cssVar(page, '--glitch')) === 0 && (await cssVar(page, '--drift')) === 0);

  for (const p of [0.35, 0.55, 0.75]) {
    await seek(page, p);
    await page.screenshot({ path: path.join(outDir, `act-${String(p).replace('.', '')}-${name}.png`) });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`${tag} no horizontal overflow through the sweep`, overflow <= 0, `overflow ${overflow}px`);
  check(`${tag} no console errors through the sweep`, errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---- Task 5: direct address ----
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { context, page, errors } = await open(browser, vp);
  const tag = `[${name}]`;

  await seek(page, 0.5);
  check(`${tag} p=0.50 address hidden`, (await count(page, '#address.is-on')) === 0);

  await seek(page, 0.90);
  const dark = await page.evaluate(() => {
    const el = document.querySelector('#address');
    const cs = getComputedStyle(el);
    return { on: el.classList.contains('is-on'), bg: cs.backgroundColor, opacity: parseFloat(cs.opacity) };
  });
  check(`${tag} p=0.90 page is near-black`, dark.on && dark.bg === 'rgb(0, 0, 0)' && dark.opacity >= 0.9, JSON.stringify(dark));
  check(`${tag} p=0.90 first line is showing`, (await count(page, '#address p.is-shown')) >= 1);

  await seek(page, 1);
  const addr = await text(page, '#address');
  check(`${tag} p=1.0 names the real viewport`, addr.includes(`${vp.width} by ${vp.height}`), addr);
  check(`${tag} p=1.0 final line pinned on screen`, await page.evaluate(() => {
    const ps = [...document.querySelectorAll('#address p')];
    const last = ps[ps.length - 1];
    const r = last.getBoundingClientRect();
    return last.classList.contains('is-shown') && r.top >= 0 && r.bottom <= window.innerHeight;
  }));

  // Scrolling back up is noticed, once it has happened.
  await seek(page, 0.5);
  await seek(page, 1);
  check(`${tag} scrolling back up is acknowledged`, (await text(page, '#address')).includes('scrolled back up'));
  await seek(page, 0.5);
  check(`${tag} back at p=0.50 address hidden again`, (await count(page, '#address.is-on')) === 0);

  // A fresh visitor who jumps straight to the end still gets the address.
  const fresh = await open(browser, vp);
  await seek(fresh.page, 1);
  check(`${tag} instant jump to bottom renders the address`, (await text(fresh.page, '#address')).includes(' by '));
  check(`${tag} direct-address pass: no console errors`, errors.length === 0 && fresh.errors.length === 0, errors.concat(fresh.errors).join(' | '));
  await page.screenshot({ path: path.join(outDir, `act5-${name}.png`) });
  await seek(fresh.page, 1);
  await fresh.page.screenshot({ path: path.join(outDir, `act5-final-${name}.png`) });
  await fresh.context.close();
  await context.close();
}

// ---- Task 6: responsive, reduced motion, no-JS, resize ----
const SWEEP = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const SIZES = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1440, height: 900 } };

for (const [name, vp] of Object.entries(SIZES)) {
  const { context, page, errors } = await open(browser, vp);
  let worst = 0;
  for (const p of SWEEP) {
    await seek(page, p);
    worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
  }
  check(`[${name}] full sweep: no horizontal overflow`, worst <= 0, `worst ${worst}px`);
  check(`[${name}] full sweep: no console errors`, errors.length === 0, errors.join(' | '));
  await context.close();
}

{
  const { context, page, errors } = await open(browser, VIEWPORTS.desktop, { reducedMotion: 'reduce' });
  check('[reduced] Story.motion.reduced is true', await page.evaluate(() => window.Story.motion.reduced === true));
  let fast = [];
  let inverted = 0;
  let maxGlitch = 0;
  for (const p of SWEEP) {
    await seek(page, p);
    fast = fast.concat(await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName === 'none') return;
        const durs = cs.animationDuration.split(',').map((d) => (d.trim().endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000));
        if (durs.some((d) => d < 400) || cs.animationTimingFunction.includes('steps')) bad.push(el.className || el.tagName);
      });
      return bad;
    }));
    inverted += await count(page, '.is-inverted');
    maxGlitch = Math.max(maxGlitch, await cssVar(page, '--glitch'));
  }
  check('[reduced] no rapid or stepped animations anywhere', fast.length === 0, [...new Set(fast)].join(', '));
  check('[reduced] no inverted-flash sections', inverted === 0, `${inverted}`);
  check('[reduced] glitch strength is capped', maxGlitch <= 0.4, `max ${maxGlitch}`);
  check('[reduced] still tells the story (notes at 0.55)', await (async () => { await seek(page, 0.55); return (await count(page, '.note.is-on')) >= 1; })());
  check('[reduced] still ends with the address', await (async () => { await seek(page, 1); return (await text(page, '#address')).includes(' by '); })());
  check('[reduced] no console errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

{
  const { context, page, errors } = await open(browser, VIEWPORTS.desktop, { javaScriptEnabled: false });
  for (const sel of SECTIONS) check(`[no-js] ${sel} renders`, (await page.locator(sel).isVisible()));
  check('[no-js] hero shows the clean copy', (await text(page, '.hero__lede')).includes('next generation of action role-playing'));
  check('[no-js] no notes or toasts exist', (await count(page, '.note, .toast, #address')) === 0);
  check('[no-js] no console errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

{
  const { context, page, errors } = await open(browser, VIEWPORTS.desktop);
  await seek(page, 0.55);
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.waitForTimeout(250);
  const agree = await page.evaluate(() => {
    const de = document.documentElement;
    return { want: window.Story.engine.resolveAct(window.Story.layout.progress()).act.id, got: de.dataset.act };
  });
  check('[resize] act is recomputed for the new page height', agree.want === agree.got, JSON.stringify(agree));
  check('[resize] no console errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

{
  const { context, page, errors } = await open(browser, VIEWPORTS.desktop);
  await seek(page, 0.72);
  const snap = () => page.evaluate(() => ({
    act: document.documentElement.dataset.act,
    notes: document.querySelectorAll('.note.is-on').length,
    toasts: document.querySelectorAll('.toast.is-on').length
  }));
  const before = await snap();
  await page.reload();
  await page.waitForTimeout(500);
  const after = await snap();
  check('[reload] mid-page reload restores the same act, notes and toasts', JSON.stringify(before) === JSON.stringify(after) && before.act === 'contempt', `${JSON.stringify(before)} vs ${JSON.stringify(after)}`);
  check('[reload] no console errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---- Menace: the design itself rots, not just the comments ----
{
  const { context, page, errors } = await open(browser, VIEWPORTS.desktop);
  const cls = (sel, c) => page.evaluate(([s, c]) => !!document.querySelector(s)?.classList.contains(c), [sel, c]);
  const rootHas = (c) => page.evaluate((c) => document.documentElement.classList.contains(c), c);
  const atmo = () => cssVar(page, '--atmo');
  const member0 = await text(page, '.member h3');
  const cta0 = await text(page, '.nav__cta');

  await seek(page, 0.10);
  check('[menace] p=0.10 untouched: no peel, atmosphere, redlines, redactions or eyes',
    !(await rootHas('is-peel-1')) && (await atmo()) === 0 && (await count(page, '.redline.is-on')) === 0 &&
    (await count(page, '.redact')) === 0 && (await count(page, '.eye.is-on')) === 0);
  check('[menace] p=0.10 no jaws', (await cssVar(page, '--maw')) === 0);

  await seek(page, 0.30);
  check('[menace] p=0.30 guides appear (peel 1) but art is intact', (await rootHas('is-peel-1')) && !(await rootHas('is-peel-2')));

  await seek(page, 0.55);
  check('[menace] p=0.55 wireframe peel: placeholders and default fonts', (await rootHas('is-peel-2')) &&
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-display'))).includes('Times'));
  check('[menace] p=0.55 art panels become crossed-out placeholders', await page.evaluate(() => {
    const a = document.querySelector('#games .card__art');
    const cs = getComputedStyle(a);
    return cs.backgroundImage.includes('linear-gradient') && getComputedStyle(a, '::after').content.includes('PLACEHOLDER');
  }));
  const redlines55 = await count(page, '.redline.is-on');
  check('[menace] p=0.55 red-pen marks are drawn on the layout', redlines55 >= 1, `got ${redlines55}`);
  check('[menace] p=0.55 every drawn mark has a real path', await page.evaluate(() =>
    [...document.querySelectorAll('.redline.is-on')].every((s) => (s.querySelector('path')?.getAttribute('d') || '').startsWith('M'))));
  check('[menace] p=0.55 atmosphere is closing in', (await atmo()) > 0);
  check('[menace] p=0.55 no eyes yet', (await count(page, '.eye.is-on')) === 0);

  await seek(page, 0.75);
  check('[menace] p=0.75 raw peel (peel 3)', await rootHas('is-peel-3'));
  check('[menace] p=0.75 more redlines than p=0.55', (await count(page, '.redline.is-on')) > redlines55);
  check('[menace] p=0.75 names and words are redacted', (await count(page, '.redact')) >= 1);
  check('[menace] p=0.75 redacted text is still in the DOM (it is hidden, not deleted)', (await text(page, '.member h3')).length > 0 && (await page.evaluate(() => document.querySelector('.member h3 .redact')?.textContent.length > 0)));
  check('[menace] p=0.75 jaws are closing in and the logo is an eye', (await cssVar(page, '--maw')) > 0 && (await cls('.nav__mark', 'is-eye')));
  check('[menace] p=0.75 nav button now says Obey', (await text(page, '.nav__cta')) === 'Obey');
  check('[menace] p=0.75 something is watching', (await count(page, '.eye.is-on')) >= 1);
  check('[menace] p=0.75 cursor is no longer a cursor', (await page.evaluate(() => getComputedStyle(document.documentElement).cursor)).includes('url('));
  check('[menace] p=0.75 atmosphere stronger than p=0.55', (await atmo()) > 0.2);

  // Reactive page: controls rename themselves when approached.
  const react = await page.evaluate(() => {
    const b = document.querySelector('.signup__form .btn');
    const before = b.textContent;
    b.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    const during = b.textContent;
    b.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    return { before, during, after: b.textContent };
  });
  check('[menace] button renames on approach and restores on leave', react.during !== react.before && react.after === react.before, JSON.stringify(react));

  await seek(page, 1);
  const eyes1 = await count(page, '.eye.is-on');
  check('[menace] p=1.0 the dark is full of eyes', eyes1 >= 6, `got ${eyes1}`);
  check('[menace] p=1.0 the jaws have closed in further than at p=0.75', (await cssVar(page, '--maw')) > 0.5);
  await page.mouse.move(80, 80);
  await page.waitForTimeout(120);
  const look1 = await page.evaluate(() => document.querySelector('.eye.is-on').style.getPropertyValue('--px') + '/' + document.querySelector('.eye.is-on').style.getPropertyValue('--py'));
  await page.mouse.move(1360, 840);
  await page.waitForTimeout(120);
  const look2 = await page.evaluate(() => document.querySelector('.eye.is-on').style.getPropertyValue('--px') + '/' + document.querySelector('.eye.is-on').style.getPropertyValue('--py'));
  check('[menace] eyes follow the cursor', look1 !== look2 && look1 !== '/' && look2 !== '/', `${look1} vs ${look2}`);
  await page.screenshot({ path: path.join(outDir, 'menace-final-desktop.png') });

  for (const p of [0.30, 0.55, 0.75]) {
    await seek(page, p);
    await page.screenshot({ path: path.join(outDir, `menace-${String(p).replace('.', '')}-desktop.png`) });
  }

  // Everything comes back clean when you return to the top.
  await seek(page, 0);
  check('[menace] back at top: every design effect is gone',
    !(await rootHas('is-peel-1')) && (await atmo()) === 0 && (await count(page, '.redline.is-on')) === 0 &&
    (await count(page, '.redact')) === 0 && (await count(page, '.eye.is-on')) === 0 && (await cssVar(page, '--maw')) === 0 && !(await cls('.nav__mark', 'is-eye')));
  check('[menace] back at top: names and nav text restored', (await text(page, '.member h3')) === member0 && (await text(page, '.nav__cta')) === cta0);
  check('[menace] no console errors', errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
