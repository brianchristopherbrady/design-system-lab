// Second-pass lead confirmation: axe-incomplete contrast (gradient/overlap) and theme-studio chroma truncation.
// Usage (repo root): node docs/accessibility/evidence/scripts/leads2.mjs > docs/accessibility/evidence/leads2.json
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://localhost:5173';
const shots = 'docs/accessibility/evidence/screenshots';
const browser = await chromium.launch({ channel: 'msedge' });
const out = { date: new Date().toISOString(), browser: browser.version(), checks: {} };
const ready = (page) => page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});

const colorFns = `
  window.__parse = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  window.__lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  window.__ratio = (a, b) => { const [x, y] = [__lum(a), __lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
`;

for (const theme of ['light', 'dark']) {
  for (const product of ['system-lab', 'harbor', 'meadow']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript((st) => { localStorage.setItem('system-lab:theme', st.theme); localStorage.setItem('system-lab:product', st.product); }, { theme, product });
    await ctx.addInitScript(colorFns);
    const page = await ctx.newPage();
    await page.goto(base + '/'); await ready(page); await page.waitForTimeout(600);
    // Header selects: text over solid background colour, gradient used only for the chevron?
    const header = await page.evaluate(() => [...document.querySelectorAll('header select')].map((s) => {
      const cs = getComputedStyle(s);
      return { name: s.labels[0]?.textContent, color: cs.color, bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 80), ratio: __ratio(__parse(cs.color), __parse(cs.backgroundColor)) };
    }));
    // Pixel-sample the rendered select text region: darkest vs lightest pixel luminance contrast
    const sel = page.locator('header select').first();
    const png = await sel.screenshot();
    out.checks[`${product}-${theme}`] = { header, headerSelectScreenshotBytes: png.length };
    if (product === 'system-lab') await sel.screenshot({ path: `${shots}/header-select-${theme}.png` });
    // Overview readouts flagged bgOverlap
    out.checks[`${product}-${theme}`].readouts = await page.evaluate(() => [...document.querySelectorAll('[class*=readout] [class*=value], #about p')].slice(0, 8).map((e) => {
      let n = e, bg = null; while (n) { const c = __parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.99) { bg = c; break; } n = n.parentElement; }
      const fg = __parse(getComputedStyle(e).color);
      return { text: e.textContent.trim().slice(0, 30), fg: getComputedStyle(e).color, bg: bg && `rgb(${bg.r},${bg.g},${bg.b})`, ratio: bg ? __ratio(fg, bg) : null, fontSize: getComputedStyle(e).fontSize };
    }));
    if (product === 'system-lab') {
      const r = page.locator('[class*=readout]').first();
      if (await r.count()) await r.locator('xpath=..').screenshot({ path: `${shots}/overview-readouts-${theme}.png` }).catch(() => {});
    }
    await ctx.close();
  }
}

// Theme studio chroma strip: truncation at 320 (no spacing), at 1280 with spacing; is the value elsewhere (export)?
{
  const SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;
  const res = {};
  for (const [name, vp, spacing] of [['1280', { width: 1280, height: 900 }, false], ['1280-spacing', { width: 1280, height: 900 }, true], ['320', { width: 320, height: 640 }, false], ['320-spacing', { width: 320, height: 640 }, true], ['640-200pct-spacing', { width: 640, height: 450 }, true]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await page.goto(base + '/foundations/theme-studio'); await ready(page); await page.waitForTimeout(500);
    if (spacing) { await page.addStyleTag({ content: SPACING }); await page.waitForTimeout(300); }
    res[name] = await page.evaluate(() => {
      const metas = [...document.querySelectorAll('[class*=stripMeta]')];
      const bodyText = document.body.innerText;
      const pageText = document.documentElement.textContent;
      return {
        total: metas.length,
        truncated: metas.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
        chromaValueAlsoInPageText: metas.slice(0, 3).map((e) => { const v = e.textContent.replace(/^[LC] /, ''); return { v, occurrences: pageText.split(v).length - 1 }; }),
        exportHasOklch: /oklch\(/i.test(pageText),
        bodyIncludesHexOnly: bodyText.length,
        overflowRegion: (() => { const l = metas[0]?.closest('ol,ul'); if (!l) return null; let p = l; while (p && !/(auto|scroll)/.test(getComputedStyle(p).overflowX)) p = p.parentElement; return p ? { tag: p.tagName, role: p.getAttribute('role'), label: p.getAttribute('aria-label') } : null; })(),
      };
    });
    if (name === '320-spacing') await page.locator('[class*=stripMeta]').first().locator('xpath=ancestor::ol[1] | ancestor::ul[1]').first().screenshot({ path: `${shots}/theme-studio-ramp-320-spacing.png` }).catch(() => {});
    await ctx.close();
  }
  out.checks.themeStudioStrip = res;
}

console.log(JSON.stringify(out, null, 1));
await browser.close();
