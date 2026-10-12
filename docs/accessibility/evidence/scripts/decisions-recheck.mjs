// Re-sweep of /decisions routes after the user's mid-audit commits 260b98f and f71814a (decisions content only).
// Usage (repo root): node docs/accessibility/evidence/scripts/decisions-recheck.mjs > docs/accessibility/evidence/decisions-recheck.json
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base = 'http://localhost:5173';
const b = await chromium.launch({ channel: 'msedge' });
const out = { date: new Date().toISOString(), browser: b.version(), results: [] };
const routes = ['/decisions', '/decisions/planning', '/decisions/sharing', '/decisions/implementation', '/decisions/operating'];
for (const theme of ['light', 'dark']) {
  for (const [vpName, vp] of [['1280', { width: 1280, height: 900 }], ['320', { width: 320, height: 256 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.addInitScript((t) => localStorage.setItem('system-lab:theme', t), theme);
    const p = await ctx.newPage();
    for (const r of routes) {
      await p.goto(base + r); await p.waitForSelector('main h1', { timeout: 15000 }); await p.waitForTimeout(400);
      const entry = { theme, viewport: vpName, route: r };
      entry.structure = await p.evaluate(() => ({ title: document.title, h1: document.querySelectorAll('h1').length, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, skips: (() => { const l = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5')].map((h) => +h.tagName[1]); const s = []; for (let i = 1; i < l.length; i++) if (l[i] - l[i - 1] > 1) s.push(`${l[i - 1]}->${l[i]}`); return s; })(), noOutline: 0 }));
      if (vpName === '1280') {
        const res = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        entry.violations = res.violations.map((v) => ({ id: v.id, n: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')), summary: v.nodes[0]?.failureSummary?.slice(0, 200) }));
        // keyboard pass through main: every focus stop shows an outline
        await p.locator('main h1').focus();
        const stops = [];
        for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); const s = await p.evaluate(() => { const e = document.activeElement; if (!e.closest('main')) return null; const c = getComputedStyle(e); return { t: (e.textContent || '').trim().slice(0, 30), outline: c.outlineStyle + ' ' + c.outlineWidth }; }); if (!s) break; stops.push(s); }
        entry.focusStops = stops.length; entry.noOutline = stops.filter((s) => s.outline.startsWith('none'));
      }
      out.results.push(entry);
      console.error(theme, vpName, r, entry.violations?.map((v) => v.id).join(',') ?? '', 'ovf', entry.structure.pageOverflow, 'skips', entry.structure.skips.join(','), 'noOutline', entry.noOutline?.length ?? '');
    }
    await ctx.close();
  }
}
console.log(JSON.stringify(out, null, 1));
await b.close();
