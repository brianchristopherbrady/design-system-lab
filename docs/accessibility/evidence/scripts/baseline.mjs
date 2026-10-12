// Structural + responsive baseline across every discovered route.
// Collects: title, lang, h1 count, heading outline, landmarks, skip link, horizontal overflow at
// 320/640(200%)/1280 viewports, overflow/clipping under WCAG 1.4.12 text spacing, targets < 24px.
// Usage (repo root): node docs/accessibility/evidence/scripts/baseline.mjs > docs/accessibility/evidence/baseline.json
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge' });

async function discover() {
  const page = await browser.newPage();
  const set = new Set(['/', '/foundations', '/components', '/playground', '/patterns', '/decisions', '/no-such-page']);
  for (const s of ['/foundations', '/components', '/patterns', '/decisions']) {
    await page.goto(base + s); await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});
    for (const h of await page.$$eval('nav a[href]', (as) => as.map((a) => a.getAttribute('href')))) {
      if (h && h.startsWith('/') && !h.includes('#')) set.add(h);
    }
  }
  await page.close();
  return [...set];
}

const SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;

async function structure(page) {
  return page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(vis).map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 60)}`);
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map((h) => +h.tagName[1]);
    const skips = []; for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips.push(`${levels[i - 1]}->${levels[i]} at #${i}`);
    const lm = [...document.querySelectorAll('header,nav,main,footer,aside,[role=banner],[role=navigation],[role=main],[role=contentinfo],[role=search],[role=region],section[aria-label],section[aria-labelledby],form[aria-label]')]
      .map((e) => `${e.getAttribute('role') ?? e.tagName.toLowerCase()}${e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : ''}`);
    return { title: document.title, lang: document.documentElement.lang, h1: levels.filter((l) => l === 1).length, headingSkips: skips, headings: headings.slice(0, 40), landmarks: lm, skipLink: document.querySelector('a[href="#main"]')?.textContent };
  });
}

async function overflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const pageOverflow = doc.scrollWidth - doc.clientWidth;
    const offenders = [];
    for (const e of document.querySelectorAll('main *, header *')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > doc.clientWidth + 1) {
        // ignore content inside an intentional scroll container
        let p = e.parentElement, scroller = false;
        while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) || p.tagName === 'PRE') { scroller = true; break; } p = p.parentElement; }
        if (!scroller) offenders.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} right=${Math.round(r.right)}`);
      }
    }
    // clipped text: element whose scroll size exceeds client size with overflow hidden
    const clipped = [];
    for (const e of document.querySelectorAll('main *, header *')) {
      const s = getComputedStyle(e);
      if ((s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden' || s.textOverflow === 'ellipsis') && e.textContent.trim() && e.clientWidth > 2) {
        if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) {
          if (e.matches('[class*=skipLink],[class*=visuallyHidden],[class*=head]') || e.getBoundingClientRect().width <= 1) continue;
          clipped.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} "${e.textContent.trim().slice(0, 30)}" sw=${e.scrollWidth}/${e.clientWidth} sh=${e.scrollHeight}/${e.clientHeight}`);
        }
      }
    }
    return { pageOverflow, offenders: offenders.slice(0, 10), clipped: clipped.slice(0, 10) };
  });
}

async function targets(page) {
  return page.evaluate(() => {
    const out = [];
    const els = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=tab],[tabindex="0"]')];
    for (const e of els) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden') continue;
      if (r.width < 24 || r.height < 24) {
        // inline links in sentences are exempt (inline exception)
        const inline = e.tagName === 'A' && s.display === 'inline';
        out.push({ el: `${e.tagName.toLowerCase()}${e.type ? `[${e.type}]` : ''} "${(e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 30)}"`, w: Math.round(r.width), h: Math.round(r.height), inline, cls: String(e.className).slice(0, 40) });
      }
    }
    return out;
  });
}

const routes = await discover();
const out = { base, date: new Date().toISOString(), routes, pages: [] };
for (const r of routes) {
  const entry = { route: r };
  for (const [name, vp] of [['1280', { width: 1280, height: 900 }], ['640-200pct', { width: 640, height: 450 }], ['320-400pct', { width: 320, height: 256 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await page.goto(base + r); await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    if (name === '1280') { entry.structure = await structure(page); entry.targets = await targets(page); }
    entry[`overflow_${name}`] = await overflow(page);
    if (name !== '640-200pct') {
      await page.addStyleTag({ content: SPACING });
      await page.waitForTimeout(200);
      entry[`spacing_${name}`] = await overflow(page);
    }
    if (name === '320-400pct') entry.targets320 = (await targets(page)).filter((t) => !t.inline);
    await ctx.close();
  }
  out.pages.push(entry);
  console.error(r, 'h1', entry.structure.h1, 'ovf320', entry['overflow_320-400pct'].pageOverflow, 'targets', entry.targets.filter((t) => !t.inline).length);
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
