import { expect, test, type Locator, type Page } from '@playwright/test';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Waits for the track and thumb transitions to finish, then reads both boxes in one frame. */
async function geometry(input: Locator): Promise<{ track: Box; thumb: Box }> {
  await input.scrollIntoViewIfNeeded();
  await input.evaluate(async (element) => {
    const track = element.nextElementSibling;
    await Promise.all((track?.getAnimations({ subtree: true }) ?? []).map((animation) => animation.finished));
  });
  const read = () =>
    input.evaluate((element) => {
      const box = (node: Element | null | undefined) => {
        const { x, y, width, height } = node?.getBoundingClientRect() ?? new DOMRect();
        return { x, y, width, height };
      };
      const track = element.nextElementSibling;
      return { track: box(track), thumb: box(track?.firstElementChild) };
    });
  // Smooth scrolling may still be moving the page; wait until two reads agree.
  let previous = await read();
  await expect
    .poll(async () => {
      const next = await read();
      const stable = JSON.stringify(next) === JSON.stringify(previous);
      previous = next;
      return stable;
    })
    .toBe(true);
  return previous;
}

/** A real mouse click on the visible part, at a fraction of its width. */
async function clickPart(page: Page, input: Locator, part: 'thumb' | 'track', xFraction = 0.5) {
  const box = (await geometry(input))[part];
  await page.mouse.click(box.x + box.width * xFraction, box.y + box.height / 2);
}

/** Where the thumb rests: on the end side of the track when on, the start side when off. */
async function thumbSide(input: Locator) {
  const { track, thumb } = await geometry(input);
  return thumb.x + thumb.width / 2 > track.x + track.width / 2 ? 'on' : 'off';
}

/** Counts native change events from now on. */
async function countChanges(input: Locator) {
  await input.evaluate((element) => {
    const counted = element as HTMLInputElement & { changes?: number };
    counted.changes = 0;
    element.addEventListener('change', () => {
      counted.changes = (counted.changes ?? 0) + 1;
    });
  });
  return () => input.evaluate((element) => (element as HTMLInputElement & { changes?: number }).changes ?? 0);
}

async function expectState(input: Locator, changes: () => Promise<number>, on: boolean, count: number) {
  if (on) await expect(input).toBeChecked();
  else await expect(input).not.toBeChecked();
  expect(await thumbSide(input)).toBe(on ? 'on' : 'off');
  expect(await changes()).toBe(count);
}

/** Compact density exists only in scoped previews, so that mode uses the Playground's Switch story. */
const modes = [
  { name: 'light, comfortable', theme: 'light', path: '/components/switch', forcedColors: 'none' },
  { name: 'dark, compact', theme: 'dark', path: '/playground?component=switch&v=1&preview.density=compact', forcedColors: 'none' },
  { name: 'forced colors', theme: 'light', path: '/components/switch', forcedColors: 'active' },
] as const;

test.describe('Switch pointer interaction', () => {
  for (const mode of modes) {
    test.describe(mode.name, () => {
      test.use({ forcedColors: mode.forcedColors });

      test('the thumb and the track toggle in both states, once per click', async ({ page }) => {
        await page.addInitScript((theme) => localStorage.setItem('system-lab:theme', theme), mode.theme);
        await page.goto(mode.path);
        // A controlled switch: it only stays toggled if its change callback updates state.
        const input = page.getByRole('main').getByRole('switch', { name: 'Compact rows' });
        const changes = await countChanges(input);
        await expectState(input, changes, false, 0);

        await clickPart(page, input, 'thumb');
        await expectState(input, changes, true, 1);
        await clickPart(page, input, 'thumb');
        await expectState(input, changes, false, 2);

        // The far end of the track, away from the thumb in each state.
        await clickPart(page, input, 'track', 0.85);
        await expectState(input, changes, true, 3);
        await clickPart(page, input, 'track', 0.15);
        await expectState(input, changes, false, 4);
      });
    });
  }

  test('label clicks and Space toggle once each', async ({ page }) => {
    await page.goto('/components/switch');
    const input = page.getByRole('main').getByRole('switch', { name: 'Compact rows' });
    const label = page.getByRole('main').locator('label', { hasText: 'Compact rows' });
    const changes = await countChanges(input);

    await label.click();
    await expectState(input, changes, true, 1);
    await label.click();
    await expectState(input, changes, false, 2);

    await input.focus();
    await page.keyboard.press('Space');
    await expectState(input, changes, true, 3);
    await page.keyboard.press('Space');
    await expectState(input, changes, false, 4);
    await expect(input).toBeFocused();
  });

  test('a disabled switch ignores pointer and keyboard attempts, on or off', async ({ page }) => {
    await page.goto('/playground?component=switch');
    const preview = page.getByTestId('playground-preview');
    const input = preview.getByRole('switch', { name: 'Compact rows' });
    const disabled = (value: 'false' | 'true') => page.getByRole('radiogroup', { name: 'disabled' }).getByRole('radio', { name: value });
    const changes = await countChanges(input);

    const attempt = async () => {
      await clickPart(page, input, 'thumb');
      await clickPart(page, input, 'track', 0.85);
      await clickPart(page, input, 'track', 0.15);
      const label = (await preview.locator('label', { hasText: 'Compact rows' }).boundingBox())!;
      await page.mouse.click(label.x + label.width / 2, label.y + label.height / 2);
      // Leave nothing focused, so Space can only reach the disabled switch.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await input.focus();
      await page.keyboard.press('Space');
      await expect(input).not.toBeFocused();
    };

    await disabled('true').click();
    await expect(input).toBeDisabled();
    await attempt();
    await expectState(input, changes, false, 0);

    // Turn it on while enabled, then disable it again.
    await disabled('false').click();
    await expect(input).toBeEnabled();
    await clickPart(page, input, 'thumb');
    await expectState(input, changes, true, 1);
    await disabled('true').click();
    await expect(input).toBeDisabled();
    await attempt();
    await expectState(input, changes, true, 1);
  });
});

test.describe('Playground switches', () => {
  test('Show query containers turns on and off from its switch graphic', async ({ page }) => {
    await page.goto('/playground?component=button');
    await page.locator('summary', { hasText: 'Preview settings' }).click();
    const outlines = page.getByRole('switch', { name: 'Show query containers' });
    await clickPart(page, outlines, 'thumb');
    await expect(page.getByTestId('container-summary')).toBeVisible();
    await clickPart(page, outlines, 'thumb');
    await expect(page.getByTestId('container-summary')).toBeHidden();
    await clickPart(page, outlines, 'track', 0.85);
    await expect(page.getByTestId('container-summary')).toBeVisible();
    await clickPart(page, outlines, 'track', 0.15);
    await expect(page.getByTestId('container-summary')).toBeHidden();
  });
});
