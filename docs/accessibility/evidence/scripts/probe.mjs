import { chromium } from 'playwright';
const t=Date.now();
const b = await chromium.launch({ channel: 'msedge' });
console.log('launched', Date.now()-t);
const p = await b.newPage();
await p.goto('http://localhost:5173/components', { waitUntil: 'load' });
console.log('loaded', Date.now()-t, await p.title());
await b.close();
