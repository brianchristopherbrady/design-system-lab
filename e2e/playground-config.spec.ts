import { expect, test, type Page } from '@playwright/test';

const openPreviewSettings = (page: Page) => page.locator('summary', { hasText: 'Preview settings' }).click();
const snippet = (page: Page) => page.getByTestId('playground-snippet');
const preview = (page: Page) => page.getByTestId('playground-preview');
const booleanValue = (page: Page, prop: string, value: 'false' | 'true') =>
  page.getByRole('radiogroup', { name: prop }).getByRole('radio', { name: value });

async function configureButton(page: Page) {
  await page.goto('/playground');
  await page.getByRole('combobox', { name: 'size' }).selectOption('large');
  await page.getByRole('combobox', { name: 'border' }).selectOption('thick');
  await booleanValue(page, 'fullWidth', 'true').check();
  await openPreviewSettings(page);
  await page.getByRole('combobox', { name: 'Preview product' }).selectOption('meadow');
  await page.getByRole('combobox', { name: 'Preview theme' }).selectOption('dark');
  await page.getByRole('combobox', { name: 'Preview density' }).selectOption('compact');
  await page.getByRole('button', { name: 'Narrow (320px)' }).click();
}

async function expectConfiguredButton(page: Page) {
  await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('large');
  await expect(page.getByRole('combobox', { name: 'border' })).toHaveValue('thick');
  await expect(booleanValue(page, 'fullWidth', 'true')).toBeChecked();
  await expect(preview(page)).toHaveAttribute('data-product', 'meadow');
  await expect(preview(page)).toHaveAttribute('data-theme', 'dark');
  await expect(preview(page)).toHaveAttribute('data-density', 'compact');
  await expect(page.getByTestId('preview-context')).toContainText('Meadow · Dark · Compact · 320px');
  await expect(snippet(page)).toContainText('size="large"');
  await expect(snippet(page)).toContainText('fullWidth={true}');
}

test.describe('playground configuration', () => {
  test('survives opening the documentation, Back and a refresh', async ({ page }) => {
    await configureButton(page);
    await expectConfiguredButton(page);
    await expect(page).toHaveURL(/v=1/);

    await page.getByRole('link', { name: /Button documentation/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
    await page.goBack();
    await expectConfiguredButton(page);

    await page.reload();
    await expectConfiguredButton(page);
  });

  test('prop edits replace the history entry, so Back leaves the Playground', async ({ page }) => {
    await page.goto('/components/button');
    await page.getByRole('link', { name: 'Open in playground' }).click();
    await page.getByRole('combobox', { name: 'size' }).selectOption('large');
    await page.getByRole('combobox', { name: 'appearance' }).selectOption('primary');
    await page.getByRole('textbox', { name: 'children' }).fill('Publish');
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('remembers a draft per component, and Back and Forward follow component changes', async ({ page }) => {
    await page.goto('/playground');
    await page.getByRole('combobox', { name: 'size' }).selectOption('large');
    await page.getByRole('combobox', { name: 'Component' }).selectOption('card');
    await page.getByRole('combobox', { name: 'padding' }).selectOption('small');
    await page.getByRole('combobox', { name: 'Component' }).selectOption('button');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('large');
    await page.getByRole('combobox', { name: 'Component' }).selectOption('card');
    await expect(page.getByRole('combobox', { name: 'padding' })).toHaveValue('small');

    await page.goBack();
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('button');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('large');
    await page.goForward();
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('card');
  });

  test('a copied link reproduces the example in a fresh browser without changing its site settings', async ({ page, browser }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await configureButton(page);
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
    await page.getByRole('button', { name: 'Copy example link' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Example link copied.' })).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toMatch(/^http.*\/playground\?component=button&v=1&/);

    const visitor = await browser.newContext();
    const other = await visitor.newPage();
    await other.goto(link);
    await expectConfiguredButton(other);
    await expect(other.getByRole('combobox', { name: 'Theme', exact: true })).toHaveValue('system');
    await expect(other.locator('html')).toHaveAttribute('data-product', 'system-lab');
    await expect(other.locator('html')).toHaveAttribute('data-density', 'comfortable');
    await visitor.close();
  });

  test('a link from an inherited preview captures its appearance but leaves the author inheriting', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/playground?component=theme-scope');
    await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('dark');
    await page.getByRole('combobox', { name: 'product', exact: true }).selectOption('');
    await page.getByRole('button', { name: 'Copy example link' }).click();
    const link = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    expect(link.searchParams.get('preview.product')).toBe('system-lab');
    expect(link.searchParams.get('preview.theme')).toBe('dark');
    expect(link.searchParams.get('preview.density')).toBe('comfortable');
    // The ThemeScope prop stays unset, so it keeps inheriting from the captured preview.
    expect(link.searchParams.get('p.product')).toBe('');

    await expect(page.getByTestId('preview-context')).toContainText('Same as site');
    await openPreviewSettings(page);
    await expect(page.getByRole('combobox', { name: 'Preview product' })).toHaveValue('inherit');
    expect(new URL(page.url()).searchParams.get('preview.product')).toBeNull();
  });

  test('when copying fails, the link is offered for manual copying from the keyboard', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
    });
    await page.goto('/playground?component=badge');
    await page.getByRole('button', { name: 'Copy example link' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: 'could not be copied' })).toBeVisible();
    const field = page.getByRole('textbox', { name: 'Example link' });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(/\/playground\?component=badge&v=1&preview\.product=/);
  });

  test('round-trips unset values, false and text with punctuation and Unicode', async ({ page }) => {
    const text = 'Save & “publish” — 50% off? 🚀';
    await page.goto('/playground?component=theme-scope');
    await page.getByRole('combobox', { name: 'product', exact: true }).selectOption('');
    await page.goto('/playground?component=button');
    await page.getByRole('textbox', { name: 'children' }).fill(text);
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'children' })).toHaveValue(text);
    await expect(preview(page).getByRole('button', { name: text })).toBeVisible();

    await page.goto('/playground?component=dialog&v=1&p.dismissOnBackdrop=false&p.size=small');
    await expect(booleanValue(page, 'dismissOnBackdrop', 'false')).toBeChecked();
    await expect(snippet(page)).toContainText('dismissOnBackdrop={false}');
    await page.goto('/playground?component=theme-scope');
    await expect(page.getByRole('combobox', { name: 'product', exact: true })).toHaveValue('');
  });

  test('malformed and unsupported URLs fall back safely', async ({ page }) => {
    await page.goto('/playground?component=button&v=1&p.size=huge&p.onClick=alert(1)&preview.width=abc&preview.theme=sepia');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('medium');
    await expect(page.getByTestId('preview-context')).toContainText('Same as site');

    await page.goto('/playground?component=card&v=99&p.padding=small');
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('card');
    await expect(page.getByRole('combobox', { name: 'padding' })).toHaveValue('');
    await expect(page).toHaveURL(/component=card&v=1/);

    await page.goto('/playground?component=does-not-exist&v=1&p.size=large');
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('button');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('medium');
  });

  test('Reset component props restores only the props, and the usage code never shows preview settings', async ({ page }) => {
    await configureButton(page);
    await page.getByRole('button', { name: 'Reset component props' }).click();
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('medium');
    await expect(booleanValue(page, 'fullWidth', 'false')).toBeChecked();
    await expect(page.getByTestId('preview-context')).toContainText('Meadow · Dark · Compact · 320px');
    const url = new URL(page.url());
    expect([...url.searchParams.keys()].filter((name) => name.startsWith('p.'))).toEqual([]);
    expect(url.searchParams.get('preview.width')).toBe('320');
    for (const word of ['preview', 'meadow', 'dark', 'compact', '320']) await expect(snippet(page)).not.toContainText(word);
  });

  test('fixed widths fit a narrow screen and Fill follows it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/playground?component=grid&v=1&preview.width=960');
    const width = await preview(page).evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeLessThan(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page).toHaveURL(/preview\.width=960/);

    await page.goto('/playground?component=grid');
    const fill = await preview(page).evaluate((element) => element.getBoundingClientRect().width);
    await page.setViewportSize({ width: 320, height: 800 });
    await expect.poll(() => preview(page).evaluate((element) => element.getBoundingClientRect().width)).toBeLessThan(fill);
  });
});

test.describe('dialog backdrop dismissal', () => {
  const openDialog = async (page: Page) => {
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  };

  test('stays open on a backdrop click by default and closes when dismissOnBackdrop is on', async ({ page }) => {
    await page.goto('/playground?component=dialog');
    await openDialog(page);
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open dialog' })).toBeFocused();

    await booleanValue(page, 'dismissOnBackdrop', 'true').check();
    await expect(snippet(page)).toContainText('dismissOnBackdrop={true}');
    await openDialog(page);
    const box = (await page.getByRole('dialog').boundingBox())!;
    await page.getByRole('dialog').getByRole('heading').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Pressing inside and releasing on the backdrop is not a backdrop click.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 10);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open dialog' })).toBeFocused();
  });

  test('a copied example keeps backdrop dismissal off when it was turned off', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/playground?component=dialog');
    await page.getByRole('combobox', { name: 'Preset' }).selectOption('Dismiss on backdrop');
    await expect(booleanValue(page, 'dismissOnBackdrop', 'true')).toBeChecked();
    await booleanValue(page, 'dismissOnBackdrop', 'false').click();
    await expect(booleanValue(page, 'dismissOnBackdrop', 'false')).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Preset' }).locator('option:checked')).toHaveText('Custom');
    await page.getByRole('combobox', { name: 'size' }).selectOption('large');
    await page.getByRole('button', { name: 'Copy example link' }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto('/playground?component=dialog&v=1&p.dismissOnBackdrop=true');
    await page.goto(link);
    await expect(booleanValue(page, 'dismissOnBackdrop', 'false')).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('large');
    await openDialog(page);
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
