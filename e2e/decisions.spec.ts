import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

test.describe('design decisions', () => {
  test('the section answers four questions, each linked from the landing page', async ({ page }) => {
    await page.goto('/decisions');
    await expect(page.getByRole('heading', { level: 1, name: 'Design decisions' })).toBeVisible();
    const cards = page.getByRole('list', { name: 'Design decisions' }).getByRole('listitem');
    await expect(cards).toHaveCount(4);
    await expectNoAxeViolations(page);
    await page.getByRole('link', { name: 'Sharing across products' }).first().click();
    await expect(page).toHaveURL(/\/decisions\/sharing$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sharing across products' })).toBeFocused();
  });

  test('the sharing comparison explains what changed without naming a winner', async ({ page }) => {
    await page.goto('/decisions/sharing#explore');
    const layers = page.getByRole('region', { name: 'Layer by layer' });
    const code = layers.getByRole('listitem').filter({ hasText: 'Component code (web)' });
    await expect(code).toContainText('use the same framework, so one library can serve both');
    await page.getByRole('combobox', { name: 'Meadow is built as' }).selectOption('native');
    await expect(code).toContainText('Keep separate');
    await expect(code).toContainText('Changed');
    await expect(page.getByRole('combobox', { name: 'Web frameworks' })).toBeDisabled();
    const changed = page.getByRole('region', { name: 'What changed' });
    await expect(changed.getByRole('listitem').filter({ hasText: 'Component code (web)' })).toContainText('Why: Only Harbor is on the web');
    await expect(page.getByRole('status').filter({ hasText: 'Meadow is built as: A native app.' })).toContainText('conclusions changed');
    await expect(page.getByRole('region', { name: 'A starting point for these constraints' })).toContainText('Would change if');
    await expectNoAxeViolations(page);
  });

  test('presets, reset and a copied link reproduce a scenario', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/decisions/sharing#explore');
    const preset = page.getByRole('button', { name: 'Native plus web' });
    await preset.click();
    await expect(preset).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/mobile=both.*#explore$/);
    await expect(page.getByRole('heading', { level: 4, name: 'Meadow’s native app' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Controls with equivalent behavior' }).selectOption('many');
    await expect(preset).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Copy scenario link' }).click();
    await expect(page.getByText('Scenario link copied.')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(new URL(copied).searchParams.get('overlap')).toBe('many');

    await page.getByRole('button', { name: 'Reset to the scenario' }).click();
    await expect(page).toHaveURL(/\/decisions\/sharing#explore$/);
    await expect(page.getByRole('combobox', { name: 'Meadow is built as' })).toHaveValue('web');

    await page.goto(copied);
    await expect(page.getByRole('combobox', { name: 'Meadow is built as' })).toHaveValue('both');
    await expect(page.getByRole('combobox', { name: 'Controls with equivalent behavior' })).toHaveValue('many');
    await expect(page.getByRole('region', { name: 'What changed' })).toHaveCount(0);
  });

  test('a scenario link with invalid values falls back to the defaults', async ({ page }) => {
    await page.goto('/decisions/sharing?mobile=tablet&brands=distinct#explore');
    await expect(page.getByRole('combobox', { name: 'Meadow is built as' })).toHaveValue('web');
    await expect(page.getByRole('combobox', { name: 'Brands' })).toHaveValue('distinct');
    await expect(page).not.toHaveURL(/tablet/);
    await expect(page).toHaveURL(/brands=distinct.*#explore$/);
  });

  test('the two product demonstrations share behavior and differ in presentation', async ({ page }) => {
    await page.goto('/decisions/sharing#compositions');
    const meadow = page.getByRole('region', { name: 'How should we keep you updated?' });
    const harbor = page.getByRole('region', { name: 'Records to review' });
    await meadow.getByRole('textbox', { name: 'Email address' }).fill('abc');
    await meadow.getByRole('button', { name: 'Continue' }).click();
    await harbor.getByRole('textbox', { name: 'Notify by email' }).fill('abc');
    await harbor.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Enter an email address, like name@example.com.')).toHaveCount(2);
    await expect(harbor.getByRole('textbox', { name: 'Notify by email' })).toBeFocused();
    const fonts = await Promise.all([meadow, harbor].map((region) => region.getByRole('heading', { level: 3 }).evaluate((heading) => getComputedStyle(heading).fontFamily)));
    expect(fonts[0]).not.toBe(fonts[1]);
    await harbor.getByRole('textbox', { name: 'Filter records' }).fill('access');
    await expect(harbor.getByText('Showing 2 of 5 records')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  for (const id of ['planning', 'implementation', 'operating']) {
    test(`${id} passes automated accessibility checks`, async ({ page }) => {
      await page.goto(`/decisions/${id}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test('planning opens every disclosure and still passes automated accessibility checks', async ({ page }) => {
    await page.goto('/decisions/planning');
    for (const summary of ['System brief', 'Measurement plan', 'Sources']) {
      await page.getByText(summary, { exact: true }).click();
      await expect(page.locator('details', { has: page.getByText(summary, { exact: true }) })).toHaveJSProperty('open', true);
    }
    await expect(page.getByRole('table', { name: /each measure tied to inventory findings/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('implementation opens its source files, React example and sources, and still passes automated accessibility checks', async ({ page }) => {
    // Six source files open at once make this a long page for axe to scan.
    test.slow();
    await page.goto('/decisions/implementation');
    const files = page.locator('#current details');
    await expect(files).toHaveCount(6);
    for (const file of await files.all()) {
      await file.locator('summary').click();
      await expect(file).toHaveJSProperty('open', true);
    }
    await expect(files.first().getByText('No component library and no headless library').first()).toBeVisible();
    await page.getByText('Using the sketch from React 19', { exact: true }).click();
    await expect(page.locator('#example code[data-language="tsx"]')).toContainText('onchange=');
    await page.getByText('Sources', { exact: true }).click();
    for (const name of ['React DOM components: Custom HTML elements', 'Vue and Web Components', 'CUSTOM_ELEMENTS_SCHEMA', 'ControlValueAccessor']) {
      await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expectNoAxeViolations(page);
  });

  test('each page keeps its full title, links back to the overview and to its neighbours', async ({ page }) => {
    const pages = [
      { id: 'planning', title: 'Planning a system', short: 'Planning' },
      { id: 'sharing', title: 'Sharing across products', short: 'Sharing' },
      { id: 'implementation', title: 'Choosing an implementation approach', short: 'Implementation' },
      { id: 'operating', title: 'Operating and measuring a system', short: 'Operating' },
    ];
    for (const [index, current] of pages.entries()) {
      await page.goto(`/decisions/${current.id}`);
      await expect(page.getByRole('heading', { level: 1, name: current.title })).toBeVisible();
      const sidebar = page.getByRole('navigation', { name: 'Design decisions' });
      await expect(sidebar.getByRole('link')).toHaveText(pages.map((entry) => entry.short));
      await expect(sidebar.getByRole('link', { name: current.short, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('main header').getByRole('link', { name: 'Design decisions' })).toHaveAttribute('href', '/decisions');
      const pager = page.getByRole('navigation', { name: 'Previous and next decisions' });
      await expect(pager.getByRole('link', { name: 'Back to Decisions overview' })).toHaveAttribute('href', '/decisions');
      const previous = pages[index - 1];
      const next = pages[index + 1];
      if (previous) await expect(pager.getByRole('link', { name: `Previous ${previous.title}` })).toHaveAttribute('href', `/decisions/${previous.id}`);
      else await expect(pager.getByRole('link', { name: /^Previous/ })).toHaveCount(0);
      if (next) await expect(pager.getByRole('link', { name: `Next ${next.title}` })).toHaveAttribute('href', `/decisions/${next.id}`);
      else await expect(pager.getByRole('link', { name: /^Next/ })).toHaveCount(0);
      const anchors = await page.getByRole('navigation', { name: 'On this page' }).getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
      expect(anchors[0], current.id).toBe('#record');
      for (const anchor of anchors) await expect(page.locator(anchor), `${current.id} ${anchor}`).toHaveCount(1);
    }
    await page.getByRole('navigation', { name: 'Previous and next decisions' }).getByRole('link', { name: /^Previous/ }).click();
    await expect(page).toHaveURL(/\/decisions\/implementation$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Choosing an implementation approach' })).toBeFocused();
  });

  test('old Guides links lead somewhere useful', async ({ page }) => {
    await page.goto('/guides');
    await expect(page).toHaveURL(/\/decisions$/);
    await page.goto('/guides/design-tokens');
    await expect(page).toHaveURL(/\/foundations\/tokens$/);
    await page.goto('/guides/migration');
    await expect(page).toHaveURL(/\/decisions\/operating#migration$/);
    await expect(page.locator('#migration')).toBeInViewport();
    await page.goto('/guides/no-such-article');
    await expect(page).toHaveURL(/\/decisions$/);
  });

  test('fits a 320 pixel screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const path of ['/decisions', '/decisions/planning', '/decisions/sharing', '/decisions/implementation', '/decisions/operating']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBe(0);
    }
  });
});
