import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const pages = [
  { name: 'overview', path: '/', ready: 'Design System Lab' },
  { name: 'color foundation', path: '/foundations/color', ready: 'Verified contrast' },
  { name: 'themes foundation', path: '/foundations/themes', ready: 'Same roles, different mappings' },
  { name: 'responsive foundation', path: '/foundations/responsive', ready: 'Resize a container' },
  { name: 'products foundation', path: '/foundations/products', ready: 'Products × themes' },
  { name: 'theme studio', path: '/foundations/theme-studio', ready: 'Ramp and roles' },
  { name: 'components index', path: '/components', ready: 'Components' },
  { name: 'Button reference', path: '/components/button', ready: 'From prop to token' },
  { name: 'Badge reference', path: '/components/badge', ready: 'Tones and appearances' },
  { name: 'Card reference', path: '/components/card', ready: 'Elevation, surface and padding' },
  { name: 'playground', path: '/playground?component=card', ready: 'Component props' },
  { name: 'resource directory', path: '/patterns/resource-directory', ready: 'System directory' },
  { name: 'resource detail', path: '/patterns/resource-detail', ready: 'Button' },
  { name: 'activity dashboard', path: '/patterns/activity-dashboard', ready: 'System activity' },
  { name: 'form validation', path: '/patterns/form-validation', ready: 'States and transitions' },
  { name: 'planning decision', path: '/decisions/planning', ready: 'Worked example: from principle to validation' },
  { name: 'sharing decision', path: '/decisions/sharing', ready: 'Layer by layer' },
  { name: 'not found', path: '/does-not-exist', ready: 'Page not found' },
];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe-core WCAG 2.2 A/AA scan (${colorScheme} theme)`, () => {
    test.use({ colorScheme });
    test.describe.configure({ timeout: 90_000 });

    for (const { name, path, ready } of pages) {
      test(name, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: ready }).first()).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }

    test('open dialog', async ({ page }) => {
      await page.goto('/components/dialog');
      await page.getByRole('button', { name: 'Show keyboard shortcuts' }).click();
      const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS('opacity', '1');
      await expectNoAxeViolations(page);
    });

    test('every demo scenario of the resource directory', async ({ page }) => {
      await page.goto('/patterns/resource-directory');
      const scenario = page.getByRole('combobox', { name: 'Demo scenario' });
      for (const [value, ready] of [
        ['loading', 'Loading entries…'],
        ['empty', 'No entries yet'],
        ['noResults', 'No entries match “tooltip”'],
        ['error', 'Entries could not be loaded'],
      ] as const) {
        await scenario.selectOption(value);
        await expect(page.getByText(ready).first()).toBeVisible();
        await expectNoAxeViolations(page);
      }
    });
  });
}

test.describe('keyboard and focus', () => {
  test('tab order follows the visual order of the shell', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const names: string[] = [];
    for (let index = 0; index < 11; index += 1) {
      await page.keyboard.press('Tab');
      names.push(
        await page.evaluate(() => {
          const element = document.activeElement as HTMLElement & { labels?: NodeListOf<HTMLLabelElement> };
          return element.labels?.[0]?.textContent ?? element.textContent?.trim() ?? '';
        }),
      );
    }
    expect(names).toEqual([
      'Skip to main content',
      'Design System Lab',
      'Overview',
      'Foundations',
      'Components',
      'Playground',
      'Patterns',
      'Design decisions',
      'Product',
      'Theme',
      'Density',
    ]);
  });

  test('the skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/components/button');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('client-side navigation moves focus to the new page heading', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Components' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeFocused();
    await expect(page).toHaveTitle('Components · Design System Lab');
  });

  test('the dialog traps focus, closes on Escape and restores focus to its opener', async ({ page }) => {
    await page.goto('/components/dialog');
    const opener = page.getByRole('button', { name: 'Show keyboard shortcuts' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('a confirmation dialog focuses Cancel and keeps an operation error inside the dialog', async ({ page }) => {
    await page.goto('/components/dialog');
    await page.getByRole('button', { name: 'Delete the legacy token set' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete the legacy token set?' });
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog.getByRole('alert')).toContainText('The token set was not deleted');
    await dialog.getByRole('button', { name: 'Try again' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Legacy token set deleted.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset example' })).toBeFocused();
  });

  test('tabs follow the ARIA keyboard pattern', async ({ page }) => {
    await page.goto('/components/tabs');
    const usage = page.getByRole('tab', { name: 'Usage' });
    await usage.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Tokens' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Tokens' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Tokens' })).toContainText('button.primary.background → action.primary.background → color.neutral.950');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Changes' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel', { name: 'Changes' })).toBeFocused();
  });

  test('example actions show a result for pointer and keyboard', async ({ page }) => {
    await page.goto('/components/card');
    const pin = page.getByRole('button', { name: 'Pin' }).first();
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    await pin.click();
    await expect(pin).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(pin).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/components/alert');
    await page.getByRole('button', { name: 'Retry' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: 'Changes loaded on the second attempt.' })).toBeVisible();
    const reset = page.getByRole('button', { name: 'Reset example' });
    await expect(reset).toBeFocused();
    await reset.click();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeFocused();

    await page.goto('/components/empty-state');
    await page.getByRole('link', { name: 'Browse components' }).click();
    await expect(page).toHaveURL(/\/components$/);
  });

  test('the form error summary receives focus and links to fields', async ({ page }) => {
    await page.goto('/patterns/form-validation');
    await page.getByRole('button', { name: 'Submit proposal' }).click();
    const summary = page.getByText('Fix 5 problems to continue');
    await expect(summary).toBeVisible();
    await page.getByRole('link', { name: /Component name: Enter a component name/ }).click();
    await expect(page.getByRole('textbox', { name: /Component name/ })).toBeFocused();
    await expect(page.getByRole('textbox', { name: /Component name/ })).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('themes', () => {
  test('the theme menu switches every token and persists the choice', async ({ page }) => {
    await page.goto('/components/button');
    const canvas = () => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    const light = await canvas();
    await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await canvas()).not.toBe(light);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('token tables and example traces follow the selected product', async ({ page }) => {
    await page.goto('/foundations/color');
    await page.getByRole('combobox', { name: 'Product', exact: true }).selectOption('meadow');
    const actions = page.getByRole('table', { name: /^Action roles used by Button, for Meadow at \w+ density$/ });
    await expect(actions.getByRole('row', { name: /^action\.primary\.background\b/ }).getByRole('cell').first()).toHaveText('{brand.meadow.strong}');

    await page.goto('/components/tabs');
    await page.getByRole('tab', { name: 'Tokens' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Tokens' })).toContainText('action.primary.background → brand.meadow.strong');
  });
});
