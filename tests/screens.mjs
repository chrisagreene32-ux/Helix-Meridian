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

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
