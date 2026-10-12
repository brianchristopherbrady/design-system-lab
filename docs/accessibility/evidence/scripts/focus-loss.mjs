// Focus during the async gap after Retry, and after Clear filters, with the next Tab / Shift+Tab destination.
// Usage (repo root): node docs/accessibility/evidence/scripts/focus-loss.mjs > docs/accessibility/evidence/focus-loss.json
import { chromium } from 'playwright';
const base = 'http://localhost:5173';
const b = await chromium.launch({ channel: 'msedge' });
const out = { date: new Date().toISOString(), browser: b.version(), retry: {}, clear: {} };
const where = (p) => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY'; const nav = e.closest('nav'); return `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)}"${nav ? ` in nav[${nav.getAttribute('aria-label')}]` : e.closest('main') ? ' in main' : ''}`; });
for (const url of ['/patterns/resource-directory', '/patterns/activity-dashboard', '/patterns/resource-detail']) {
  const r = {};
  for (const key of ['Tab', 'Shift+Tab']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + url); await p.waitForSelector('main h1');
    await p.getByRole('combobox', { name: 'Demo scenario' }).selectOption('error');
    await p.getByRole('button', { name: 'Retry' }).waitFor({ timeout: 10000 });
    await p.getByRole('button', { name: 'Retry' }).focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(150);
    const during = await where(p);
    await p.keyboard.press(key);
    r[key] = { focusDuringLoading: during, afterKeyDuringLoading: await where(p) };
    await p.close();
  }
  out.retry[url] = r;
}
for (const [url, idx] of [['/components?q=zzzz', 'first'], ['/components?q=zzzz', 'last']]) {
  for (const key of ['Tab', 'Shift+Tab']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(base + url); await p.waitForSelector('main h1'); await p.waitForTimeout(300);
    const btn = idx === 'first' ? p.getByRole('button', { name: 'Clear filters' }).first() : p.getByRole('button', { name: 'Clear filters' }).last();
    await btn.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const after = await where(p);
    await p.keyboard.press(key);
    out.clear[`${url} ${idx} ${key}`] = { focusAfterActivate: after, nextFocus: await where(p) };
    await p.close();
  }
}
console.log(JSON.stringify(out, null, 1));
await b.close();
