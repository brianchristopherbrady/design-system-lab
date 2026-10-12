import { expect, test, type Page } from '@playwright/test';

// Runs the conceptual switch exactly as /decisions/implementation shows it, so the page's claims stay true.
// Accessibility state comes from Chromium's accessibility tree: ElementInternals sets no DOM attributes for role queries to read.

let element = '';
let usage = '';

test.beforeAll(async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: testInfo.project.use.baseURL });
  await page.goto('/decisions/implementation');
  element = (await page.locator('#example code[data-language="js"]').textContent()) ?? '';
  usage = (await page.locator('#example code[data-language="html"]').textContent()) ?? '';
  await page.close();
});

test.skip(({ browserName }) => browserName !== 'chromium', 'Reads the Chromium accessibility tree.');

async function mount(page: Page, html = usage) {
  expect(element).toContain("customElements.define('ds-switch'");
  await page.goto('about:blank');
  // The sketch draws nothing, so give it a box to click.
  await page.setContent(`<style>ds-switch { display: inline-block; inline-size: 2rem; block-size: 1rem; }</style>${html}`);
  await page.addScriptTag({ content: element });
}

async function accessibleSwitch(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  const node = nodes.find((candidate) => candidate.role?.value === 'switch');
  const property = (name: string): unknown => node?.properties?.find((candidate) => candidate.name === name)?.value.value;
  const checked = property('checked');
  return { found: Boolean(node), name: String(node?.name?.value ?? ''), checked: typeof checked === 'string' ? checked : '', disabled: property('disabled') === true };
}

const submitted = (page: Page) =>
  page.evaluate(() => [...new FormData(document.querySelector('form') ?? undefined).entries()].map(([key, value]) => `${key}=${typeof value === 'string' ? value : value.name}`));

test('starts from the checked attribute, takes its name from the label and submits its value', async ({ page }) => {
  await mount(page);
  expect(await accessibleSwitch(page)).toEqual({ found: true, name: 'Email me updates', checked: 'true', disabled: false });
  expect(await submitted(page)).toEqual(['updates=on']);
});

test('toggles from Space and from a label click, firing input then change once each', async ({ page }) => {
  await mount(page);
  await page.evaluate(() => {
    const log: string[] = [];
    Object.assign(window, { log });
    for (const type of ['input', 'change']) document.querySelector('form')?.addEventListener(type, (event) => log.push(event.type));
  });
  const events = () => page.evaluate(() => (window as unknown as { log: string[] }).log.join(','));

  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.localName)).toBe('ds-switch');
  await page.keyboard.press('Space');
  expect((await accessibleSwitch(page)).checked).toBe('false');
  expect(await submitted(page)).toEqual([]);
  expect(await events()).toBe('input,change');

  await page.getByText('Email me updates').click();
  expect((await accessibleSwitch(page)).checked).toBe('true');
  expect(await submitted(page)).toEqual(['updates=on']);
  expect(await events()).toBe('input,change,input,change');
});

test('follows the attribute until the state changes, and reset restores the default', async ({ page }) => {
  await mount(page);
  const setAttribute = (present: boolean) => page.evaluate((on) => document.querySelector('ds-switch')?.toggleAttribute('checked', on), present);

  await setAttribute(false);
  expect((await accessibleSwitch(page)).checked).toBe('false');
  await setAttribute(true);
  expect((await accessibleSwitch(page)).checked).toBe('true');

  await page.getByText('Email me updates').click();
  await setAttribute(false);
  await setAttribute(true);
  expect((await accessibleSwitch(page)).checked).toBe('false');
  expect(await submitted(page)).toEqual([]);

  await page.getByRole('button', { name: 'Reset' }).click();
  expect((await accessibleSwitch(page)).checked).toBe('true');
  expect(await submitted(page)).toEqual(['updates=on']);
});

test('adds its listeners once, so a moved element still fires one change per click', async ({ page }) => {
  await mount(page);
  const changes = await page.evaluate(() => {
    const control = document.querySelector('ds-switch');
    const form = document.querySelector('form');
    if (!(control instanceof HTMLElement) || !form) return -1;
    let count = 0;
    control.addEventListener('change', () => (count += 1));
    document.body.append(control);
    form.prepend(control);
    control.click();
    return count;
  });
  expect(changes).toBe(1);
});

for (const [label, html] of [
  ['the element', () => usage.replace('<ds-switch ', '<ds-switch disabled ')],
  ['a fieldset', () => usage.replace('<form>', '<form><fieldset disabled>').replace('</form>', '</fieldset></form>')],
] as const) {
  test(`is skipped when disabled through ${label}`, async ({ page }) => {
    await mount(page, html());
    expect(await accessibleSwitch(page)).toMatchObject({ checked: 'true', disabled: true });
    expect(await submitted(page)).toEqual([]);

    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.localName)).not.toBe('ds-switch');

    const box = await page.locator('ds-switch').boundingBox();
    if (!box) throw new Error('The switch has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.evaluate(() => document.querySelector<HTMLElement>('ds-switch')?.click());
    expect((await accessibleSwitch(page)).checked).toBe('true');
  });
}
