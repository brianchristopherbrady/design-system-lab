import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext()).newPage();
await p.goto('http://localhost:5173/'); await p.waitForSelector('main h1'); await p.waitForTimeout(400);
const r = await new AxeBuilder({ page: p }).withRules(['th-has-data-cells']).analyze();
const n = r.incomplete.flatMap((x) => x.nodes.map((n) => ({ target: n.target.join(' '), msg: n.any.concat(n.all, n.none).map((c) => c.message).join(' | ') })));
const t = await p.locator(n[0]?.target ?? 'table').first().evaluate((e) => { const tb = e.closest('table'); return { caption: tb.caption?.textContent, outer: tb.outerHTML.replace(/class="[^"]*"/g, '').slice(0, 900) }; });
console.log(JSON.stringify({ n, t }, null, 1));
await b.close();

