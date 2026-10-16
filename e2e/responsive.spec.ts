import { expect, test, type Page } from '@playwright/test';

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

const reflowPages = [
  '/',
  '/foundations/tokens',
  '/foundations/color',
  '/foundations/spacing',
  '/components',
  '/components/button',
  '/components/grid',
  '/components/dialog',
  '/playground?component=button',
  '/playground?component=grid',
  '/patterns/resource-directory',
  '/patterns/activity-dashboard',
  '/patterns/form-validation',
  '/decisions',
];

test.describe('reflow at 320 CSS pixels (WCAG 1.4.10)', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  for (const path of reflowPages) {
    test(`no horizontal scrolling on ${path}`, { tag: '@employer-path' }, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await horizontalOverflow(page)).toBe(0);
    });
  }

  test('section navigation collapses behind a toggle', async ({ page }) => {
    await page.goto('/components/button');
    const toggle = page.getByRole('button', { name: 'Show components' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Badge' })).toBeHidden();
    await toggle.click();
    await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Badge' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Badge' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show components' })).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('reflow at common phone widths', () => {
  // A long unbreakable badge once overflowed here at 375 and 390 while fitting at 320, where the layout differs.
  for (const width of [375, 390]) {
    test(`no horizontal scrolling on /foundations/tokens at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/foundations/tokens');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await horizontalOverflow(page)).toBe(0);
    });
  }
});

test.describe('header', () => {
  test('the name and sections share one row between the 64rem and 90rem breakpoints', async ({ page }) => {
    for (const width of [1040, 1070]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const brand = await page.getByRole('banner').getByRole('link', { name: 'Design System Lab' }).boundingBox();
      const sections = await page.getByRole('navigation', { name: 'Sections' }).boundingBox();
      expect(Math.abs(sections!.y - brand!.y)).toBeLessThan(2);
    }
  });
});

test.describe('container queries', () => {
  test('EntryCard adapts to its container, not the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/foundations/responsive');
    const range = page.getByRole('slider', { name: 'Container width' });
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Card', exact: true }) }).last();
    // Both boxes are read in one frame: smooth scrolling can move the page between two separate boundingBox calls.
    const measure = () =>
      card.evaluate((element) => {
        const pin = [...element.querySelectorAll('button')].find((button) => button.textContent?.startsWith('Pin'))!;
        const title = element.querySelector('h1, h2, h3, h4, h5, h6')!;
        return { pinTop: pin.getBoundingClientRect().top, titleBottom: title.getBoundingClientRect().bottom };
      });

    await range.fill('64');
    const wide = await measure();
    await range.fill('18');
    const narrow = await measure();

    // Wide: the pin button sits beside the text. Narrow: below it.
    expect(wide.pinTop).toBeLessThan(wide.titleBottom);
    expect(narrow.pinTop).toBeGreaterThan(narrow.titleBottom);
  });

  test('documentation pages show a contents column only when the page container is wide', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/components/button');
    const contents = page.getByRole('navigation', { name: 'On this page' });
    const main = page.getByRole('heading', { name: 'Overview', level: 2 });
    const wideContents = await contents.boundingBox();
    const wideMain = await main.boundingBox();
    expect(wideContents!.x).toBeGreaterThan(wideMain!.x);

    await page.setViewportSize({ width: 900, height: 900 });
    const narrowContents = await contents.boundingBox();
    const narrowMain = await main.boundingBox();
    expect(narrowContents!.y).toBeLessThan(narrowMain!.y);
  });
});

test.describe('URL state', () => {
  test('component filters live in the URL and follow Back and Forward', async ({ page }) => {
    await page.goto('/components');
    await page.getByRole('combobox', { name: 'Component layer' }).selectOption('Composite');
    await expect(page).toHaveURL(/layer=Composite/);
    await expect(page.getByRole('heading', { level: 2, name: /^Primitive/ })).toHaveCount(0);

    await page.goBack();
    await expect(page).not.toHaveURL(/layer=/);
    await expect(page.getByRole('heading', { level: 2, name: /^Primitive/ })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole('combobox', { name: 'Component layer' })).toHaveValue('Composite');

    // A link shared before the filter was renamed still applies; the retired maturity filter is ignored.
    await page.goto('/components?layer=Layout&maturity=beta');
    await expect(page.getByRole('combobox', { name: 'Component layer' })).toHaveValue('Layout');
    await expect(page.getByRole('combobox', { name: 'Maturity' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: /^Layout/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^Composite/ })).toHaveCount(0);

    await page.goto('/components?q=zzz');
    await expect(page.getByRole('heading', { name: 'No components match these filters' })).toBeVisible();
  });
});
