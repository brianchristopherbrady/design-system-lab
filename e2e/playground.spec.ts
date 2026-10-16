import { expect, test, type Locator, type Page } from '@playwright/test';

const cssVar = (page: Page, name: string, scope?: Locator) =>
  (scope ?? page.locator('html')).evaluate((element, variable) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${variable})`;
    element.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

const openPreviewSettings = (page: Page) => page.locator('summary', { hasText: 'Preview settings' }).click();
const booleanValue = (page: Page, prop: string, value: 'false' | 'true') =>
  page.getByRole('radiogroup', { name: prop }).getByRole('radio', { name: value });

test.describe('playground', () => {
  test('opens on Button unless a valid component is requested', async ({ page }) => {
    await page.goto('/playground');
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('button');
    await page.goto('/playground?component=no-such-component');
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('button');
    await page.goto('/playground?component=theme-scope');
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('theme-scope');
  });

  test('controls change real props, the snippet and the rendered tokens together', async ({ page }) => {
    await page.goto('/playground?component=button');
    const preview = page.getByTestId('playground-preview');
    const snippet = page.getByTestId('playground-snippet');
    const button = preview.getByRole('button', { name: 'Save changes' });

    await page.getByRole('combobox', { name: 'appearance' }).selectOption('danger');
    await expect(snippet).toContainText('appearance="danger"');
    await expect(button).toHaveCSS('background-color', await cssVar(page, '--button-danger-background', preview));

    await page.getByRole('combobox', { name: 'size' }).selectOption('large');
    await expect(snippet).toContainText('size="large"');
    const height = await button.evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(52);

    await booleanValue(page, 'fullWidth', 'true').check();
    await expect(snippet).toContainText('fullWidth={true}');

    await page.getByRole('textbox', { name: 'children' }).fill('Delete entry');
    await expect(preview.getByRole('button', { name: 'Delete entry' })).toBeVisible();
    await expect(snippet).toContainText('Delete entry');

    await page.getByRole('button', { name: 'Reset component props' }).click();
    await expect(snippet).toContainText('appearance="secondary"');
    await expect(snippet).toContainText('fullWidth={false}');
  });

  test('presets and Reset component props change the code but not the preview settings', async ({ page }) => {
    await page.goto('/playground?component=button');
    const preview = page.getByTestId('playground-preview');
    const snippet = page.getByTestId('playground-snippet');
    await openPreviewSettings(page);
    await page.getByRole('combobox', { name: 'Preview theme' }).selectOption('dark');
    await page.getByRole('combobox', { name: 'Preset' }).selectOption('Destructive');
    await expect(snippet).toContainText('appearance="danger"');
    await expect(snippet).toContainText('Delete entry');

    await page.getByRole('button', { name: 'Reset component props' }).click();
    await expect(snippet).toContainText('appearance="secondary"');
    await expect(snippet).not.toContainText('Delete entry');
    await expect(snippet).not.toContainText('theme');
    await expect(preview).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('combobox', { name: 'Preview theme' })).toHaveValue('dark');
  });

  test('preview settings stay separate from the site, and Same as site follows it', async ({ page }) => {
    await page.goto('/playground?component=button');
    const preview = page.getByTestId('playground-preview');
    const context = page.getByTestId('preview-context');
    await expect(context).toContainText('Same as site');

    await openPreviewSettings(page);
    await page.getByRole('combobox', { name: 'Preview product' }).selectOption('meadow');
    await expect(context).toContainText('Meadow');
    await expect(context).toContainText('Overrides product');
    await expect(page.locator('html')).toHaveAttribute('data-product', 'system-lab');

    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
    await expect(preview).toHaveAttribute('data-theme', 'dark');
    await expect(preview).toHaveAttribute('data-product', 'meadow');
    await expect(context).toContainText('Dark');
  });

  test('ThemeScope props override the preview, and unset ones inherit it', async ({ page }) => {
    await page.goto('/playground?component=theme-scope');
    const preview = page.getByTestId('playground-preview');
    const scope = preview.locator('[data-product]').first();
    await openPreviewSettings(page);
    await page.getByRole('combobox', { name: 'Preview product' }).selectOption('meadow');
    await expect(preview).toHaveAttribute('data-product', 'meadow');
    await expect(scope).toHaveAttribute('data-product', 'harbor');

    await page.getByRole('combobox', { name: 'product', exact: true }).selectOption('');
    await expect(scope).toHaveAttribute('data-product', 'meadow');
    const chain = page.getByRole('table', { name: 'Where ThemeScope gets each setting' });
    await expect(chain.getByRole('row', { name: /^product/ })).toContainText('Design System Lab');
    await expect(chain.getByRole('row', { name: /^product/ })).toContainText('Meadow from preview');
    await expect(page.getByTestId('playground-snippet')).not.toContainText('product=');
  });

  test('expandable sections open and close from the keyboard', async ({ page }) => {
    await page.goto('/playground?component=button');
    const settings = page.locator('details', { has: page.locator('summary', { hasText: 'Preview settings' }) });
    const reference = page.locator('details', { has: page.locator('summary', { hasText: 'Props reference' }) });
    await page.locator('summary', { hasText: 'Preview settings' }).focus();
    await page.keyboard.press('Enter');
    await expect(settings).toHaveAttribute('open', '');
    await expect(page.getByRole('combobox', { name: 'Preview theme' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(settings).not.toHaveAttribute('open', '');

    await page.locator('summary', { hasText: 'Props reference' }).focus();
    await page.keyboard.press('Enter');
    await expect(reference).toHaveAttribute('open', '');
    await expect(reference.getByRole('rowheader', { name: 'appearance' })).toBeVisible();
  });

  test('presets apply several props at once', async ({ page }) => {
    await page.goto('/playground?component=badge');
    await page.getByRole('combobox', { name: 'Preset' }).selectOption('Danger filled');
    const snippet = page.getByTestId('playground-snippet');
    await expect(snippet).toContainText('tone="danger"');
    await expect(snippet).toContainText('appearance="filled"');
    await expect(snippet).toContainText('icon={<Icon name="danger" />}');
    await expect(page.getByRole('combobox', { name: 'tone' })).toHaveValue('danger');
  });

  test('the preview theme is scoped to the preview', async ({ page }) => {
    await page.goto('/playground?component=card');
    const preview = page.getByTestId('playground-preview');
    await openPreviewSettings(page);
    await page.getByRole('combobox', { name: 'Preview theme' }).selectOption('dark');
    await expect(preview).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    const pageCanvas = await cssVar(page, '--surface-canvas');
    const previewCanvas = await cssVar(page, '--surface-canvas', preview);
    expect(previewCanvas).not.toBe(pageCanvas);
  });

  test('the preview resizes independently of the window', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/playground?component=grid');
    const preview = page.getByTestId('playground-preview');
    await openPreviewSettings(page);
    await page.getByRole('button', { name: 'Narrow (320px)' }).click();
    await expect(page.getByRole('button', { name: 'Narrow (320px)' })).toHaveAttribute('aria-pressed', 'true');
    expect(Math.round((await preview.boundingBox())?.width ?? 0)).toBe(320);
    expect(page.viewportSize()?.width).toBe(1400);
    const narrowColumns = await preview.locator('[data-grid-mode]').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);

    await page.getByRole('button', { name: 'Fill' }).click();
    const wideColumns = await preview.locator('[data-grid-mode]').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    expect(narrowColumns).toBe(1);
    expect(wideColumns).toBeGreaterThan(1);
  });

  test('the selected component is in the URL and links to its documentation', async ({ page }) => {
    await page.goto('/playground');
    await page.getByRole('combobox', { name: 'Component' }).selectOption('dialog');
    await expect(page).toHaveURL(/component=dialog/);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog', { name: 'Archive this entry?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: /Dialog documentation/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dialog' })).toBeVisible();
  });

  test('component pages link to their playground story', async ({ page }) => {
    await page.goto('/components/badge');
    await page.getByRole('link', { name: 'Open in playground' }).click();
    await expect(page).toHaveURL(/\/playground\?component=badge/);
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('badge');
  });
});
