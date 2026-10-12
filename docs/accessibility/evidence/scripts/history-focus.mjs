// Focus after browser Back/Forward (history pop) and Overview readout label contrast.
// Usage (repo root): node docs/accessibility/evidence/scripts/history-focus.mjs > docs/accessibility/evidence/history-focus.json
import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const b = await chromium.launch({ channel: 'msedge' });
const out = { date: new Date().toISOString(), browser: b.version() };
const where = (p) => p.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'BODY' : `${e.tagName.toLowerCase()} "${(e.textContent || '').trim().slice(0, 30)}"`; });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const click = async (name) => { await p.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name }).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700); };
await p.goto(base + '/'); await p.waitForSelector('main h1');
await click('Components'); const a1 = await where(p);
await click('Patterns'); const a2 = await where(p);
await p.goBack(); await p.waitForTimeout(700); const backToComponents = { url: p.url(), focus: await where(p) };
await p.goBack(); await p.waitForTimeout(700); const backToInitial = { url: p.url(), focus: await where(p) };
await p.keyboard.press('Tab'); backToInitial.nextTab = await where(p);
await p.goForward(); await p.waitForTimeout(700); const forward = { url: p.url(), focus: await where(p) };
out.history = { afterComponentsLink: a1, afterPatternsLink: a2, backToComponents, backToInitial, forward };
await p.goto(base + '/'); await p.waitForSelector('main h1'); await p.waitForTimeout(500);
out.readouts = await p.evaluate(() => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((m, n) => n - m); return +((h + 0.05) / (l + 0.05)).toFixed(2); };
  return [...document.querySelectorAll('[class*=readout]')].slice(0, 4).flatMap((r) => [...r.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => {
    let n = e, bg = null; while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0.99) { bg = c; break; } n = n.parentElement; }
    return { text: e.textContent.trim(), color: getComputedStyle(e).color, bg: bg && `rgb(${bg.r}, ${bg.g}, ${bg.b})`, size: getComputedStyle(e).fontSize, ratio: bg ? ratio(parse(getComputedStyle(e).color), bg) : null };
  }));
});
console.log(JSON.stringify(out, null, 1));
await b.close();
