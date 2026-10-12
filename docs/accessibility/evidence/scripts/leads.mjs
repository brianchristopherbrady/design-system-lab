// Follow-up probes that confirm or dismiss automated/structural leads.
// Usage (repo root): node docs/accessibility/evidence/scripts/leads.mjs > docs/accessibility/evidence/leads.json
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5173';
const shots = 'docs/accessibility/evidence/screenshots';
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const out = { base, date: new Date().toISOString(), browser: browser.version(), checks: {} };
const log = (k, v) => { out.checks[k] = v; console.error(k, JSON.stringify(v).slice(0, 400)); };
const ready = (page) => page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});
async function ctxPage(vp = { width: 1280, height: 900 }, storage = {}, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...extra });
  await ctx.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, storage);
  return { ctx, page: await ctx.newPage() };
}

const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const run = (s) => !only || only.includes(s);
// A. Playground sticky preview vs focused controls (WCAG 2.4.11) at several viewports, forward and reverse.
if (run('A')) {
  const res = {};
  for (const vp of [{ width: 1280, height: 900 }, { width: 1280, height: 720 }, { width: 1440, height: 600 }, { width: 1024, height: 768 }]) {
    for (const comp of ['button', 'card', 'dialog']) {
      const { ctx, page } = await ctxPage(vp);
      await page.goto(`${base}/playground?component=${comp}`); await ready(page);
      await page.waitForSelector('[data-testid=preview-panel]');
      const sticky = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=preview-panel]')).position);
      const measure = () => page.evaluate(() => {
        const e = document.activeElement; const r = e.getBoundingClientRect();
        const panel = document.querySelector('[data-testid=preview-panel]'); const p = panel.getBoundingClientRect();
        const inPanel = panel.contains(e);
        // the focus indicator area = element box + 4px (outline 2 + offset 2)
        const top = r.top - 4, bottom = r.bottom + 4;
        const coveredTop = Math.max(top, p.top), coveredBottom = Math.min(bottom, p.bottom);
        const covered = !inPanel && coveredBottom > coveredTop ? (coveredBottom - coveredTop) / (bottom - top) : 0;
        // also check topmost element at the centre of the focused element
        const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
        const hit = document.elementFromPoint(cx, cy);
        return { t: (e.getAttribute('aria-label') || (e.labels && e.labels[0]?.textContent) || e.textContent || e.value || e.tagName).trim().slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), panelTop: Math.round(p.top), panelBottom: Math.round(p.bottom), covered: +covered.toFixed(2), centreHitsFocused: hit === e || e.contains(hit) || (hit && hit.closest('label') === e.closest('label')), inPanel };
      });
      const seq = [];
      // forward through the whole page from preview options to the end, then backwards
      await page.getByRole('button', { name: 'Copy example link' }).focus();
      for (let i = 0; i < 45; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); seq.push({ dir: 'fwd', ...(await measure()) }); }
      for (let i = 0; i < 45; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(60); seq.push({ dir: 'rev', ...(await measure()) }); }
      const worst = seq.filter((s) => s.covered >= 0.99 || (s.covered > 0 && !s.centreHitsFocused));
      const key = `${vp.width}x${vp.height}:${comp}`;
      res[key] = { sticky, steps: seq.length, partial: seq.filter((s) => s.covered > 0 && s.covered < 0.99).length, fullyCovered: seq.filter((s) => s.covered >= 0.99).length, examples: worst.slice(0, 6) };
      if (worst.length && !fs.existsSync(`${shots}/playground-focus-obscured.png`)) {
        // reproduce the first fully covered step and capture it
        const w = worst.find((s) => s.covered >= 0.99) ?? worst[0];
        await page.goto(`${base}/playground?component=${comp}`); await ready(page);
        await page.getByRole('button', { name: 'Copy example link' }).focus();
        let n = 0;
        for (const s of seq) { await page.keyboard.press(s.dir === 'fwd' ? 'Tab' : 'Shift+Tab'); await page.waitForTimeout(60); n++; if (s === w) break; }
        res[key].screenshotStep = { n, ...(await measure()) };
        await page.screenshot({ path: `${shots}/playground-focus-obscured.png` });
      }
      await ctx.close();
    }
  }
  log('stickyFocus', res);
}

// B. Target size / spacing for undersized targets (radio, checkbox) at 320 and in compact density
{
  const res = {};
  for (const [name, vp, st] of [['320', { width: 320, height: 640 }, {}], ['1280-compact', { width: 1280, height: 900 }, { 'system-lab:density': 'compact' }]]) {
    for (const p of ['/components/radio-group', '/components/checkbox', '/patterns/form-validation', '/foundations/products', '/components/button', '/playground?component=button', '/components/dialog', '/components/tabs']) {
      const { ctx, page } = await ctxPage(vp, st);
      await page.goto(base + p); await ready(page); await page.waitForTimeout(300);
      res[`${name} ${p}`] = await page.evaluate(() => {
        const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=tab]';
        const all = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && !(e.tagName === 'A' && s.display === 'inline'); });
        const rects = all.map((e) => ({ e, r: e.getBoundingClientRect() }));
        const small = rects.filter(({ r }) => r.width < 24 || r.height < 24);
        return small.slice(0, 20).map(({ e, r }) => {
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          // spacing exception: 24px circle around centre must not intersect another target or its circle
          let minDist = Infinity, near = null;
          for (const o of rects) { if (o.e === e || o.e.contains(e) || e.contains(o.e) || (e.labels && [...e.labels].includes(o.e))) continue; const dx = Math.max(o.r.left - cx, 0, cx - o.r.right), dy = Math.max(o.r.top - cy, 0, cy - o.r.bottom); const d = Math.hypot(dx, dy); if (d < minDist) { minDist = d; near = o.e; } }
          const label = e.labels?.[0]; const lr = label?.getBoundingClientRect();
          return { el: `${e.tagName.toLowerCase()}[${e.type ?? ''}] ${(e.labels?.[0]?.textContent ?? e.textContent ?? '').trim().slice(0, 25)}`, w: Math.round(r.width), h: Math.round(r.height), labelBox: lr ? [Math.round(lr.width), Math.round(lr.height)] : null, distToNearestTarget: Math.round(minDist), nearest: near ? `${near.tagName.toLowerCase()} ${(near.textContent ?? '').trim().slice(0, 20)}` : null, spacingOk: minDist >= 12 };
        });
      });
      await ctx.close();
    }
  }
  log('targets', res);
}

// C. Non-text and text contrast measured from computed colors in every product × theme
{
  const combos = [];
  for (const product of ['system-lab', 'harbor', 'meadow']) for (const theme of ['light', 'dark']) combos.push({ product, theme });
  const res = {};
  for (const c of combos) {
    const { ctx, page } = await ctxPage({ width: 1280, height: 900 }, { 'system-lab:theme': c.theme, 'system-lab:product': c.product });
    await page.goto(base + '/patterns/form-validation'); await ready(page);
    const productApplied = await page.evaluate(() => document.documentElement.dataset.product);
    res[`${c.product}-${c.theme}`] = await page.evaluate(() => {
      const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
      const bgOf = (e) => { while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.99) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255 }; };
      const input = document.querySelector('form input[type=text], form input:not([type])');
      const select = document.querySelector('form select');
      const cb = document.querySelector('form input[type=checkbox]');
      const canvas = parse(getComputedStyle(document.documentElement).backgroundColor);
      const focusRing = parse(getComputedStyle(document.documentElement).getPropertyValue('--focus-ring').trim().startsWith('#') ? 'rgb(0,0,0)' : 'rgb(0,0,0)');
      const tmp = document.createElement('div'); tmp.style.color = 'var(--focus-ring)'; document.body.append(tmp); const fr = parse(getComputedStyle(tmp).color);
      tmp.style.color = 'var(--text-muted)'; const muted = parse(getComputedStyle(tmp).color);
      tmp.style.color = 'var(--input-border)'; const ib = parse(getComputedStyle(tmp).color); tmp.remove();
      const errText = document.querySelector('[class*=error]');
      return {
        canvas: getComputedStyle(document.documentElement).backgroundColor,
        inputBorder: { color: getComputedStyle(input).borderTopColor, vsBg: ratio(parse(getComputedStyle(input).borderTopColor), bgOf(input.parentElement)), vsInputBg: ratio(parse(getComputedStyle(input).borderTopColor), bgOf(input)) },
        selectBorder: ratio(parse(getComputedStyle(select).borderTopColor), bgOf(select.parentElement)),
        checkboxBorder: { css: getComputedStyle(cb).borderTopColor, accent: getComputedStyle(cb).accentColor },
        focusRingVsCanvas: ratio(fr, canvas),
        mutedTextVsCanvas: ratio(muted, canvas),
        inputBorderToken: ratio(ib, canvas),
        _unused: !!focusRing && !!errText,
      };
    });
    res[`${c.product}-${c.theme}`].productApplied = productApplied;
    // switch off-state track vs canvas, tabs selected indicator, dialog close button
    await page.goto(base + '/components/switch'); await ready(page);
    res[`${c.product}-${c.theme}`].switchTrackOff = await page.evaluate(() => {
      const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
      const sw = document.querySelector('[role=switch]'); const t = sw.nextElementSibling; const s = getComputedStyle(t);
      const bgOf = (e) => { while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.99) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255 }; };
      const surround = bgOf(t.parentElement.parentElement);
      const thumb = getComputedStyle(t.firstElementChild);
      return { checked: sw.checked, trackBg: s.backgroundColor, border: s.borderTopColor + ' ' + s.borderTopWidth, trackBgVsSurround: ratio(parse(s.backgroundColor).a > 0 ? parse(s.backgroundColor) : surround, surround), borderVsSurround: ratio(parse(s.borderTopColor), surround), thumbVsTrack: ratio(parse(thumb.backgroundColor), parse(s.backgroundColor).a > 0 ? parse(s.backgroundColor) : surround) };
    });
    await ctx.close();
  }
  log('contrast', res);
}

// D. axe "incomplete" color-contrast details on representative pages, manual compute where possible
{
  const res = {};
  const { ctx, page } = await ctxPage();
  for (const p of ['/', '/components/button', '/components/badge', '/foundations/color', '/foundations/theme-studio', '/patterns/resource-directory', '/playground?component=badge', '/components/radio-group']) {
    await page.goto(base + p); await ready(page); await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    res[p] = r.incomplete.flatMap((x) => x.nodes.map((n) => ({ target: n.target.join(' '), why: (n.any[0]?.message ?? '').slice(0, 140), data: n.any[0]?.data ? { fg: n.any[0].data.fgColor, bg: n.any[0].data.bgColor, ratio: n.any[0].data.contrastRatio, reason: n.any[0].data.messageKey } : null })));
  }
  await ctx.close();
  log('axeIncomplete', res);
}

// E. Text spacing (1.4.12) and 320px truncation screenshots
{
  const SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;
  const res = {};
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/foundations/theme-studio'); await ready(page); await page.waitForTimeout(400);
  const strip = page.locator('[class*=stripMeta]').first();
  await strip.scrollIntoViewIfNeeded();
  const before = await strip.evaluate((e) => ({ text: e.textContent, sw: e.scrollWidth, cw: e.clientWidth, list: e.closest('ol,ul')?.getAttribute('aria-label') }));
  await page.screenshot({ path: `${shots}/theme-studio-ramp-before-spacing.png`, clip: await strip.evaluate((e) => { const r = e.closest('ol,ul').getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.min(1280 - r.x, r.width), height: Math.min(300, r.height) }; }) });
  await page.addStyleTag({ content: SPACING }); await page.waitForTimeout(300);
  const after = await page.locator('[class*=stripMeta]').evaluateAll((es) => es.map((e) => ({ text: e.textContent, sw: e.scrollWidth, cw: e.clientWidth, truncated: e.scrollWidth > e.clientWidth + 1 })));
  await page.screenshot({ path: `${shots}/theme-studio-ramp-after-spacing.png`, clip: await strip.evaluate((e) => { const r = e.closest('ol,ul').getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.min(1280 - r.x, r.width), height: Math.min(300, r.height) }; }) });
  // is the same value available elsewhere on the page (e.g., a table)?
  const elsewhere = await page.evaluate((t) => [...document.querySelectorAll('td,th,code,span')].filter((e) => !String(e.className).includes('stripMeta') && e.textContent.trim() === t.replace(/^C /, '')).length, after[0]?.text ?? '');
  const stripAria = await page.evaluate(() => { const li = document.querySelector('[class*=stripMeta]').closest('li'); return { liText: li.textContent, ariaLabel: li.getAttribute('aria-label'), hiddenParts: [...li.querySelectorAll('[aria-hidden=true]')].length }; });
  res.themeStudioStrip = { before, truncatedAfter: after.filter((a) => a.truncated).length, total: after.length, sample: after.slice(0, 4), valueElsewhereCount: elsewhere, stripAria };
  // spacing on other key pages at 320
  for (const p of ['/', '/components/button', '/playground?component=button', '/patterns/form-validation', '/components/tabs', '/components/dialog']) {
    const c2 = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const p2 = await c2.newPage();
    await p2.goto(base + p); await ready(p2); await p2.waitForTimeout(300);
    await p2.addStyleTag({ content: SPACING }); await p2.waitForTimeout(300);
    res[`spacing320 ${p}`] = await p2.evaluate(() => ({ pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, settingsSummary: (() => { const s = document.querySelector('[class*=settingsSummary]'); return s && { text: s.textContent, truncated: s.scrollWidth > s.clientWidth }; })() }));
    if (p === '/') await p2.screenshot({ path: `${shots}/home-320-text-spacing.png` });
    await c2.close();
  }
  await ctx.close();
  log('textSpacing', res);
}

// F. Focus after "Clear filters" removes itself (components index and directory demo) + next Tab
{
  const res = {};
  const { ctx, page } = await ctxPage();
  for (const [p, which] of [['/components?q=zzzz', 'summary'], ['/components?q=zzzz', 'empty'], ['/components?q=but', 'summary']]) {
    await page.goto(base + p); await ready(page); await page.waitForTimeout(300);
    const btns = page.getByRole('button', { name: 'Clear filters' });
    const count = await btns.count();
    const b = which === 'empty' ? btns.last() : btns.first();
    await b.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.activeElement === document.body ? 'body' : `${document.activeElement.tagName} ${document.activeElement.textContent.slice(0, 30)}`);
    await page.keyboard.press('Tab');
    const next = await page.evaluate(() => `${document.activeElement.tagName} ${(document.activeElement.textContent || document.activeElement.getAttribute('aria-label') || '').trim().slice(0, 30)}`);
    res[`${p} ${which}`] = { buttons: count, focusAfterActivate: after, nextTab: next, status: await page.locator('[role=search] [role=status]').innerText() };
  }
  // directory demo no-results scenario
  await page.goto(base + '/patterns/resource-directory'); await ready(page);
  await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('noResults');
  await page.waitForSelector('text=No entries match', { timeout: 10000 });
  const emptyBtn = page.getByRole('button', { name: 'Clear filters' }).last();
  await emptyBtn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const a2 = await page.evaluate(() => document.activeElement === document.body ? 'body' : document.activeElement.tagName);
  await page.keyboard.press('Tab');
  res.directoryNoResults = { focusAfterActivate: a2, nextTab: await page.evaluate(() => `${document.activeElement.tagName} ${(document.activeElement.textContent || '').trim().slice(0, 30)}`) };
  await ctx.close();
  log('clearFilters', res);
}

// G. Form checkbox: required state, error association, visible required indicator
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/patterns/form-validation'); await ready(page);
  const cb = page.locator('form input[type=checkbox]');
  const before = await cb.evaluate((c) => ({ label: c.labels[0]?.textContent, required: c.required, ariaRequired: c.getAttribute('aria-required'), describedby: c.getAttribute('aria-describedby') }));
  const otherLabels = await page.locator('form label').allInnerTexts();
  await page.getByRole('button', { name: 'Submit proposal' }).click(); await page.waitForTimeout(300);
  const after = await cb.evaluate((c) => ({ invalid: c.getAttribute('aria-invalid'), desc: (c.getAttribute('aria-describedby') ?? '').split(' ').map((i) => document.getElementById(i)?.textContent).join('|') }));
  await cb.scrollIntoViewIfNeeded();
  await cb.locator('xpath=ancestor::div[2]').screenshot({ path: `${shots}/form-checkbox-error.png` }).catch((e) => console.error('shot failed', e.message));
  await page.locator('form').screenshot({ path: `${shots}/form-errors-full.png` });
  log('formCheckbox', { before, otherLabels, after });
  await ctx.close();
}

// H. Duplicate region names (landmark-unique) as exposed in the accessibility tree
{
  const res = {};
  const { ctx, page } = await ctxPage();
  for (const p of ['/playground?component=button', '/components/scroll-region']) {
    await page.goto(base + p); await ready(page); await page.waitForTimeout(300);
    const snap = await page.locator('main').ariaSnapshot();
    res[p] = snap.split('\n').filter((l) => /region|- (navigation|search|form)/.test(l)).map((l) => l.trim());
  }
  await ctx.close();
  log('regions', res);
}

// I. Products foundation heading order in context
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/foundations/products'); await ready(page);
  const hs = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map((h) => `${h.tagName} ${h.textContent.trim().slice(0, 40)}`));
  log('productsHeadings', hs.slice(0, 30));
  await ctx.close();
}

// J. Radio-group disabled option description contrast in rendered UI, every product/theme
{
  const res = {};
  for (const product of ['system-lab', 'harbor', 'meadow']) for (const theme of ['light', 'dark']) {
    const { ctx, page } = await ctxPage({ width: 1280, height: 900 }, { 'system-lab:theme': theme, 'system-lab:product': product });
    await page.goto(base + '/components/radio-group'); await ready(page);
    const el = page.locator('[id$="-evening-description"]').first();
    await el.scrollIntoViewIfNeeded();
    res[`${product}-${theme}`] = (await new AxeBuilder({ page }).include('[id$="-evening-description"]').withRules(['color-contrast']).analyze()).violations.map((v) => v.nodes.map((n) => n.any[0]?.data?.contrastRatio)).flat();
    res[`${product}-${theme}-label`] = await page.evaluate(() => { const d = document.querySelector('[id$="-evening-description"]'); const o = d.closest('div'); return { text: d.textContent, opacity: getComputedStyle(o).opacity, radioDisabled: o.querySelector('input').disabled, labelText: o.querySelector('label').textContent }; });
    if (product === 'system-lab' && theme === 'light') await page.screenshot({ path: `${shots}/radio-group-disabled-description.png`, clip: await el.evaluate((e) => { const r = e.closest('fieldset').getBoundingClientRect(); return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 }; }) });
    await ctx.close();
  }
  log('radioDisabled', res);
}

console.log(JSON.stringify(out, null, 1));
await browser.close();
