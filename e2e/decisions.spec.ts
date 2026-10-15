import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

/** The decision pages in sidebar and pager order. */
const pages = [
  { id: 'planning', title: 'Planning a system', short: 'Planning' },
  { id: 'sharing', title: 'Sharing across products', short: 'Sharing' },
  { id: 'implementation', title: 'Choosing an implementation approach', short: 'Implementation' },
  { id: 'component-apis', title: 'Designing component APIs', short: 'Component APIs' },
  { id: 'quality', title: 'Quality and release decisions', short: 'Quality' },
  { id: 'alignment', title: 'Keeping design, code and docs aligned', short: 'Alignment' },
  { id: 'adoption', title: 'Adoption and migration', short: 'Adoption' },
  { id: 'operating', title: 'Operating and measuring a system', short: 'Operating' },
];

test.describe('design decisions', () => {
  test('the section answers one question per page, each linked from the landing page', async ({ page }) => {
    await page.goto('/decisions');
    await expect(page.getByRole('heading', { level: 1, name: 'Design decisions' })).toBeVisible();
    const cards = page.getByRole('list', { name: 'Design decisions' }).getByRole('listitem');
    await expect(cards).toHaveCount(pages.length);
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

  for (const { id } of pages.filter((entry) => entry.id !== 'sharing')) {
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

  test('operating shows its worked examples, opens its source files, and still passes automated accessibility checks', async ({ page }) => {
    // Six source files open at once make this a long page for axe to scan.
    test.slow();
    await page.goto('/decisions/operating');
    for (const caption of ['Request: hide the Checkbox label in table rows', 'Exception EX-007: Harbor’s row-selection checkbox', 'Release note: shared core 3.0.0']) {
      await expect(page.locator('figcaption', { hasText: caption })).toBeVisible();
    }
    await expect(page.locator('#releases figure', { hasText: 'Maturity labels in this repository' })).toContainText('Deprecate first, keep working for at least one minor release');

    const links = await page.locator('main a[href^="/decisions/"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));
    for (const href of new Set(links.filter((link) => link.includes('#')))) {
      const [path = '', hash = ''] = href.split('#');
      await page.goto(`${path}#${hash}`);
      await expect(page.locator(`#${hash}`), href).toBeInViewport();
    }

    await page.goto('/decisions/operating#checked');
    const files = page.locator('#checked details');
    await expect(files).toHaveCount(6);
    for (const file of await files.all()) {
      await file.locator('summary').click();
      await expect(file).toHaveJSProperty('open', true);
    }
    await expect(files.first()).toContainText('maturityDefinitions');
    await page.getByText('Sources', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Contribution criteria', exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('component APIs trace a named value to the browser and compose a summary without a new prop', async ({ page }) => {
    await page.goto('/decisions/component-apis#options');
    await page.getByRole('combobox', { name: 'Card padding' }).selectOption('extraLarge');
    await expect(page.locator('#options [aria-live="polite"]')).toHaveText('padding="extraLarge" → spacing.extra-large → var(--spacing-extra-large) → 32px in your browser');
    const summary = page.getByRole('article', { name: 'Access request R-1042' });
    await summary.getByRole('button', { name: 'Approve' }).click();
    await expect(summary.getByText('Approved', { exact: true })).toBeVisible();
    await expect(summary.getByRole('status')).toHaveText('Status changed to Approved.');
    await page.getByRole('link', { name: 'Loading button in the Playground' }).click();
    await expect(page).toHaveURL(/component=button&v=1&p\.appearance=primary&p\.loading=true/);
    await expect(page.locator('button[data-loading]', { hasText: 'Saving' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('adoption measures the replacement tokens live and keeps the wrapped call sites working', async ({ page }) => {
    await page.goto('/decisions/adoption#tokens');
    const radius = page.locator('#tokens tbody tr', { hasText: 'button.radius' }).locator('td').nth(1);
    await expect(radius).toHaveText('4px');
    await page.evaluate(() => (document.documentElement.dataset.product = 'harbor'));
    await expect(radius).toHaveText('2px');

    await page.goto('/decisions/adoption#replace');
    await page.getByRole('switch', { name: 'Saving' }).check();
    const saves = page.locator('#replace').getByRole('button', { name: 'Save' });
    await expect(saves).toHaveCount(2);
    for (const save of await saves.all()) {
      await expect(save).toHaveAttribute('aria-disabled', 'true');
      await save.focus();
      await expect(save).toBeFocused();
    }
    await expect(page.locator('#replace').getByRole('link', { name: 'View history' })).toHaveAttribute('href', '/patterns/resource-detail');
    await expectNoAxeViolations(page);
  });

  test('quality shows the Tabs keyboard contract in both writing directions', async ({ page }) => {
    await page.goto('/decisions/quality#demo');
    const demo = page.locator('#demo');
    const tab = (name: string) => demo.getByRole('tab', { name });
    await tab('Overview').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab('Tokens')).toBeFocused();
    await expect(tab('Tokens')).toHaveAttribute('aria-selected', 'true');
    await expect(demo.getByText('Selected: Tokens')).toBeVisible();

    await demo.getByRole('combobox', { name: 'Writing direction' }).selectOption('rtl');
    await tab('Tokens').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tab('History')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(tab('Overview')).toBeFocused();
    await page.keyboard.press('End');
    await expect(tab('History')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('tabpanel', { name: 'History' })).toBeFocused();
    await expectNoAxeViolations(page);
  });

  test('alignment maps Badge properties to its real props and links to the same badge in the Playground', async ({ page }) => {
    await page.goto('/decisions/alignment#mapping');
    const mapping = page.getByRole('table', { name: 'Badge: design-tool properties and props in code' });
    await expect(mapping.getByRole('row', { name: /^Style/ })).toContainText('filled, subtle, outlined');
    await expect(mapping.getByRole('row', { name: /^Tone/ })).toContainText('Error → danger');
    await page.getByRole('link', { name: 'that badge in the Playground' }).click();
    await expect(page).toHaveURL(/component=badge&v=1&p\.tone=danger&p\.appearance=outlined&p\.size=small/);
    await expect(page.getByRole('combobox', { name: 'tone' })).toHaveValue('danger');
  });

  test('each page keeps its full title, links back to the overview and to its neighbours', async ({ page }) => {
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
    const secondLast = pages[pages.length - 2];
    await expect(page).toHaveURL(new RegExp(`/decisions/${secondLast?.id ?? ''}$`));
    await expect(page.getByRole('heading', { level: 1, name: secondLast?.title })).toBeFocused();
  });

  test('old Guides links lead somewhere useful', async ({ page }) => {
    await page.goto('/guides');
    await expect(page).toHaveURL(/\/decisions$/);
    await page.goto('/guides/design-tokens');
    await expect(page).toHaveURL(/\/foundations\/tokens$/);
    await page.goto('/guides/migration');
    await expect(page).toHaveURL(/\/decisions\/adoption$/);
    await page.goto('/decisions/operating#migration');
    await expect(page.locator('#migration')).toBeInViewport();
    await page.locator('#migration').getByRole('link', { name: 'Adoption and migration' }).click();
    await expect(page).toHaveURL(/\/decisions\/adoption$/);
    await page.goto('/guides/no-such-article');
    await expect(page).toHaveURL(/\/decisions$/);
  });

  test('fits a 320 pixel screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const path of ['/decisions', ...pages.map((entry) => `/decisions/${entry.id}`)]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBe(0);
    }
  });
});
