// Axe sweep: discovers every route from the shell navs, runs axe (WCAG 2.0-2.2 A/AA tags)
// in several product/theme/density combinations. Usage: node axe-sweep.mjs > ../axe-sweep.json
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.BASE ?? 'http://localhost:5173';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const browser = await chromium.launch({ channel: 'msedge' });

async function discover() {
  const page = await browser.newPage();
  const set = new Set(['/', '/foundations', '/components', '/playground', '/patterns', '/decisions', '/no-such-page']);
  for (const s of ['/foundations', '/components', '/patterns', '/decisions']) {
    await page.goto(base + s, { waitUntil: 'load' }); await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});
    for (const h of await page.$$eval('nav a[href]', (as) => as.map((a) => a.getAttribute('href')))) {
      if (h && h.startsWith('/') && !h.includes('#')) set.add(h);
    }
  }
  await page.close();
  return [...set];
}

const routes = await discover();
const combos = [
  { name: 'lab-light', theme: 'light' },
  { name: 'lab-dark', theme: 'dark' },
  { name: 'harbor-dark-compact', theme: 'dark', product: 'harbor', density: 'compact' },
  { name: 'meadow-light', theme: 'light', product: 'meadow' },
];
const out = { base, date: new Date().toISOString(), routes, results: [] };
for (const c of combos) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((c) => {
    localStorage.setItem('system-lab:theme', c.theme);
    if (c.product) localStorage.setItem('system-lab:product', c.product);
    if (c.density) localStorage.setItem('system-lab:density', c.density);
  }, c);
  const page = await ctx.newPage();
  const list = c.name === 'lab-light' || c.name === 'lab-dark' ? routes : routes.filter((_, i) => i % 3 === 0);
  for (const r of list) {
    await page.goto(base + r, { waitUntil: 'load' }); await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(300);
    const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, tags: x.tags.filter((t) => t.startsWith('wcag') || t === 'best-practice'), n: x.nodes.length, targets: x.nodes.slice(0, 4).map((n) => n.target.join(' ')), summary: x.nodes[0]?.failureSummary?.slice(0, 300) }));
    out.results.push({ combo: c.name, route: r, violations: v, incomplete: res.incomplete.map((x) => `${x.id}:${x.nodes.length}`) });
    console.error(c.name, r, v.map((x) => x.id).join(',') || 'clean');
  }
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();

