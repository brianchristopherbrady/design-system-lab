import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

/** The decision pages in sidebar and pager order; `own` pages open with this repository's choice. */
const pages = [
  { id: 'implementation', title: 'Choosing an implementation approach', short: 'Implementation', own: true },
  { id: 'component-apis', title: 'Designing component APIs', short: 'Component APIs', own: true },
  { id: 'alignment', title: 'Keeping design, code and docs aligned', short: 'Alignment', own: true },
  { id: 'quality', title: 'Quality and release decisions', short: 'Quality', own: true },
  { id: 'sharing', title: 'Sharing across products', short: 'Sharing', own: true },
  { id: 'planning', title: 'Planning a system', short: 'Planning', own: false },
  { id: 'adoption', title: 'Adoption and migration', short: 'Adoption', own: false },
  { id: 'operating', title: 'Operating and measuring a system', short: 'Operating', own: false },
];

test.describe('design decisions', () => {
  test('the section answers one question per page, each linked from the landing page', async ({ page }) => {
    await page.goto('/decisions');
    await expect(page.getByRole('heading', { level: 1, name: 'Design decisions' })).toBeVisible();
    const own = page.getByRole('list', { name: 'Decisions in this project' }).getByRole('listitem');
    await expect(own).toHaveCount(pages.filter((entry) => entry.own).length);
    await expect(page.getByRole('list', { name: 'Applying the approach to a product team' }).getByRole('listitem')).toHaveCount(pages.filter((entry) => !entry.own).length);
    await expect(own.first().getByRole('link', { name: 'Button in the Playground' })).toHaveAttribute('href', '/playground?component=button');
    await expectNoAxeViolations(page);
    await page.getByRole('link', { name: 'Sharing across products' }).first().click();
    await expect(page).toHaveURL(/\/decisions\/sharing$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sharing across products' })).toBeFocused();
  });

  test('each page about this project explains its choice in one screen before the scenario', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const { id } of pages.filter((entry) => entry.own)) {
      await page.goto(`/decisions/${id}`);
      const opening = page.locator('#project');
      await expect(opening.getByText('Chosen here', { exact: true })).toBeVisible();
      const box = await opening.evaluate((element) => element.getBoundingClientRect().height);
      expect(box, id).toBeLessThanOrEqual(900);
      const order = await page.locator('main h2').evaluateAll((headings) => headings.map((heading) => heading.textContent));
      expect(order[0], id).toBe('In this project');
      expect(order.indexOf('Decision record'), id).toBeGreaterThan(0);
    }
  });

  test('the sharing comparison explains what changed without naming a winner', async ({ page }) => {
    await page.goto('/decisions/sharing#explore');
    const layers = page.getByRole('region', { name: 'Layer by layer' });
    const code = layers.getByRole('listitem').filter({ hasText: 'Component code (web)' });
    await expect(code).toContainText('use the same framework, so one library can serve both');
    await page.getByRole('combobox', { name: 'The patient app is built as' }).selectOption('native');
    await expect(code).toContainText('Keep separate');
    await expect(code).toContainText('Changed');
    await expect(page.getByRole('combobox', { name: 'Web frameworks' })).toBeDisabled();
    const changed = page.getByRole('region', { name: 'What changed' });
    await expect(changed.getByRole('listitem').filter({ hasText: 'Component code (web)' })).toContainText('Why: Only the provider workspace is on the web');
    await expect(page.getByRole('status').filter({ hasText: 'The patient app is built as: A native app.' })).toContainText('conclusions changed');
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
    await expect(page.getByRole('heading', { level: 4, name: 'The native patient app' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Controls with equivalent behavior' }).selectOption('many');
    await expect(preset).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Copy scenario link' }).click();
    await expect(page.getByText('Scenario link copied.')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(new URL(copied).searchParams.get('overlap')).toBe('many');

    await page.getByRole('button', { name: 'Reset to the scenario' }).click();
    await expect(page).toHaveURL(/\/decisions\/sharing#explore$/);
    await expect(page.getByRole('combobox', { name: 'The patient app is built as' })).toHaveValue('web');

    await page.goto(copied);
    await expect(page.getByRole('combobox', { name: 'The patient app is built as' })).toHaveValue('both');
    await expect(page.getByRole('combobox', { name: 'Controls with equivalent behavior' })).toHaveValue('many');
    await expect(page.getByRole('region', { name: 'What changed' })).toHaveCount(0);
  });

  test('a scenario link with invalid values falls back to the defaults', async ({ page }) => {
    await page.goto('/decisions/sharing?mobile=tablet&brands=distinct#explore');
    await expect(page.getByRole('combobox', { name: 'The patient app is built as' })).toHaveValue('web');
    await expect(page.getByRole('combobox', { name: 'Brands' })).toHaveValue('distinct');
    await expect(page).not.toHaveURL(/tablet/);
    await expect(page).toHaveURL(/brands=distinct.*#explore$/);
  });

  test('the patient and provider examples share behavior and typeface, and differ in density', async ({ page }) => {
    await page.goto('/decisions/sharing#compositions');
    const patient = page.getByRole('region', { name: 'How should we confirm your appointment?' });
    const provider = page.getByRole('region', { name: 'Appointment requests' });
    await expect(patient).toHaveAttribute('data-product', 'patient');
    await expect(provider).toHaveAttribute('data-product', 'provider');
    await patient.getByRole('textbox', { name: 'Email address' }).fill('abc');
    await patient.getByRole('button', { name: 'Continue' }).click();
    await provider.getByRole('textbox', { name: 'Notify by email' }).fill('abc');
    await provider.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Enter an email address, like name@example.com.')).toHaveCount(2);
    await expect(provider.getByRole('textbox', { name: 'Notify by email' })).toBeFocused();
    const looks = await Promise.all(
      [patient.getByRole('textbox', { name: 'Email address' }), provider.getByRole('textbox', { name: 'Notify by email' })].map((input) =>
        input.evaluate((element) => {
          const style = getComputedStyle(element);
          return { font: style.fontFamily, height: element.getBoundingClientRect().height };
        }),
      ),
    );
    expect(looks[0]?.font).toBe(looks[1]?.font);
    expect(looks[0]?.height).toBeGreaterThan(looks[1]?.height ?? Infinity);
    await provider.getByRole('textbox', { name: 'Filter requests' }).fill('visit');
    await expect(provider.getByText('Showing 2 of 5 requests')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('the examples keep their state through a theme change, and stack on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/decisions/sharing#compositions');
    const patient = page.getByRole('region', { name: 'How should we confirm your appointment?' });
    const provider = page.getByRole('region', { name: 'Appointment requests' });
    const row = provider.getByRole('checkbox', { name: 'R-2042 · Priya N. · Follow-up visit' });
    await patient.getByText('Text message', { exact: true }).click();
    await provider.getByRole('textbox', { name: 'Filter requests' }).fill('visit');
    await row.check();

    await page.getByRole('banner').getByRole('combobox', { name: 'Theme' }).selectOption('dark');
    for (const region of [patient, provider]) await expect(region).toHaveAttribute('data-theme', 'dark');
    await expect(patient).toHaveAttribute('data-product', 'patient');
    await expect(provider).toHaveAttribute('data-density', 'compact');
    await expect(patient.getByRole('radio', { name: /Text message/ })).toBeChecked();
    await expect(provider.getByRole('textbox', { name: 'Filter requests' })).toHaveValue('visit');
    await expect(row).toBeChecked();

    const [top, bottom] = await Promise.all([patient.boundingBox(), provider.boundingBox()]);
    expect(bottom?.y ?? 0).toBeGreaterThanOrEqual((top?.y ?? 0) + (top?.height ?? 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    // WCAG 2.5.8: every button and text field in both examples is at least 24px tall.
    for (const region of [patient, provider]) {
      for (const control of await region.locator('button, input[type="email"], input[type="text"], input:not([type])').all()) {
        expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(24);
      }
    }
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
    for (const caption of ['Request: hide the Checkbox label in table rows', 'Exception EX-007: the provider workspace’s row-selection checkbox', 'Release note: shared core 3.0.0']) {
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
    const background = page.locator('#tokens tbody tr', { hasText: 'button.primary.background' }).locator('td').nth(1);
    const light = (await background.textContent()) ?? '';
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
    await expect(background).not.toHaveText(light);

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
      expect(anchors[0], current.id).toBe(current.own ? '#project' : '#record');
      expect(anchors, current.id).toContain('#record');
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
