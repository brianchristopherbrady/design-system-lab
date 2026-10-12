// Manual-equivalent keyboard/focus/state probes driven by real Playwright keyboard input in Edge.
// Usage (repo root): node docs/accessibility/evidence/scripts/interactions.mjs > docs/accessibility/evidence/interactions.json
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5173';
const shots = 'docs/accessibility/evidence/screenshots';
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const out = { base, date: new Date().toISOString(), browser: browser.version(), checks: {} };
const log = (k, v) => { out.checks[k] = v; console.error(k, JSON.stringify(v).slice(0, 300)); };

const describe = () => {
  const e = document.activeElement;
  if (!e || e === document.body) return { el: 'body' };
  const s = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  const name = e.getAttribute('aria-label') || (e.labels && e.labels[0]?.textContent) || e.textContent || '';
  return {
    el: `${e.tagName.toLowerCase()}${e.id ? '#' + e.id.slice(0, 20) : ''}${e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : ''}`,
    name: name.trim().replace(/\s+/g, ' ').slice(0, 60),
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} off ${s.outlineOffset}`,
    focusVisible: e.matches(':focus-visible'),
    box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
  };
};

async function ctxPage(opts = {}, storage = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  await ctx.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, storage);
  const page = await ctx.newPage();
  return { ctx, page };
}
const ready = (page) => page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});

// 1. Forward and reverse tab order on the shell + docs page, with focus outline evidence
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/components/button'); await ready(page);
  const fwd = [];
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); fwd.push(await page.evaluate(describe)); }
  const rev = [];
  await page.goto(base + '/components/button'); await ready(page);
  await page.evaluate(() => { document.querySelector('footer a:last-of-type')?.focus(); });
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Shift+Tab'); rev.push(await page.evaluate(describe)); }
  log('tabOrder.componentsButton.forward', fwd);
  log('tabOrder.componentsButton.reverseFromFooter', rev);
  log('focus.noOutline', fwd.concat(rev).filter((f) => f.el !== 'body' && f.outline.startsWith('none')));
  await page.goto(base + '/components/button'); await ready(page);
  await page.keyboard.press('Tab');
  await page.screenshot({ path: `${shots}/skip-link-focus.png`, clip: { x: 0, y: 0, width: 1280, height: 200 } });
  await page.keyboard.press('Tab');
  await page.screenshot({ path: `${shots}/brand-link-focus.png`, clip: { x: 0, y: 0, width: 1280, height: 200 } });
  await ctx.close();
}

// 2. Focus after route change (link click by keyboard), title, query change
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/'); await ready(page);
  const nav = page.getByRole('navigation', { name: 'Sections' });
  await nav.getByRole('link', { name: 'Patterns' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/patterns'); await page.waitForTimeout(500);
  const afterNav = await page.evaluate(describe);
  const title = await page.title();
  await page.goBack(); await page.waitForTimeout(500);
  const afterBack = await page.evaluate(describe);
  const titleBack = await page.title();
  // sidebar link navigation
  await page.goto(base + '/components/button'); await ready(page);
  await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Tabs' }).focus();
  await page.keyboard.press('Enter'); await page.waitForURL('**/components/tabs'); await page.waitForTimeout(500);
  const afterSidebar = await page.evaluate(describe);
  // 404
  await page.goto(base + '/does-not-exist'); await ready(page);
  const notFound = { title: await page.title(), h1: await page.locator('h1').innerText() };
  log('routeFocus', { afterNav, title, afterBack, titleBack, afterSidebar, notFound });
  await ctx.close();
}

// 3. Dialogs: open, initial focus, Tab wrap both ways, Escape, return focus, in-dialog error
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/components/dialog'); await ready(page);
  const res = {};
  const opener = page.getByRole('button', { name: 'Show keyboard shortcuts' });
  await opener.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  res.openInitial = await page.evaluate(describe);
  res.dialogAttrs = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); return { modal: d?.matches(':modal'), labelledby: d && document.getElementById(d.getAttribute('aria-labelledby'))?.textContent, describedby: d && document.getElementById(d.getAttribute('aria-describedby') ?? '')?.textContent }; });
  const seq = [];
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(() => ({ ...((() => { const e = document.activeElement; return { t: e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label'), inDialog: !!e.closest('dialog') }; })()) }))); }
  res.tabSeq = seq;
  const rseq = [];
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); rseq.push(await page.evaluate(() => { const e = document.activeElement; return { t: e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label'), inDialog: !!e.closest('dialog') }; })); }
  res.shiftTabSeq = rseq;
  await page.screenshot({ path: `${shots}/dialog-open.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  res.afterEscape = { open: await page.locator('dialog[open]').count(), focus: await page.evaluate(describe) };
  // confirm dialog
  await page.getByRole('button', { name: 'Archive Button entry' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  res.confirmInitial = await page.evaluate(describe);
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  res.confirmAfter = { focus: await page.evaluate(describe), status: await page.getByText('Button entry archived.').count() };
  // failing dialog
  await page.getByRole('button', { name: 'Delete the legacy token set' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  res.failInitial = await page.evaluate(describe);
  const del = page.locator('dialog[open]').getByRole('button', { name: 'Delete' });
  await del.focus(); await page.keyboard.press('Enter');
  await page.waitForSelector('dialog[open] [role=alert]', { timeout: 10000 }).catch(() => {});
  res.failError = { alert: await page.locator('dialog[open] [role=alert]').innerText().catch(() => null), focus: await page.evaluate(describe) };
  await page.screenshot({ path: `${shots}/dialog-error.png` });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);
  res.failRecovered = { focus: await page.evaluate(describe), status: await page.getByText('Legacy token set deleted.').count() };
  // dialog at 320 / 400% zoom: reachable controls
  await page.setViewportSize({ width: 320, height: 256 });
  await page.getByRole('button', { name: 'Show keyboard shortcuts' }).click(); await page.waitForTimeout(400);
  res.dialog320 = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); const r = d.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), scrollH: d.scrollHeight, clientH: d.clientHeight, overflowY: getComputedStyle(d).overflowY, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  await page.screenshot({ path: `${shots}/dialog-320x256.png` });
  log('dialog', res);
  await ctx.close();
}

// 4. Tabs arrow keys
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/components/tabs'); await ready(page);
  const r = [];
  await page.getByRole('tab', { name: 'Usage' }).focus();
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'Home', 'End']) {
    await page.keyboard.press(k);
    r.push({ key: k, ...(await page.evaluate(() => { const e = document.activeElement; return { focus: e.textContent, selected: e.getAttribute('aria-selected'), tabindex: e.tabIndex, outline: getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth }; })) });
  }
  await page.keyboard.press('Tab');
  r.push({ key: 'Tab', ...(await page.evaluate(() => ({ focus: document.activeElement.getAttribute('role'), name: document.getElementById(document.activeElement.getAttribute('aria-labelledby'))?.textContent }))) });
  await page.keyboard.press('Shift+Tab');
  r.push({ key: 'Shift+Tab', focus: await page.evaluate(() => document.activeElement.textContent) });
  log('tabs', r);
  await ctx.close();
}

// 5. Switch (component page and playground)
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/components/switch'); await ready(page);
  const sw = page.getByRole('switch').first();
  await sw.focus();
  const before = await page.evaluate(() => { const e = document.activeElement; return { checked: e.checked, name: e.labels[0]?.textContent, desc: e.getAttribute('aria-describedby') && document.getElementById(e.getAttribute('aria-describedby'))?.textContent, track: (() => { const t = e.nextElementSibling; const s = getComputedStyle(t); return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`; })(), inputOutline: getComputedStyle(e).outlineStyle }; });
  await page.keyboard.press('Space');
  const afterSpace = await page.evaluate(() => document.activeElement.checked);
  await page.keyboard.press('Enter');
  const afterEnter = await page.evaluate(() => document.activeElement.checked);
  const box = await page.evaluate(() => { const e = document.activeElement; const t = e.parentElement.getBoundingClientRect(); return [Math.round(t.width), Math.round(t.height)]; });
  await page.screenshot({ path: `${shots}/switch-focus.png`, clip: await sw.evaluate((e) => { const r = e.closest('div').getBoundingClientRect(); return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(600, r.width + 20), height: r.height + 20 }; }) });
  log('switch', { before, afterSpace, afterEnter, controlBox: box, total: await page.getByRole('switch').count() });
  await ctx.close();
}

// 6. Form validation: error summary
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/patterns/form-validation'); await ready(page);
  await page.getByRole('button', { name: 'Submit proposal' }).focus();
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const r = { afterSubmit: await page.evaluate(describe) };
  r.summaryRole = await page.evaluate(() => { const e = document.activeElement; return { role: e.getAttribute('role'), innerRole: e.querySelector('[role]')?.getAttribute('role'), text: e.textContent.slice(0, 120) }; });
  await page.keyboard.press('Tab');
  r.firstLink = await page.evaluate(describe);
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  r.afterLink = await page.evaluate(() => { const e = document.activeElement; return { el: e.tagName, invalid: e.getAttribute('aria-invalid'), describedby: (e.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent).join(' | '), required: e.required, labelText: e.labels?.[0]?.textContent }; });
  // checkbox error
  r.checkbox = await page.evaluate(() => { const c = document.querySelector('input[type=checkbox]'); return { invalid: c.getAttribute('aria-invalid'), desc: document.getElementById(c.getAttribute('aria-describedby') ?? '')?.textContent, required: c.required }; });
  // fix fields and resubmit
  await page.getByRole('textbox', { name: /Component name/ }).fill('DatePicker');
  await page.getByRole('combobox', { name: /Component layer/ }).selectOption({ index: 1 });
  await page.getByRole('textbox', { name: /Summary/ }).fill('Choose a calendar date from a grid of days.');
  await page.getByRole('textbox', { name: /Contact email/ }).fill('team@example.com');
  await page.getByRole('checkbox').check();
  r.summaryAfterFix = await page.locator('text=to continue').count();
  await page.getByRole('button', { name: 'Submit proposal' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  r.success = { status: await page.locator('[role=status]').allInnerTexts(), focus: await page.evaluate(describe) };
  await page.screenshot({ path: `${shots}/form-after-success.png`, fullPage: false });
  // required indication programmatic
  r.requiredMarks = await page.evaluate(() => [...document.querySelectorAll('form input, form select')].map((e) => `${e.type}:${e.required}`));
  log('form', r);
  await ctx.close();
}

// 7. Directory filters: status updates for counts (Components index and directory demo)
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/components'); await ready(page);
  await page.evaluate(() => {
    window.__mut = [];
    const obs = new MutationObserver((ms) => { for (const m of ms) { const live = m.target.nodeType === 1 ? m.target.closest('[role=status],[aria-live],[role=alert]') : m.target.parentElement?.closest('[role=status],[aria-live],[role=alert]'); if (live) window.__mut.push(live.textContent); } });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.focus();
  await page.keyboard.type('but', { delay: 80 });
  await page.waitForTimeout(400);
  const r = { componentsIndex: { liveTexts: await page.evaluate(() => window.__mut), url: page.url(), focus: await page.evaluate(describe) } };
  await page.keyboard.type('zzzz'); await page.waitForTimeout(300);
  r.componentsIndex.none = { live: await page.evaluate(() => window.__mut.slice(-2)), empty: await page.locator('main h2, main h3').allInnerTexts() };
  // clear filters button focus
  const clear = page.getByRole('button', { name: 'Clear filters' }).first();
  if (await clear.count()) { await clear.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); r.componentsIndex.afterClear = await page.evaluate(describe); }
  // directory demo
  await page.goto(base + '/patterns/resource-directory'); await ready(page);
  await page.waitForSelector('text=Showing', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => {
    window.__mut = [];
    const obs = new MutationObserver((ms) => { for (const m of ms) { const t = m.target.nodeType === 1 ? m.target : m.target.parentElement; const live = t.closest('[role=status],[aria-live],[role=alert]'); if (live) window.__mut.push(live.textContent); for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches('[role=status],[role=alert]')) window.__mut.push('ADDED:' + n.getAttribute('role') + ':' + n.textContent.slice(0, 80)); } });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.getByRole('combobox', { name: 'Resource type' }).selectOption('component'); await page.waitForTimeout(300);
  r.directory = { afterType: await page.evaluate(() => window.__mut.slice()) };
  const more = page.getByRole('button', { name: /Show \d+ more/ });
  if (await more.count()) { await more.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); r.directory.afterShowMore = { focus: await page.evaluate(describe), live: await page.evaluate(() => window.__mut.slice(-2)) }; }
  // pin toggle
  const pin = page.getByRole('button', { name: /Pin/ }).first();
  if (await pin.count()) { const nm = await pin.getAttribute('aria-label') ?? await pin.innerText(); await pin.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200); r.directory.pin = { before: nm, after: await page.evaluate(() => ({ name: document.activeElement.getAttribute('aria-label') ?? document.activeElement.textContent, pressed: document.activeElement.getAttribute('aria-pressed') })) }; }
  log('filters', r);
  await ctx.close();
}

// 8. Scenario states: loading/empty/error/retry announcements
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + '/patterns/resource-directory'); await ready(page);
  await page.evaluate(() => {
    window.__mut = [];
    const obs = new MutationObserver((ms) => { for (const m of ms) { for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; const lives = [n.matches('[role=status],[role=alert],[aria-live]') ? n : null, ...n.querySelectorAll('[role=status],[role=alert],[aria-live]')].filter(Boolean); for (const l of lives) window.__mut.push(`ADDED ${l.getAttribute('role') ?? 'live'}: ${l.textContent.trim().slice(0, 80)}`); } const t = m.target.nodeType === 1 ? m.target : m.target.parentElement; const live = t?.closest('[role=status],[aria-live],[role=alert]'); if (live && m.type !== 'childList') window.__mut.push('TEXT ' + live.textContent.slice(0, 80)); else if (live && m.addedNodes.length) window.__mut.push('CHANGED ' + live.textContent.slice(0, 80)); } });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  const sel = page.getByRole('combobox', { name: 'Demo scenario' });
  const options = await sel.evaluate((s) => [...s.options].map((o) => o.value));
  const r = { options, states: {} };
  for (const v of options) {
    await page.evaluate(() => { window.__mut = []; });
    await sel.selectOption(v); await page.waitForTimeout(2500);
    r.states[v] = { live: await page.evaluate(() => window.__mut.slice()), busy: await page.locator('section[aria-busy]').first().getAttribute('aria-busy'), focus: await page.evaluate(describe) };
  }
  // retry path
  await sel.selectOption('error'); await page.waitForSelector('text=Entries could not be loaded', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => { window.__mut = []; });
  const retry = page.getByRole('button', { name: 'Retry' });
  await retry.focus(); await page.keyboard.press('Enter');
  r.retry = { focusImmediately: await page.evaluate(describe) };
  await page.waitForTimeout(3000);
  r.retry.after = { focus: await page.evaluate(describe), live: await page.evaluate(() => window.__mut.slice()) };
  await page.screenshot({ path: `${shots}/scenario-after-retry.png` });
  // Reset demo button
  await page.getByRole('button', { name: 'Reset demo' }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  r.reset = { focus: await page.evaluate(describe) };
  // other scenario demos on other pattern pages
  r.otherPages = {};
  for (const p of ['/patterns/resource-detail', '/patterns/activity-dashboard']) {
    await page.goto(base + p); await ready(page);
    const s2 = page.getByRole('combobox', { name: 'Demo scenario' });
    if (!(await s2.count())) { r.otherPages[p] = 'no scenario select'; continue; }
    const opts = await s2.evaluate((s) => [...s.options].map((o) => o.value));
    r.otherPages[p] = { opts, states: {} };
    await page.evaluate(() => {
      window.__mut = [];
      const obs = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; const lives = [n.matches('[role=status],[role=alert],[aria-live]') ? n : null, ...n.querySelectorAll('[role=status],[role=alert],[aria-live]')].filter(Boolean); for (const l of lives) window.__mut.push(`ADDED ${l.getAttribute('role') ?? 'live'}: ${l.textContent.trim().slice(0, 80)}`); } });
      obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    for (const v of opts) {
      await page.evaluate(() => { window.__mut = []; });
      await s2.selectOption(v); await page.waitForTimeout(2500);
      const retryBtn = page.getByRole('button', { name: /Retry|Try again/ });
      const st = { live: await page.evaluate(() => window.__mut.slice()) };
      if (await retryBtn.count()) {
        await retryBtn.first().focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
        st.afterRetry = { focus: await page.evaluate(describe), live: await page.evaluate(() => window.__mut.slice(-3)) };
      }
      r.otherPages[p].states[v] = st;
    }
  }
  log('scenarios', r);
  await ctx.close();
}

// 9. Playground: edit props via Controls table, share & resume
{
  const { ctx, page } = await ctxPage({ permissions: ['clipboard-read', 'clipboard-write'] });
  await page.goto(base + '/playground?component=button'); await ready(page);
  await page.waitForSelector('text=Component props');
  const r = {};
  r.table = await page.evaluate(() => { const t = document.querySelector('table[aria-labelledby]'); return { name: document.getElementById(t.getAttribute('aria-labelledby'))?.textContent, rows: t.querySelectorAll('tbody tr').length, controls: [...t.querySelectorAll('input,select')].slice(0, 12).map((c) => { const lb = (c.getAttribute('aria-labelledby') ?? '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' '); const grp = c.closest('[role=radiogroup]'); return `${c.tagName.toLowerCase()}${c.type ? ':' + c.type : ''} name="${lb || (grp && document.getElementById(grp.getAttribute('aria-labelledby'))?.textContent) || ''}${c.type === 'radio' ? ' ' + c.value : ''}"`; }) }; });
  // keyboard edit: tab to first select in table and change via keyboard
  const firstSelect = page.locator('table[aria-labelledby] select').first();
  await firstSelect.focus();
  const before = await page.getByTestId('playground-snippet').innerText();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  const afterSel = await page.getByTestId('playground-snippet').innerText();
  r.selectEdit = { changed: before !== afterSel, focus: await page.evaluate(describe), url: page.url() };
  // text control
  const txt = page.locator('table[aria-labelledby] input[type=text], table[aria-labelledby] input:not([type])').first();
  if (await txt.count()) { await txt.focus(); await page.keyboard.press('Control+A'); await page.keyboard.type('Save draft'); await page.waitForTimeout(300); r.textEdit = { snippetHas: (await page.getByTestId('playground-snippet').innerText()).includes('Save draft'), focus: await page.evaluate(describe) }; }
  // radio boolean
  const radio = page.locator('table[aria-labelledby] input[type=radio]').first();
  if (await radio.count()) {
    await radio.focus(); const b = await page.evaluate(describe);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
    r.radioEdit = { before: b, after: await page.evaluate(() => { const e = document.activeElement; const opt = e.closest('label'); const s = getComputedStyle(opt); return { value: e.value, checked: e.checked, labelOutline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` }; }) };
    await page.screenshot({ path: `${shots}/playground-radio-focus.png`, clip: await radio.evaluate((e) => { const r = e.closest('tr').getBoundingClientRect(); return { x: r.x, y: Math.max(0, r.y - 5), width: r.width, height: r.height + 10 }; }) });
  }
  // focus obscured by sticky preview: tab through controls and check intersection with sticky panel
  const obscured = [];
  await page.locator('table[aria-labelledby] select, table[aria-labelledby] input').first().focus();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(i < 15 ? 'Tab' : 'Shift+Tab');
    await page.waitForTimeout(80);
    obscured.push(await page.evaluate(() => {
      const e = document.activeElement; const r = e.getBoundingClientRect();
      const panel = document.querySelector('[data-testid=preview-panel]'); const p = panel.getBoundingClientRect();
      const sticky = getComputedStyle(panel).position === 'sticky';
      const hidden = sticky && !panel.contains(e) && r.top < p.bottom && r.bottom > p.top;
      const fully = hidden && r.top >= p.top && r.bottom <= p.bottom;
      return { t: (e.getAttribute('aria-label') || e.textContent || e.value || '').trim().slice(0, 25), top: Math.round(r.top), panelBottom: Math.round(p.bottom), sticky, overlap: hidden, fullyHidden: fully };
    }));
  }
  r.stickyFocusCheck = obscured.filter((o) => o.overlap);
  r.stickyPanelSticky = obscured[0]?.sticky;
  // share
  const copy = page.getByRole('button', { name: 'Copy example link' });
  await copy.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  r.share = { status: await page.locator('[data-testid=preview-panel] [role=status]').innerText(), focus: await page.evaluate(describe) };
  const link = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => 'clipboard read failed ' + e.message);
  r.share.link = link;
  // resume in fresh context
  if (link.startsWith('http')) {
    const { ctx: c2, page: p2 } = await ctxPage();
    await p2.goto(link); await ready(p2);
    await p2.waitForSelector('[data-testid=playground-snippet]');
    r.resume = { snippetHas: (await p2.getByTestId('playground-snippet').innerText()).includes('Save draft'), title: await p2.title(), focus: await p2.evaluate(describe) };
    await c2.close();
  }
  // copy fail path (no clipboard)
  const { ctx: c3, page: p3 } = await ctxPage();
  await c3.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); });
  await p3.goto(base + '/playground?component=button'); await ready(p3);
  await p3.getByRole('button', { name: 'Copy example link' }).focus(); await p3.keyboard.press('Enter'); await p3.waitForTimeout(400);
  r.shareFail = { status: await p3.locator('[data-testid=preview-panel] [role=status]').innerText(), focus: await p3.evaluate(describe) };
  await c3.close();
  // component select changes: query change focus
  await page.getByRole('combobox', { name: 'Component' }).focus();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(500);
  r.componentSwitch = { url: page.url(), focus: await page.evaluate(describe), title: await page.title() };
  // Range
  r.range = await page.evaluate(() => { const e = document.querySelector('input[type=range]'); return e && { name: e.labels?.[0]?.textContent, valuetext: e.getAttribute('aria-valuetext') }; });
  // width presets pressed buttons
  r.presets = await page.locator('[role=group][aria-label="Preview width presets"] button').evaluateAll((bs) => bs.map((b) => `${b.textContent}:${b.getAttribute('aria-pressed')}`));
  log('playground', r);
  await ctx.close();
}

// 10. Shell display settings selects: names, persistence, small-screen disclosure
{
  const { ctx, page } = await ctxPage({ viewport: { width: 375, height: 700 } });
  await page.goto(base + '/'); await ready(page);
  const toggle = page.locator('button[aria-controls]').first();
  const r = { toggleName: await toggle.innerText(), expanded: await toggle.getAttribute('aria-expanded') };
  await toggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  r.afterOpen = { expanded: await toggle.getAttribute('aria-expanded'), selectsVisible: await page.getByRole('combobox', { name: 'Theme' }).isVisible() };
  await page.keyboard.press('Tab');
  r.nextFocus = await page.evaluate(describe);
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await page.getByRole('combobox', { name: 'Product' }).selectOption('harbor');
  await page.getByRole('combobox', { name: 'Density' }).selectOption('compact');
  r.storage = await page.evaluate(() => ({ t: localStorage.getItem('system-lab:theme'), p: localStorage.getItem('system-lab:product'), d: localStorage.getItem('system-lab:density') }));
  await page.reload(); await ready(page);
  r.afterReload = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, product: document.documentElement.dataset.product, density: document.documentElement.dataset.density }));
  // Section nav toggle at narrow width
  await page.goto(base + '/components/button'); await ready(page);
  const navToggle = page.getByRole('button', { name: /Show components/ });
  r.sectionToggle = { visible: await navToggle.isVisible(), expanded: await navToggle.getAttribute('aria-expanded') };
  await navToggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  r.sectionToggle.after = { name: await page.evaluate(() => document.activeElement.textContent), expanded: await page.evaluate(() => document.activeElement.getAttribute('aria-expanded')) };
  await page.keyboard.press('Tab'); r.sectionToggle.next = await page.evaluate(describe);
  log('shellSettings', r);
  await ctx.close();
}

// 11. Forced colors + reduced motion
{
  const { ctx, page } = await ctxPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  const r = {};
  for (const p of ['/components/switch', '/components/tabs', '/components/button', '/playground?component=button', '/patterns/resource-directory', '/components/progress', '/components/badge']) {
    await page.goto(base + p); await ready(page); await page.waitForTimeout(500);
    const name = p.replace(/[\/?=]/g, '_');
    await page.screenshot({ path: `${shots}/forced-colors${name}.png`, fullPage: false });
    r[p] = await page.evaluate(() => {
      const trans = [...document.querySelectorAll('*')].map((e) => getComputedStyle(e)).filter((s) => parseFloat(s.transitionDuration) > 0.001 || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.001)).length;
      return { forced: matchMedia('(forced-colors: active)').matches, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, longMotionElements: trans };
    });
  }
  // switch focus/checked visible in forced colors
  await page.goto(base + '/components/switch'); await ready(page);
  const sw = page.getByRole('switch').first(); await sw.focus(); await page.keyboard.press('Space');
  r.switchForced = await sw.evaluate((e) => { const t = e.nextElementSibling; const th = t.firstElementChild; const s = getComputedStyle(t); const h = getComputedStyle(th); return { trackBorder: `${s.borderStyle} ${s.borderWidth} ${s.borderColor}`, trackBg: s.backgroundColor, thumbBg: h.backgroundColor, outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` }; });
  await page.screenshot({ path: `${shots}/forced-colors-switch-focused-on.png`, clip: await sw.evaluate((e) => { const r = e.closest('div').getBoundingClientRect(); return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(600, r.width + 20), height: r.height + 20 }; }) });
  // playground boolean radios in forced colors
  await page.goto(base + '/playground?component=button'); await ready(page);
  const rad = page.locator('table[aria-labelledby] input[type=radio]').first();
  if (await rad.count()) {
    await rad.focus();
    r.radioForced = await rad.evaluate((e) => { const l = e.closest('label'); const s = getComputedStyle(l); return { outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, border: `${s.borderStyle} ${s.borderColor}`, bg: s.backgroundColor }; });
    await page.screenshot({ path: `${shots}/forced-colors-playground-radio.png`, clip: await rad.evaluate((e) => { const r = e.closest('tr').getBoundingClientRect(); return { x: r.x, y: Math.max(0, r.y - 5), width: r.width, height: r.height + 10 }; }) });
  }
  log('forcedColorsReducedMotion', r);
  await ctx.close();
}

console.log(JSON.stringify(out, null, 1));
await browser.close();
