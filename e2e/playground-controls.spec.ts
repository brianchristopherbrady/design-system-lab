import { expect, test, type Locator, type Page } from '@playwright/test';

const snippet = (page: Page) => page.getByTestId('playground-snippet');
const previewButton = (page: Page) => page.getByTestId('playground-preview').getByRole('button');
const group = (page: Page, prop: string) => page.getByRole('radiogroup', { name: prop });
const option = (page: Page, prop: string, value: 'false' | 'true') => group(page, prop).locator('label', { hasText: value });
const radio = (page: Page, prop: string, value: 'false' | 'true') => group(page, prop).getByRole('radio', { name: value });
const presetSelect = (page: Page) => page.getByRole('combobox', { name: 'Preset' });
const shownPreset = (page: Page) => presetSelect(page).locator('option:checked');
const width = (locator: Locator) => locator.evaluate((element) => element.getBoundingClientRect().width);

test.describe('Controls table', () => {
  test('boolean values are chosen by mouse and keyboard, and the preview, code and URL agree', async ({ page }) => {
    await page.goto('/playground?component=button');
    const button = previewButton(page);
    const natural = await width(button);
    await expect(radio(page, 'fullWidth', 'false')).toBeChecked();

    await option(page, 'fullWidth', 'true').click();
    await expect(radio(page, 'fullWidth', 'true')).toBeChecked();
    await expect(radio(page, 'fullWidth', 'false')).not.toBeChecked();
    await expect(snippet(page)).toContainText('fullWidth={true}');
    await expect(page).toHaveURL(/[?&]p\.fullWidth=true(&|$)/);
    await expect.poll(() => width(button)).toBeGreaterThan(natural);

    await option(page, 'fullWidth', 'false').click();
    await expect(radio(page, 'fullWidth', 'false')).toBeChecked();
    await expect(snippet(page)).toContainText('fullWidth={false}');
    await expect(page).not.toHaveURL(/p\.fullWidth/);
    await expect.poll(() => width(button)).toBe(natural);

    // Arrow keys move and select within the pair; focus stays on the control through each update.
    await radio(page, 'fullWidth', 'false').focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'fullWidth', 'true')).toBeChecked();
    await expect(radio(page, 'fullWidth', 'true')).toBeFocused();
    await expect(snippet(page)).toContainText('fullWidth={true}');
    await expect(page).toHaveURL(/p\.fullWidth=true/);
    await page.keyboard.press('ArrowLeft');
    await expect(radio(page, 'fullWidth', 'false')).toBeChecked();
    await expect(radio(page, 'fullWidth', 'false')).toBeFocused();
    await expect(page).not.toHaveURL(/p\.fullWidth/);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`the selected value is unmistakable in the ${theme} theme, and hover is not selection`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('system-lab:theme', value), theme);
      await page.goto('/playground?component=button');
      const selected = option(page, 'loading', 'false');
      const other = option(page, 'loading', 'true');
      const look = (label: Locator) =>
        label.evaluate((element) => ({
          background: getComputedStyle(element).backgroundColor,
          color: getComputedStyle(element).color,
          check: getComputedStyle(element.querySelector('svg')!).visibility,
        }));

      await page.mouse.move(0, 0);
      const on = await look(selected);
      const off = await look(other);
      expect(on.check).toBe('visible');
      expect(off.check).toBe('hidden');
      expect(on.background).not.toBe(off.background);
      expect(on.color).not.toBe(off.color);

      await other.hover();
      await expect.poll(async () => (await look(other)).background).not.toBe(off.background);
      const hovered = await look(other);
      expect(hovered.background).not.toBe(on.background);
      expect(hovered.check).toBe('hidden');
      await expect(radio(page, 'loading', 'false')).toBeChecked();
    });
  }

  test('Button loading and disabled reach the preview, and disabled can be turned off again', async ({ page }) => {
    await page.goto('/playground?component=button');
    const button = previewButton(page);

    await option(page, 'loading', 'true').click();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(snippet(page)).toContainText('loading={true}');
    await expect(page).toHaveURL(/p\.loading=true/);
    await option(page, 'loading', 'false').click();
    await expect(button).not.toHaveAttribute('aria-disabled');
    await expect(snippet(page)).toContainText('loading={false}');

    await option(page, 'disabled', 'true').click();
    await expect(button).toBeDisabled();
    await expect(snippet(page)).toContainText('disabled={true}');
    await expect(page).toHaveURL(/p\.disabled=true/);
    await option(page, 'disabled', 'false').click();
    await expect(button).toBeEnabled();
    await expect(page).not.toHaveURL(/p\.disabled/);
  });

  test('the preset selector follows the props through edits, refresh, reset and component changes', async ({ page }) => {
    await page.goto('/playground?component=button');
    await expect(shownPreset(page)).toHaveText('Starting values');

    await presetSelect(page).selectOption('Destructive');
    await expect(shownPreset(page)).toHaveText('Destructive');
    await expect(snippet(page)).toContainText('appearance="danger"');
    await expect(previewButton(page)).toHaveAccessibleName('Delete entry');

    await page.getByRole('combobox', { name: 'size' }).selectOption('large');
    await expect(shownPreset(page)).toHaveText('Custom');
    await page.reload();
    await expect(shownPreset(page)).toHaveText('Custom');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('large');

    await page.getByRole('combobox', { name: 'Component' }).selectOption('card');
    // Card has product examples, so its preset selector is called Example.
    await expect(page.getByRole('combobox', { name: 'Example' }).locator('option:checked')).toHaveText('Starting values');
    await page.goBack();
    await expect(page.getByRole('combobox', { name: 'Component' })).toHaveValue('button');
    await expect(shownPreset(page)).toHaveText('Custom');

    await page.getByRole('button', { name: 'Reset component props' }).click();
    await expect(shownPreset(page)).toHaveText('Starting values');
    await expect(page.getByRole('combobox', { name: 'size' })).toHaveValue('medium');

    await presetSelect(page).selectOption('Loading');
    await expect(radio(page, 'loading', 'true')).toBeChecked();
    await expect(shownPreset(page)).toHaveText('Loading');
  });

  test('rows keep each prop beside its control on desktop and stack them at 375px without overflow', async ({ page }) => {
    const geometry = () =>
      page.evaluate(() => {
        const header = [...document.querySelectorAll('table[role="table"] th[scope="row"]')].find((cell) => cell.textContent?.startsWith('size'))!;
        const control = header.closest('tr')!.querySelector('select')!;
        const a = header.getBoundingClientRect();
        const b = control.getBoundingClientRect();
        return {
          header: { left: a.left, right: a.right, top: a.top, bottom: a.bottom },
          control: { left: b.left, top: b.top, bottom: b.bottom },
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/playground?component=button');
    await expect(page.getByRole('combobox', { name: 'size' })).toBeVisible();
    const wide = await geometry();
    expect(wide.control.left).toBeGreaterThanOrEqual(wide.header.right - 1);
    expect(wide.control.top).toBeLessThan(wide.header.bottom);
    expect(wide.control.bottom).toBeGreaterThan(wide.header.top);
    expect(wide.overflow).toBe(0);

    await page.setViewportSize({ width: 375, height: 800 });
    await expect.poll(async () => (await geometry()).control.top).toBeGreaterThanOrEqual((await geometry()).header.bottom - 1);
    const narrow = await geometry();
    expect(Math.abs(narrow.control.left - narrow.header.left)).toBeLessThanOrEqual(1);
    expect(narrow.overflow).toBe(0);
  });
});

test.describe('Desktop workbench', () => {
  const panel = (page: Page) => page.getByTestId('preview-panel');

  test('the preview stays in view while the lowest props change it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/playground?component=button');
    for (const prop of ['loading', 'disabled']) {
      await option(page, prop, 'true').click();
      await expect(previewButton(page)).toBeInViewport({ ratio: 1 });
      await expect(radio(page, prop, 'true')).toBeInViewport({ ratio: 1 });
      await option(page, prop, 'false').click();
    }
    await option(page, 'disabled', 'true').click();
    await expect(previewButton(page)).toBeDisabled();
    await expect(previewButton(page)).toBeInViewport({ ratio: 1 });
    await expect(snippet(page)).toContainText('disabled={true}');
    await expect(page).toHaveURL(/p\.disabled=true/);
  });

  test('focus moving back up through the props is never hidden under the preview', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/playground?component=button');
    await page.getByRole('table').first().locator('input, select').last().focus();
    const read = () =>
      page.evaluate(() => {
        const preview = document.querySelector('[data-testid="preview-panel"]')!;
        const active = document.activeElement!;
        const a = active.getBoundingClientRect();
        const p = preview.getBoundingClientRect();
        return { inPreview: preview.contains(active), clear: a.top >= p.bottom - 1 && a.bottom <= innerHeight + 1, name: active.outerHTML.slice(0, 60) };
      });
    for (let step = 0; step < 30; step += 1) {
      if ((await read()).inPreview) break;
      // Scrolling is smooth, so wait for focus scrolling to bring the control fully into view below the preview.
      await expect.poll(async () => (await read()).clear, { message: `step ${step}: ${(await read()).name}` }).toBe(true);
      await page.keyboard.press('Shift+Tab');
    }
    expect((await read()).inPreview).toBe(true);
  });

  test('a tall preview scrolls inside its own capped, keyboard-reachable stage', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/playground?component=stack');
    const stage = page.getByRole('region', { name: 'Stack preview' });
    const size = await stage.evaluate((element) => ({ client: element.clientHeight, scroll: element.scrollHeight, tab: element.tabIndex }));
    expect(size.scroll).toBeGreaterThan(size.client);
    expect(size.client).toBeLessThanOrEqual(600 * 0.4 + 1);
    expect(size.tab).toBe(0);
    await stage.focus();
    await page.keyboard.press('End');
    await expect.poll(() => stage.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    // The page itself still scrolls past the preview.
    await page.mouse.move(640, 500);
    await page.mouse.wheel(0, 2000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('a Dialog opened from the stuck preview closes on Escape and returns focus to its opener', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/playground?component=dialog');
    await option(page, 'dismissOnBackdrop', 'true').click();
    const opener = page.getByRole('button', { name: 'Open dialog' });
    await expect(opener).toBeInViewport();
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(opener).toBeInViewport();
  });

  test('on a phone the preview scrolls away with the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/playground?component=button');
    await expect(panel(page)).toHaveCSS('position', 'static');
  });
});
