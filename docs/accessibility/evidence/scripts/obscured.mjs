// Targeted reproduction of focus obscured by the Playground's sticky preview (WCAG 2.4.11).
// Reverse-tabs (Shift+Tab) from "Copy code" up through the Controls table and records, for each
// step, what is painted at the focused control's centre and its four focus-ring corners.
// Usage (repo root): node docs/accessibility/evidence/scripts/obscured.mjs > docs/accessibility/evidence/obscured.json
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://localhost:5173';
const shots = 'docs/accessibility/evidence/screenshots';
const browser = await chromium.launch({ channel: 'msedge' });
const out = { date: new Date().toISOString(), browser: browser.version(), runs: [] };

for (const [vp, comp] of [[{ width: 1440, height: 600 }, 'dialog'], [{ width: 1280, height: 720 }, 'card'], [{ width: 1280, height: 900 }, 'button']]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(`${base}/playground?component=${comp}`);
  await page.waitForSelector('[data-testid=preview-panel]');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Copy code' }).focus();
  const steps = [];
  let shot = null;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(900);
    const s = await page.evaluate(() => {
      const e = document.activeElement;
      const panel = document.querySelector('[data-testid=preview-panel]');
      if (panel.contains(e)) return { inPanel: true, t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30) };
      const target = e.closest('label') && e.type === 'radio' ? e.closest('label') : e.tagName === 'SUMMARY' ? e : e;
      const r = target.getBoundingClientRect();
      const pts = { centre: [r.left + r.width / 2, r.top + r.height / 2], topLeft: [r.left - 3, r.top - 3], topRight: [r.right + 3, r.top - 3], bottomLeft: [r.left - 3, r.bottom + 3], bottomRight: [r.right + 3, r.bottom + 3] };
      const hits = {};
      for (const [k, [x, y]] of Object.entries(pts)) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { hits[k] = 'offscreen'; continue; }
        const h = document.elementFromPoint(x, y);
        hits[k] = panel.contains(h) ? 'PREVIEW-PANEL' : (h === target || target.contains(h) || h?.contains(target)) ? 'self' : 'other';
      }
      const name = e.type === 'radio' ? `${document.getElementById(e.closest('[role=radiogroup]').getAttribute('aria-labelledby'))?.textContent} = ${e.value}` : (e.getAttribute('aria-label') || (e.labels && e.labels[0]?.textContent) || (e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby').split(' ')[0])?.textContent) || e.textContent || '').trim().slice(0, 40);
      const p = panel.getBoundingClientRect();
      return { t: name, tag: e.tagName.toLowerCase(), box: [Math.round(r.top), Math.round(r.bottom)], panel: [Math.round(p.top), Math.round(p.bottom)], panelPosition: getComputedStyle(panel).position, hits, fullyObscured: Object.values(hits).every((v) => v === 'PREVIEW-PANEL'), partiallyObscured: Object.values(hits).some((v) => v === 'PREVIEW-PANEL') };
    });
    steps.push(s);
    if (s.fullyObscured && !shot) {
      shot = `${shots}/obscured-${comp}-${vp.width}x${vp.height}.png`;
      await page.screenshot({ path: shot });
      s.screenshot = shot.replace('docs/accessibility/evidence/', '');
    }
  }
  out.runs.push({ viewport: vp, component: comp, fully: steps.filter((s) => s.fullyObscured).map((s) => s.t), partial: steps.filter((s) => s.partiallyObscured && !s.fullyObscured).map((s) => s.t), steps });
  console.error(vp.width, vp.height, comp, 'fully:', steps.filter((s) => s.fullyObscured).map((s) => s.t).join(' | '), '|| partial:', steps.filter((s) => s.partiallyObscured && !s.fullyObscured).length);
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
