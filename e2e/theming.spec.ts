import { expect, test, type Locator } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const background = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).backgroundColor);
const fontFamily = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).fontFamily);
const signal = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element, '::after').backgroundColor);

test.describe('products and modes', () => {
  test('the header product and density selects re-theme the site and persist', async ({ page }) => {
    await page.goto('/components/button');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-product', 'system-lab');
    await expect(html).toHaveAttribute('data-density', 'comfortable');

    const primary = page.getByRole('main').getByRole('button', { name: 'Save changes' }).first();
    const heading = page.getByRole('heading', { level: 1 });
    const wordmark = page.getByRole('banner').getByRole('link', { name: 'Design System Lab' }).locator('span').last();
    const current = page.getByRole('navigation', { name: 'Sections' }).locator('[aria-current]');
    const before = { color: await background(primary), height: (await primary.boundingBox())!.height, signal: await signal(current) };
    expect(await fontFamily(heading)).toMatch(/^"Jost Variable"/);

    await page.getByRole('combobox', { name: 'Product' }).selectOption('harbor');
    await page.getByRole('combobox', { name: 'Density' }).selectOption('compact');
    await expect(html).toHaveAttribute('data-product', 'harbor');
    await expect(html).toHaveAttribute('data-density', 'compact');
    expect(await background(primary)).not.toBe(before.color);
    expect((await primary.boundingBox())!.height).toBeLessThan(before.height);
    expect(await fontFamily(heading)).toMatch(/^"IBM Plex Sans Variable"/);
    expect(await fontFamily(primary)).toMatch(/^"IBM Plex Sans Variable"/);
    // Controls inherit the x-height normalization rather than resetting it with `font: inherit`.
    expect(await primary.evaluate((element) => getComputedStyle(element).fontSizeAdjust)).toBe('0.46');
    expect(await fontFamily(wordmark)).toMatch(/^"Jost Variable"/);
    expect(await signal(current)).not.toBe(before.signal);

    await page.reload();
    await expect(html).toHaveAttribute('data-product', 'harbor');
    await expect(html).toHaveAttribute('data-density', 'compact');
    await expect(page.getByRole('combobox', { name: 'Product' })).toHaveValue('harbor');
  });

  test('the matrix renders every product and theme combination from tokens alone', async ({ page }) => {
    await page.goto('/foundations/products');
    await expect(page.getByRole('heading', { name: 'Products × themes' })).toBeVisible();
    const colors = new Set<string>();
    for (const product of ['system-lab', 'harbor', 'meadow']) {
      for (const theme of ['light', 'dark']) {
        const scope = page.locator(`#matrix [data-product="${product}"][data-theme="${theme}"]`).first();
        await expect(scope).toBeVisible();
        colors.add(await background(scope.getByRole('button', { name: 'Approve' })));
      }
    }
    expect(colors.size).toBe(6);
  });

  test('the playground preview takes its own product without changing the site', async ({ page }) => {
    await page.goto('/playground?component=button');
    const preview = page.getByTestId('playground-preview');
    await page.locator('summary', { hasText: 'Preview settings' }).click();
    await page.getByRole('combobox', { name: 'Preview product' }).selectOption('meadow');
    await expect(preview).toHaveAttribute('data-product', 'meadow');
    await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');
  });

  test('the composer lands on any permutation and reports where each value is declared', async ({ page }) => {
    await page.goto('/foundations/products');
    const composer = page.locator('#composer');
    const preview = page.getByTestId('composer-preview');
    await composer.getByRole('radio', { name: 'Dark' }).check();
    await composer.getByRole('radio', { name: 'Harbor' }).check();
    await composer.getByRole('radio', { name: 'Compact' }).check();
    await expect(preview).toHaveAttribute('data-theme', 'dark');
    await expect(preview).toHaveAttribute('data-product', 'harbor');
    await expect(preview).toHaveAttribute('data-density', 'compact');
    await expect(composer.getByText('product="harbor"')).toBeVisible();
    const radius = composer.getByRole('row', { name: /^control\.radius/ });
    await expect(radius).toContainText('0.125rem');
    await expect(radius).toContainText("[data-product='harbor']");
    await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');
  });

  test('the product diff and nested scopes are computed, not written by hand', async ({ page }) => {
    await page.goto('/foundations/products');
    const diff = page.getByRole('region', { name: /Product overrides/ });
    await expect(diff.getByRole('row')).toHaveCount(23);
    await page.locator('#overrides').getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('#diff-caption')).toHaveText('Product overrides, dark theme');
    const nested = page.locator('#inheritance');
    await expect(nested.locator('[data-density="compact"][data-product="harbor"][data-theme="light"]')).toBeVisible();
    await expect(nested.getByText('set here', { exact: true })).toHaveCount(4);
  });

  for (const product of ['harbor', 'meadow'] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`axe scan with the ${product} product in the ${colorScheme} theme`, async ({ page }) => {
        test.slow();
        await page.emulateMedia({ colorScheme });
        await page.addInitScript((value) => localStorage.setItem('system-lab:product', value), product);
        for (const [path, ready] of [
          ['/components/button', 'From prop to token'],
          ['/patterns/resource-directory', 'System directory'],
        ] as const) {
          await page.goto(path);
          await expect(page.getByRole('heading', { name: ready }).first()).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute('data-product', product);
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
    expect(await background(preview.getByRole('button', { name: 'Publish' }).first())).not.toBe(before);
    await expect(page).toHaveURL(/brand=f5d90a/);

    await page.getByRole('textbox', { name: 'Product id' }).fill('sunrise');
    await expect(page.getByRole('tabpanel')).toContainText('product.sunrise.tokens.json');
    await page.getByRole('tab', { name: 'Ramp' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('"sunrise"');
  });

  test('invalid input is explained and never reaches the export', async ({ page }) => {
    await page.goto('/foundations/theme-studio');
    const id = page.getByRole('textbox', { name: 'Product id' });
    await id.fill('harbor');
    await expect(id).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('“harbor” is already a product.')).toBeVisible();
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
