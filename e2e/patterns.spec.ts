import { expect, test } from '@playwright/test';

test.describe('resource directory scenarios', () => {
  test('success supports search and pinning, and Reset demo starts over', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
    await page.getByRole('button', { name: /^Pin\s+Button$/ }).click();
    await expect(page.getByText('1 pinned')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search' }).fill('skeleton');
    await expect(page.getByRole('status').filter({ hasText: /^Showing 1 of/ })).toBeVisible();

    await page.getByRole('button', { name: 'Reset demo' }).click();
    await expect(page.getByText('0 pinned')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
  });

  test('resource type and component layer filter together, and a new type clears the layer', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    const type = page.getByRole('combobox', { name: 'Resource type' });
    const layer = page.getByRole('combobox', { name: 'Component layer' });
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
    await expect(layer).toHaveCount(0);

    await type.selectOption('component');
    await layer.selectOption('Composite');
    await expect(page.getByRole('heading', { level: 4, name: 'Card' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toHaveCount(0);

    await type.selectOption('pattern');
    await expect(layer).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 4, name: 'Form validation' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /^Showing 4 of/ })).toBeVisible();

    await type.selectOption('component');
    await expect(layer).toHaveValue('all');
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
  });

  test('the first page is short, Show more continues it and moves focus to the first new entry', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    const entries = page.locator('[data-scenario] ul > li');
    const showMore = page.getByRole('button', { name: /^Show \d+ more$/ });
    await expect(entries).toHaveCount(12);
    await expect(page.getByRole('status').filter({ hasText: /^Showing 12 of \d+ entries$/ })).toBeVisible();

    await showMore.click();
    await expect(entries).toHaveCount(24);
    await expect(entries.nth(12).getByRole('link').first()).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: /^Showing 24 of \d+ entries$/ })).toBeVisible();

    while (await showMore.count()) await showMore.click();
    const total = Number((await page.getByRole('status').filter({ hasText: /^Showing/ }).textContent())?.match(/of (\d+)/)?.[1]);
    await expect(entries).toHaveCount(total);
    await expect(page.getByRole('status').filter({ hasText: new RegExp(`^Showing ${total} of ${total}$`) })).toBeVisible();
  });

  test('search and filters cover every entry, not only the listed page, and start again from the first page', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'Skeleton' })).toHaveCount(0);
    await page.getByRole('searchbox', { name: 'Search' }).fill('skeleton');
    await expect(page.getByRole('heading', { level: 4, name: 'Skeleton' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search' }).fill('');

    await page.getByRole('button', { name: /^Show \d+ more$/ }).click();
    await expect(page.locator('[data-scenario] ul > li')).toHaveCount(24);
    await page.getByRole('combobox', { name: 'Resource type' }).selectOption('component');
    await expect(page.locator('[data-scenario] ul > li')).toHaveCount(12);
    await expect(page.getByRole('status').filter({ hasText: /^Showing 12 of \d+ matches, \d+ in total$/ })).toBeVisible();

    // A pin made on a later page survives filtering and paging.
    await page.getByRole('combobox', { name: 'Resource type' }).selectOption('all');
    await page.getByRole('searchbox', { name: 'Search' }).fill('typography');
    await page.getByRole('button', { name: /^Pin\s+Typography$/ }).click();
    await page.getByRole('searchbox', { name: 'Search' }).fill('');
    await expect(page.getByText('1 pinned')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search' }).fill('typography');
    await expect(page.getByRole('button', { name: /^Pin\s+Typography$/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('loading stays pending and is announced', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('loading');
    await expect(page.getByRole('status').filter({ hasText: 'Loading entries…' })).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('status').filter({ hasText: 'Loading entries…' })).toBeVisible();
    await expect(page.locator('section[aria-busy="true"]')).toHaveCount(1);
  });

  test('empty explains the state and offers a next action', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('empty');
    await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Read how entries are added' }).click();
    await expect(page.locator('#contributing')).toBeFocused();
  });

  test('no results is distinct from empty and recovers with Clear filters', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('noResults');
    await expect(page.getByRole('heading', { name: 'No entries match “tooltip”' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Clear filters' }).last().click();
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
  });

  test('error fails once, then Retry succeeds and focus moves to the heading', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('error');
    await expect(page.getByRole('alert')).toContainText('Entries could not be loaded');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('heading', { level: 4, name: 'Button' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System directory' })).toBeFocused();

    await page.getByRole('button', { name: 'Reset demo' }).click();
    await expect(page.getByRole('alert')).toContainText('Entries could not be loaded');
  });
});

test.describe('resource detail', () => {
  test('archive is confirmed, fails once, succeeds on retry and returns focus', async ({ page }) => {
    await page.goto('/patterns/resource-detail');
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Archive Button?' });
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Archive' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Button was not archived');
    await dialog.getByRole('button', { name: 'Try again' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Restore' })).toBeFocused();
    await expect(page.getByText('Button was archived. Use Restore to undo.')).toBeVisible();
  });

  test('Empty history opens on the History tab, and Reset demo returns there', async ({ page }) => {
    await page.goto('/patterns/resource-detail');
    const scenario = page.getByRole('combobox', { name: 'Demo scenario' });
    await expect(scenario.locator('option')).toHaveText(['Success', 'Loading', 'Empty history', 'Error']);
    await expect(page.getByRole('tab', { name: /^Overview/ })).toHaveAttribute('aria-selected', 'true');

    await scenario.selectOption('empty');
    await expect(scenario.locator('option:checked')).toHaveText('Empty history');
    const history = page.getByRole('tab', { name: 'History (0)' });
    await expect(history).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'No recorded changes' })).toBeVisible();

    // Tabs keep their keyboard behavior.
    await history.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: /^Overview/ })).toBeFocused();
    await expect(page.getByRole('tab', { name: /^Overview/ })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: 'Reset demo' }).click();
    await expect(page.getByRole('tab', { name: 'History (0)' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'No recorded changes' })).toBeVisible();

    await scenario.selectOption('success');
    await expect(page.getByRole('tab', { name: /^Overview/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('archive still fails once, retries and restores in Empty history', async ({ page }) => {
    await page.goto('/patterns/resource-detail');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('empty');
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Archive Button?' });
    await dialog.getByRole('button', { name: 'Archive' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Button was not archived');
    await dialog.getByRole('button', { name: 'Try again' }).click();
    await expect(dialog).toBeHidden();
    const restore = page.getByRole('button', { name: 'Restore' });
    await expect(restore).toBeFocused();
    await restore.click();
    await expect(page.getByRole('button', { name: 'Archive', exact: true })).toBeVisible();
  });
});

test.describe('activity dashboard', () => {
  test('the catalog metric counts every resource type and its parts add up to the total', async ({ page }) => {
    await page.goto('/patterns/activity-dashboard');
    const card = page
      .locator('[data-scenario] div')
      .filter({ has: page.getByText('Catalog entries', { exact: true }) })
      .last();
    const breakdown = card.getByText(/ · /);
    await expect(breakdown).toContainText('design decisions');
    const parts = ((await breakdown.textContent()) ?? '').split(' · ');
    expect(parts.map((part) => part.replace(/^\d+ /, ''))).toEqual(expect.arrayContaining(['components', 'foundations', 'patterns', 'design decisions']));
    const sum = parts.reduce((total, part) => total + Number(part.match(/^\d+/)?.[0]), 0);
    await expect(card.locator('strong')).toHaveText(String(sum));
  });

  test('no results and recovery', async ({ page }) => {
    await page.goto('/patterns/activity-dashboard');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('noResults');
    await expect(page.getByRole('heading', { name: 'No changes match “tooltip”' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Showing 23 of 23 changes$/ })).toBeVisible();
  });
});

test.describe('form validation', () => {
  test('a valid proposal completes the simulated submission and resets the form', async ({ page }) => {
    await page.goto('/patterns/form-validation');
    await page.getByRole('textbox', { name: /Component name/ }).fill('DatePicker');
    await page.getByRole('combobox', { name: /Component layer/ }).selectOption('Composite');
    await page.getByRole('textbox', { name: /Summary/ }).fill('Choosing a date with keyboard and calendar support.');
    await page.getByRole('textbox', { name: /Contact email/ }).fill('team@example.com');
    await page.getByRole('checkbox', { name: /searched the directory/ }).check();
    await page.getByRole('button', { name: 'Submit proposal' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Nothing was sent.' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Component name/ })).toHaveValue('');
  });

  test('duplicate names are rejected using the real catalog', async ({ page }) => {
    await page.goto('/patterns/form-validation');
    await page.getByRole('textbox', { name: /Component name/ }).fill('Button');
    await page.getByRole('button', { name: 'Submit proposal' }).click();
    await expect(page.getByText('Button already exists. Propose a change to it instead.').first()).toBeVisible();
  });
});

test.describe('focus and status after a state change (A11Y-001, A11Y-002)', () => {
  test('every Clear filters button hands focus to the Search input', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search' });
    for (const [index, key] of [[0, 'Enter'], [1, 'Space']] as const) {
      await page.goto('/components?q=zzzz');
      await page.getByRole('main').getByRole('button', { name: 'Clear filters' }).nth(index).focus();
      await page.keyboard.press(key);
      await expect(search).toBeFocused();
      await expect(search).toHaveValue('');
      expect(await search.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
      await expect(page.getByRole('status').filter({ hasText: 'Showing 29 of 29' })).toBeVisible();
    }

    await page.goto('/patterns/resource-directory');
    await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('noResults');
    await expect(page.getByRole('heading', { name: 'No entries match “tooltip”' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Clear filters' }).last().focus();
    await page.keyboard.press('Enter');
    await expect(search).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: /^Showing 12 of \d+ entries$/ })).toBeVisible();

    await search.fill('zzzz');
    await page.getByRole('main').getByRole('button', { name: 'Clear filters' }).first().focus();
    await page.keyboard.press('Enter');
    await expect(search).toBeFocused();
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  });

  for (const { path, scenario, outcome } of [
    { path: '/patterns/resource-directory', scenario: 'empty', outcome: 'No entries yet.' },
    { path: '/patterns/activity-dashboard', scenario: 'empty', outcome: 'No activity yet.' },
    { path: '/patterns/resource-detail', scenario: 'empty', outcome: 'Button entry loaded. No recorded changes.' },
  ]) {
    test(`${path} ${scenario} reports its outcome in the persistent demo status`, async ({ page }) => {
      await page.goto(path);
      const select = page.getByRole('combobox', { name: 'Demo scenario' });
      const status = page.locator('[data-scenario] + [role="status"]');
      await expect(status).toHaveCount(1);
      const before = await status.elementHandle();
      await select.focus();
      await select.selectOption(scenario);
      await expect(status).toHaveText(outcome);
      expect(await status.evaluate((element, original) => element === original, before)).toBe(true);
      await expect(select).toBeFocused();
    });
  }

  test('resource detail success reports that the entry loaded', async ({ page }) => {
    await page.goto('/patterns/resource-detail');
    await expect(page.locator('[data-scenario] + [role="status"]')).toHaveText('Button entry loaded.');
  });
});

test.describe('small accessibility fixes (A11Y-003 to A11Y-008)', () => {
  for (const path of ['/patterns/resource-directory', '/patterns/activity-dashboard', '/patterns/resource-detail']) {
    test(`${path} Retry keeps focus inside the demo while loading (A11Y-004)`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('combobox', { name: 'Demo scenario' }).selectOption('error');
      await page.getByRole('button', { name: 'Retry' }).focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      expect(tag).toBe('H3');
    });
  }

  test('the form confirmation checkbox is marked required (A11Y-003)', async ({ page }) => {
    await page.goto('/patterns/form-validation');
    const checkbox = page.getByRole('checkbox', { name: /I searched the directory/ });
    expect(await checkbox.evaluate((element: HTMLInputElement) => element.required)).toBe(true);
    await expect(page.locator('label', { hasText: 'I searched the directory' })).toContainText('(required)');
  });

  test('regions have unique names (A11Y-007)', async ({ page }) => {
    for (const path of ['/playground', '/components/scroll-region']) {
      await page.goto(path);
      await expect(page.getByRole('main').locator('h1')).toBeVisible();
      const names = await page.getByRole('region').evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('aria-label') ?? document.getElementById(element.getAttribute('aria-labelledby') ?? '')?.textContent ?? ''),
      );
      expect(new Set(names).size, `${path}: ${names.join(' | ')}`).toBe(names.length);
    }
  });

  test('the products foundation does not skip heading levels (A11Y-008)', async ({ page }) => {
    await page.goto('/foundations/products');
    await expect(page.getByRole('main').locator('h1')).toBeVisible();
    const levels = await page.locator('main :is(h1, h2, h3, h4, h5, h6)').evaluateAll((elements) => elements.map((element) => Number(element.tagName[1])));
    const skips = levels.filter((level, index) => index > 0 && level > levels[index - 1] + 1);
    expect(skips).toEqual([]);
  });

  test('theme studio ramp values are not truncated under text spacing (A11Y-005)', async ({ page }) => {
    await page.goto('/foundations/theme-studio');
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
    const meta = page.locator('[class*="stripMeta"]');
    await expect(meta.first()).toBeVisible();
    const clipped = await meta.evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth).length);
    expect(clipped).toBe(0);
  });
});
