import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
const out = {};
for (const [url, label] of [['/patterns/resource-directory','System directory'],['/patterns/activity-dashboard','System activity']]) {
  await p.goto('http://localhost:5173' + url); await p.waitForSelector('main h1');
  await p.getByRole('combobox', { name: 'Demo scenario' }).selectOption('empty');
  await p.waitForTimeout(2500);
  out[url] = await p.evaluate((label) => { const h = [...document.querySelectorAll('h3')].find((x) => x.textContent.includes(label)); const s = h.closest('section'); return { ariaBusy: s.getAttribute('aria-busy'), liveInSection: [...s.querySelectorAll('[role=status],[role=alert],[aria-live]')].map((e) => e.getAttribute('role') + ':' + e.textContent), emptyHeading: s.querySelector('h4')?.textContent, emptyAncestorsLive: !!s.querySelector('h4')?.closest('[role=status],[aria-live]') }; }, label);
  out[url].snapshot = await p.locator('section[aria-busy]').first().ariaSnapshot();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
