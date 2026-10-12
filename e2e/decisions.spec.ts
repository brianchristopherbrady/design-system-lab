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

  test('the sharing comparison responds to constraints without naming a winner', async ({ page }) => {
    await page.goto('/decisions/sharing#explore');
    const code = page.getByRole('listitem').filter({ hasText: 'Component code' });
    await expect(code).toContainText('One framework allows one library');
    await page.getByRole('combobox', { name: 'Meadow is built as' }).selectOption('native');
    await expect(code).toContainText('Keep separate');
    await expect(code).toContainText('Native and web code cannot be shared directly');
    await expect(page.getByRole('combobox', { name: 'Web frameworks' })).toBeDisabled();
    await expect(page.getByRole('status').filter({ hasText: 'Comparison updated' })).toContainText('kept separate');
    await expectNoAxeViolations(page);
  });

  for (const id of ['planning', 'implementation', 'operating']) {
    test(`${id} passes automated accessibility checks`, async ({ page }) => {
      await page.goto(`/decisions/${id}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

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
