import { describe, expect, it } from 'vitest';
import { playgroundStories } from '@/content/components';
import {
  decodePreview,
  defaultPreview,
  initialValues,
  parseSearch,
  toSearchParams,
  withCapturedAppearance,
  type PlaygroundConfig,
} from '@/features/playground';

const story = (id: string) => {
  const found = playgroundStories.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No story ${id}`);
  return found;
};
const roundTrip = (config: PlaygroundConfig) => parseSearch(toSearchParams(config, story(config.component)), playgroundStories, 'button');

describe('playground configuration', () => {
  it('round-trips explicit values, false, unset props and the preview', () => {
    const config: PlaygroundConfig = {
      component: 'button',
      props: { ...initialValues(story('button')), size: 'large', border: 'thick', fullWidth: true, radius: 'full', iconStart: 'star' },
      preview: { product: 'patient', theme: 'dark', density: 'compact', width: 320, outlines: true },
    };
    expect(roundTrip(config)).toEqual({ kind: 'configured', config });

    const scope: PlaygroundConfig = { component: 'theme-scope', props: { product: undefined, theme: 'dark', density: undefined }, preview: defaultPreview };
    expect(roundTrip(scope)).toEqual({ kind: 'configured', config: scope });

    const dialog = story('dialog');
    const closed = { ...initialValues(dialog), dismissOnBackdrop: false };
    expect(roundTrip({ component: 'dialog', props: closed, preview: defaultPreview })).toEqual({
      kind: 'configured',
      config: { component: 'dialog', props: closed, preview: defaultPreview },
    });
  });

  it('keeps text with spaces, punctuation, quotes and Unicode intact', () => {
    const children = 'Save & “publish” — 50% off? #1 <b> naïve 🚀';
    const config: PlaygroundConfig = { component: 'button', props: { ...initialValues(story('button')), children }, preview: defaultPreview };
    const parsed = roundTrip(config);
    expect(parsed.kind === 'configured' && parsed.config.props.children).toBe(children);
  });

  it('writes only props that differ from the story, so the default example has a short URL', () => {
    const search = toSearchParams({ component: 'button', props: initialValues(story('button')), preview: defaultPreview }, story('button'));
    expect(search.toString()).toBe('component=button&v=1');
  });

  it('ignores unknown props and invalid values, keeping the story values for them', () => {
    const parsed = parseSearch(
      new URLSearchParams('component=button&v=1&p.size=huge&p.fullWidth=yes&p.iconStart=rocket&p.onClick=alert(1)&p.border=thick'),
      playgroundStories,
      'button',
    );
    expect(parsed).toEqual({
      kind: 'configured',
      config: { component: 'button', props: { ...initialValues(story('button')), border: 'thick' }, preview: defaultPreview },
    });
  });

  it('accepts unset only where a prop may be unset', () => {
    const parsed = parseSearch(new URLSearchParams('component=button&v=1&p.appearance=&p.radius='), playgroundStories, 'button');
    expect(parsed.kind === 'configured' && parsed.config.props.appearance).toBe('secondary');
    expect(parsed.kind === 'configured' && parsed.config.props.radius).toBeUndefined();
  });

  it('falls back for invalid preview values and widths', () => {
    expect(decodePreview(new URLSearchParams('preview.product=acme&preview.theme=sepia&preview.width=12&preview.outlines=yes'))).toEqual(defaultPreview);
    expect(decodePreview(new URLSearchParams('preview.width=99999')).width).toBeNull();
    expect(decodePreview(new URLSearchParams('preview.width=3.5e2')).width).toBeNull();
    expect(decodePreview(new URLSearchParams('preview.width=600')).width).toBe(600);
  });

  it('keeps only the component for missing or unsupported versions, and falls back to Button for unknown ones', () => {
    expect(parseSearch(new URLSearchParams('component=card'), playgroundStories, 'button')).toEqual({ kind: 'component', component: 'card' });
    expect(parseSearch(new URLSearchParams('component=card&v=9&p.padding=small'), playgroundStories, 'button')).toEqual({ kind: 'component', component: 'card' });
    expect(parseSearch(new URLSearchParams('component=nope'), playgroundStories, 'button')).toEqual({ kind: 'component', component: 'button' });
    const unknown = parseSearch(new URLSearchParams('component=nope&v=1&p.size=large&preview.theme=dark'), playgroundStories, 'button');
    expect(unknown).toEqual({
      kind: 'configured',
      config: { component: 'button', props: initialValues(story('button')), preview: { ...defaultPreview, theme: 'dark' } },
    });
  });

  it('captures the inherited theme for a shared link, and leaves product, density and props alone', () => {
    const scope: PlaygroundConfig = { component: 'theme-scope', props: { product: undefined, theme: undefined, density: undefined }, preview: { ...defaultPreview, width: 320 } };
    const captured = withCapturedAppearance(scope, { product: 'system-lab', theme: 'dark', density: 'comfortable' });
    expect(captured.preview).toEqual({ product: 'inherit', theme: 'dark', density: 'inherit', width: 320, outlines: false });
    expect(withCapturedAppearance({ ...scope, preview: { ...scope.preview, theme: 'light' } }, { product: 'system-lab', theme: 'dark', density: 'comfortable' }).preview.theme).toBe('light');
    expect(captured.props).toEqual(scope.props);
  });

  it('gives the Card and Dialog product examples their own profile and density, and no other story any', () => {
    const scoped = playgroundStories.flatMap((candidate) => candidate.presets.filter((preset) => preset.scope).map((preset) => [candidate.id, preset.scope?.product, preset.scope?.density]));
    expect(scoped).toEqual([
      ['card', 'patient', 'comfortable'],
      ['card', 'provider', 'compact'],
      ['dialog', 'patient', 'comfortable'],
      ['dialog', 'provider', 'compact'],
    ]);
  });

  it('opens links that use the previous product context names', () => {
    expect(decodePreview(new URLSearchParams('preview.product=harbor')).product).toBe('provider');
    expect(decodePreview(new URLSearchParams('preview.product=meadow')).product).toBe('patient');
    expect(decodePreview(new URLSearchParams('preview.product=constructor')).product).toBe('inherit');
    const parsed = parseSearch(new URLSearchParams('component=theme-scope&v=1&p.product=meadow'), playgroundStories, 'button');
    expect(parsed.kind === 'configured' && parsed.config.props.product).toBe('patient');
  });
});
