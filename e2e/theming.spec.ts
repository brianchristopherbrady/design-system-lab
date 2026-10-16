import { expect, test, type Locator } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const background = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).backgroundColor);
const fontFamily = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).fontFamily);

test.describe('products and modes', () => {
  test('the header sets only the theme, and an old saved product or density no longer restyles the site', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('system-lab:product', 'provider');
      localStorage.setItem('system-lab:density', 'compact');
    });
    await page.goto('/components/button');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-product', 'system-lab');
    await expect(html).toHaveAttribute('data-density', 'comfortable');
    expect(await fontFamily(page.getByRole('heading', { level: 1 }))).toMatch(/^"Jost Variable"/);

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('combobox')).toHaveCount(1);
    await expect(banner.getByRole('combobox', { name: 'Theme' })).toHaveValue('system');
    await expect
      .poll(() => page.evaluate(() => [localStorage.getItem('system-lab:product'), localStorage.getItem('system-lab:density')]))
      .toEqual([null, null]);
  });

  test('the matrix renders every product and theme combination from tokens alone', async ({ page }) => {
    await page.goto('/foundations/products');
    await expect(page.getByRole('heading', { name: 'Products × themes' })).toBeVisible();
    const colors = new Map<string, string>();
    for (const product of ['system-lab', 'patient', 'provider']) {
      for (const theme of ['light', 'dark']) {
        const scope = page.locator(`#matrix [data-product="${product}"][data-theme="${theme}"]`).first();
        await expect(scope).toBeVisible();
        colors.set(`${product} ${theme}`, await background(scope.getByRole('button', { name: 'Approve' })));
      }
    }
    // The patient app and the provider workspace share one brand family.
    expect(new Set(colors.values()).size).toBe(4);
    for (const theme of ['light', 'dark']) expect(colors.get(`patient ${theme}`)).toBe(colors.get(`provider ${theme}`));
  });

  test('the playground preview takes its own product without changing the site', async ({ page }) => {
    await page.goto('/playground?component=button');
    const preview = page.getByTestId('playground-preview');
    await page.locator('summary', { hasText: 'Preview settings' }).click();
    await page.getByRole('combobox', { name: 'Preview product' }).selectOption('patient');
    await expect(preview).toHaveAttribute('data-product', 'patient');
    await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');
  });

  test('the composer lands on any permutation and reports where each value is declared', async ({ page }) => {
    await page.goto('/foundations/products');
    const composer = page.locator('#composer');
    const preview = page.getByTestId('composer-preview');
    await composer.getByRole('radio', { name: 'Dark' }).check();
    await composer.getByRole('radio', { name: 'Provider workspace' }).check();
    await composer.getByRole('radio', { name: 'Compact' }).check();
    await expect(preview).toHaveAttribute('data-theme', 'dark');
    await expect(preview).toHaveAttribute('data-product', 'provider');
    await expect(preview).toHaveAttribute('data-density', 'compact');
    await expect(composer.getByText('product="provider"')).toBeVisible();
    const radius = composer.getByRole('row', { name: /^control\.radius/ });
    await expect(radius).toContainText('0.125rem');
    await expect(radius).toContainText("[data-product='provider']");
    await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');
  });

  test('the product diff and nested scopes are computed, not written by hand', async ({ page }) => {
    await page.goto('/foundations/products');
    const diff = page.getByRole('region', { name: /Product overrides/ });
    await expect(diff.getByRole('row')).toHaveCount(22);
    await page.locator('#overrides').getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('#diff-caption')).toHaveText('Product overrides, dark theme');
    const nested = page.locator('#inheritance');
    await expect(nested.locator('[data-density="compact"][data-product="provider"][data-theme="light"]')).toBeVisible();
    await expect(nested.getByText('set here', { exact: true })).toHaveCount(4);
  });

  for (const product of ['patient', 'provider'] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`axe scan of ${product} previews in the ${colorScheme} theme`, async ({ page }) => {
        test.slow();
        await page.emulateMedia({ colorScheme });
        for (const component of ['button', 'card', 'input']) {
          await page.goto(`/playground?component=${component}&v=1&preview.product=${product}`);
          await expect(page.getByTestId('playground-preview')).toHaveAttribute('data-product', product);
          await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');
          await expectNoAxeViolations(page);
        }
      });
    }
  }
});

test.describe('theme studio', () => {
  test('a new brand color regenerates the ramp, re-picks roles and updates the export', async ({ page }) => {
    await page.goto('/foundations/theme-studio');
    const input = page.getByRole('textbox', { name: 'Brand color', exact: true });
    const preview = page.locator('#preview');
    const before = await background(preview.getByRole('button', { name: 'Publish' }).first());

    await input.fill('#f5d90a');
    await expect(page.getByRole('status').filter({ hasText: 'WCAG' })).toContainText('All 20 brand pairs pass');
    // The button's background transitions, so wait for it to move off the old brand.
    await expect.poll(() => background(preview.getByRole('button', { name: 'Publish' }).first())).not.toBe(before);
    await expect(page).toHaveURL(/brand=f5d90a/);

    await page.getByRole('textbox', { name: 'Product id' }).fill('sunrise');
    await expect(page.getByRole('tabpanel')).toContainText('product.sunrise.tokens.json');
    await page.getByRole('tab', { name: 'Ramp' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('"sunrise"');
  });

  test('invalid input is explained and never reaches the export', async ({ page }) => {
    await page.goto('/foundations/theme-studio');
    const id = page.getByRole('textbox', { name: 'Product id' });
    await id.fill('provider');
    await expect(id).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('“provider” is already a product.')).toBeVisible();
    await expect(page.getByRole('tabpanel')).toContainText('product.clavius.tokens.json');

    const brand = page.getByRole('textbox', { name: 'Brand color', exact: true });
    await brand.fill('#12345g');
    await expect(page.getByText('Enter a hex color such as #4f46e5 or #46e.')).toBeVisible();
    await brand.fill('#e11');
    await expect(brand).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/brand=ee1111/);
  });

  test('editing keeps the reader where they are', async ({ page }) => {
    await page.goto('/foundations/theme-studio#export');
    const id = page.getByRole('textbox', { name: 'Product id' });
    await id.fill('night-shift');
    await expect(page).toHaveURL(/id=night-shift#export$/);
    await expect(id).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText('product.night-shift.tokens.json');
  });

  test('presets live inside the generator, and the result changes in view as the controls do', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/foundations/theme-studio');
    const presets = page.getByRole('group', { name: 'Start from a preset' });
    await presets.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 24));
    const result = page.locator('#studio figure', { hasText: 'Live result' });
    const save = result.locator('button', { hasText: 'Save' }).first();
    await expect(result).toBeInViewport();
    const before = await background(save);

    await presets.getByRole('button', { name: 'Orion' }).click();
    await expect(result).toContainText('Orion, machined shape');
    expect(await background(save)).not.toBe(before);
    await page.locator('#studio').getByRole('radio', { name: 'Pill' }).check();
    await expect(save).toHaveCSS('border-top-left-radius', '999px');
    await expect(result).toBeInViewport();

    const top = (name: string) => page.getByRole('textbox', { name, exact: true }).evaluate((input) => Math.round(input.getBoundingClientRect().top));
    expect(await top('Brand color')).toBe(await top('Product id'));
  });

  test('presets, shape and the address restore a shared theme', async ({ page }) => {
    test.slow();
    await page.goto('/foundations/theme-studio');
    await page.getByRole('button', { name: 'Orion' }).click();
    await expect(page.getByRole('button', { name: 'Orion' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#studio').getByRole('radio', { name: 'Pill' }).check();
    const publish = page.locator('#preview').getByRole('button', { name: 'Publish' }).first();
    await expect(publish).toHaveCSS('border-top-left-radius', '999px');
    await expect(page.getByRole('tabpanel')).toContainText('{radius.full}');
    await expect(page.locator('#vision')).toContainText('close in the light theme: danger (every vision type)');

    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Brand color', exact: true })).toHaveValue('#e11d48');
    await expect(page.getByRole('textbox', { name: 'Product id' })).toHaveValue('orion');
    await expect(page.locator('#studio').getByRole('radio', { name: 'Pill' })).toBeChecked();
    await expectNoAxeViolations(page);
    await page.locator('#vision').getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('#vision')).toContainText('close in the dark theme');
    await expectNoAxeViolations(page);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByRole('textbox', { name: 'Product id' })).toHaveValue('clavius');
    await expect(page).not.toHaveURL(/brand=/);
  });
});

test.describe('container query tooling', () => {
  test('pattern demos can outline their query containers', async ({ page }) => {
    await page.goto('/patterns/resource-directory');
    await expect(page.getByText(/Showing \d+ of \d+/)).toBeVisible();
    await page.getByRole('switch', { name: 'Show query containers' }).check();
    const summary = page.getByTestId('container-summary');
    await expect(summary).toContainText('demo');
    await expect(summary).toContainText('filters');
    await expect(summary).toContainText(/\d+ × entry at/);
  });

  test('the playground reports the preview container width as it is resized', async ({ page }) => {
    await page.goto('/playground?component=card');
    await page.locator('summary', { hasText: 'Preview settings' }).click();
    await page.getByRole('switch', { name: 'Show query containers' }).check();
    await page.getByRole('button', { name: /^Narrow/ }).click();
    await expect(page.getByTestId('container-summary')).toContainText(/preview \d+px/);
  });

  test('the responsive foundation lists every query read from the stylesheets', async ({ page }) => {
    await page.goto('/foundations/responsive');
    const registry = page.getByRole('region', { name: 'Queries in the codebase' });
    await expect(registry.getByRole('row').nth(5)).toBeVisible();
    await expect(page.getByText(/All \d+ viewport size queries are in the app shell/)).toBeVisible();
    await page.getByRole('combobox', { name: 'Show' }).selectOption('container');
    await expect(registry.getByRole('rowheader', { name: 'entry' }).first()).toBeVisible();
  });
});
