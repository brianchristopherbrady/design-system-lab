import { expect, test, type Page } from '@playwright/test';

const demoList = (page: Page) => page.getByRole('list', { name: 'From a design decision to a working interface' });

/** The value the demonstration reports, and what the live Button actually paints, read in one frame. */
async function readDemo(page: Page) {
  await page.mouse.move(0, 0);
  return page.evaluate(() => {
    const list = document.querySelector('[aria-label="From a design decision to a working interface"]');
    const facts = [...(list?.querySelectorAll('dt') ?? [])];
    const valueOf = (term: string) => facts.find((dt) => dt.textContent === term)?.nextElementSibling?.querySelector('code')?.textContent ?? '';
    const button = list?.querySelector('button');
    const probe = document.createElement('span');
    probe.style.color = valueOf('Current value');
    document.body.append(probe);
    const reported = getComputedStyle(probe).color;
    probe.remove();
    return {
      reported,
      painted: button ? getComputedStyle(button).backgroundColor : '',
      height: valueOf('Height'),
      paintedHeight: button ? button.getBoundingClientRect().height : 0,
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
    };
  });
}

test.describe('overview', () => {
  for (const viewport of [
    { width: 375, height: 760 },
    { width: 1280, height: 800 },
  ]) {
    test(`the first screen shows the purpose and the main action at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      const explore = page.getByRole('link', { name: 'Explore Button' });
      await expect(explore).toBeInViewport({ ratio: 1 });
      await explore.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/playground\?component=button$/);
      await expect(page.getByRole('heading', { level: 1, name: 'Playground' })).toBeFocused();
    });
  }

  test('the review path comes first and its stops lead to their destinations in order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const sections = await page.getByRole('main').getByRole('heading', { level: 2 }).allTextContents();
    expect(sections[0]).toBe('Review the work');
    const stops = page.getByRole('list', { name: 'Suggested review path' }).locator(':scope > li');
    await expect(stops).toHaveCount(3);
    await expect(stops.first()).toBeInViewport();
    const destinations = await stops.evaluateAll((items) => items.map((item) => item.querySelector('a')?.getAttribute('href')));
    expect(destinations).toEqual(['/playground?component=button', '/foundations/theme-studio', '/patterns/form-validation']);
    const more = await page
      .getByRole('list', { name: 'More to review' })
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(more).toEqual(['/foundations/tokens', '/decisions']);

    await stops.nth(1).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Theme studio' })).toBeFocused();
  });

  test('the introduction states authorship and links the source and the case study', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('main header').first();
    await expect(header.getByRole('link', { name: 'Brian Brady' })).toHaveAttribute('href', 'https://brianbrady.dev');
    await expect(header.getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/brianchristopherbrady/design-system-lab',
    );
    await expect(header.getByRole('link', { name: 'Case study' })).toHaveAttribute('href', 'https://brianbrady.dev/projects/system-lab.html');
  });

  test('the demonstration reports what the live Button paints in every product, theme and density', async ({ page }) => {
    await page.goto('/');
    const demo = demoList(page);
    const button = demo.getByRole('button', { name: 'Save changes' });
    await button.click();
    await expect(demo.getByRole('status')).toHaveText('Pressed 1 time.');

    for (const [product, theme, density] of [
      ['system-lab', 'light', 'comfortable'],
      ['harbor', 'light', 'comfortable'],
      ['meadow', 'dark', 'compact'],
    ] as const) {
      await page.getByRole('combobox', { name: 'Product', exact: true }).selectOption(product);
      await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption(theme);
      await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption(density);
      await expect(page.locator('html')).toHaveAttribute('data-product', product);
      // The background transitions, so wait for the painted color to settle on the reported one.
      await expect.poll(async () => {
        const reading = await readDemo(page);
        return reading.painted === reading.reported;
      }, { message: `${product} ${theme}` }).toBe(true);
      const reading = await readDemo(page);
      expect(parseFloat(reading.height) * reading.rootFontSize, `${density} height`).toBeCloseTo(reading.paintedHeight, 0);
    }

    // Only styles changed, so the component kept its state.
    await expect(demo.getByRole('status')).toHaveText('Pressed 1 time.');
  });

  test('names its author and links to the real contribution process', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Brian Brady' }).first()).toHaveAttribute('href', 'https://brianbrady.dev');
    const repository = 'https://github.com/brianchristopherbrady/design-system-lab';
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute('href', repository);
    await expect(page.getByRole('link', { name: 'opening an issue in the GitHub repository' })).toHaveAttribute('href', `${repository}/issues/new`);
  });
});
