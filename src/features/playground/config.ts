import { iconNames, type IconName } from '@/design-system/primitives';
import {
  densityNames,
  productNames,
  themeNames,
  type DensityName,
  type ModifierInput,
  type ProductName,
  type ThemeName,
} from '@/design-system/tokens';
import { initialValues } from './engine';
import type { AnyControl, AnyStory, ControlValue, ControlValues } from './types';

/** Bump when the meaning of the parameters changes; older payloads are then ignored. */
export const configVersion = '1';

export const inherit = 'inherit';
export type Inheritable<T extends string> = T | typeof inherit;

export const previewWidth = { min: 240, max: 1280 } as const;
const maxTextLength = 500;

/** Product contexts renamed when the examples became a patient app and a provider workspace, so old links still resolve. */
const renamedProducts: Readonly<Record<string, ProductName>> = { harbor: 'provider', meadow: 'patient' };
const currentProductName = (raw: string | null) => (raw !== null && Object.hasOwn(renamedProducts, raw) ? (renamedProducts[raw] ?? raw) : raw);

/** The example's environment. None of it reaches the component's props or the usage code. */
export interface PreviewSettings {
  product: Inheritable<ProductName>;
  theme: Inheritable<ThemeName>;
  density: Inheritable<DensityName>;
  /** Requested width in CSS pixels, or null to fill the available space. */
  width: number | null;
  /** Outline the query containers inside the preview. */
  outlines: boolean;
}

export const defaultPreview: PreviewSettings = { product: inherit, theme: inherit, density: inherit, width: null, outlines: false };

/** Everything needed to reproduce one Playground example. */
export interface PlaygroundConfig {
  component: string;
  /** One value per control of the selected story; `undefined` means the prop is unset. */
  props: ControlValues;
  preview: PreviewSettings;
}

const keys = { component: 'component', version: 'v', prop: 'p.', preview: 'preview.' } as const;

/* ------------------------------------------------------------------ props */

/** A control value as text: unset select and icon controls become the empty string. */
function encodeValue(control: AnyControl, value: ControlValue): string {
  if (control.kind === 'switch') return String(Boolean(value));
  return value === undefined ? '' : String(value);
}

const invalid = Symbol('invalid');

/** Reads one value against its control, or reports it invalid so the caller keeps its fallback. */
function decodeValue(control: AnyControl, raw: string): ControlValue | typeof invalid {
  switch (control.kind) {
    case 'switch':
      return raw === 'true' ? true : raw === 'false' ? false : invalid;
    case 'text':
      return raw.length <= maxTextLength ? raw : invalid;
    case 'icon':
      if (raw === '') return undefined;
      return iconNames.includes(raw as IconName) ? raw : invalid;
    case 'select': {
      if (raw === '') return control.unsetLabel !== undefined || control.defaultValue === undefined ? undefined : invalid;
      const option = control.options.find((candidate) => String(candidate) === raw);
      return option === undefined ? invalid : option;
    }
  }
}

/** Props that differ from the story's initial values, keyed `p.<prop>`. */
export function encodeProps(story: AnyStory, values: ControlValues): [string, string][] {
  const initial = initialValues(story);
  return story.controls
    .filter((control) => values[control.prop] !== initial[control.prop])
    .map((control) => [`${keys.prop}${control.prop}`, encodeValue(control, values[control.prop])]);
}

/** The story's initial values with every valid `p.<prop>` applied. Unknown props and invalid values are ignored. */
export function decodeProps(story: AnyStory, params: URLSearchParams): ControlValues {
  const values = initialValues(story);
  for (const control of story.controls) {
    const stored = params.get(`${keys.prop}${control.prop}`);
    // ThemeScope's product prop takes product context names, which old links may spell the previous way.
    const raw = control.prop === 'product' ? currentProductName(stored) : stored;
    if (raw === null) continue;
    const value = decodeValue(control, raw);
    if (value !== invalid) values[control.prop] = value;
  }
  return values;
}

/* ---------------------------------------------------------------- preview */

const oneOf = <T extends string>(allowed: readonly T[], raw: string | null): Inheritable<T> =>
  allowed.includes(raw as T) ? (raw as T) : inherit;

export function encodePreview(preview: PreviewSettings): [string, string][] {
  const entries: [string, string][] = [];
  if (preview.product !== inherit) entries.push([`${keys.preview}product`, preview.product]);
  if (preview.theme !== inherit) entries.push([`${keys.preview}theme`, preview.theme]);
  if (preview.density !== inherit) entries.push([`${keys.preview}density`, preview.density]);
  if (preview.width !== null) entries.push([`${keys.preview}width`, String(preview.width)]);
  if (preview.outlines) entries.push([`${keys.preview}outlines`, '1']);
  return entries;
}

export function decodePreview(params: URLSearchParams): PreviewSettings {
  const raw = params.get(`${keys.preview}width`);
  const width = raw !== null && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return {
    product: oneOf(productNames, currentProductName(params.get(`${keys.preview}product`))),
    theme: oneOf(themeNames, params.get(`${keys.preview}theme`)),
    density: oneOf(densityNames, params.get(`${keys.preview}density`)),
    width: width >= previewWidth.min && width <= previewWidth.max ? width : null,
    outlines: params.get(`${keys.preview}outlines`) === '1',
  };
}

/* ----------------------------------------------------------- whole config */

export function toSearchParams(config: PlaygroundConfig, story: AnyStory): URLSearchParams {
  return new URLSearchParams([
    [keys.component, config.component],
    [keys.version, configVersion],
    ...encodeProps(story, config.props),
    ...encodePreview(config.preview),
  ]);
}

export type ParsedConfig =
  /** The URL carries a supported configuration: it wins over anything remembered. */
  | { kind: 'configured'; config: PlaygroundConfig }
  /** No usable configuration, only (perhaps) a component. Remembered drafts may fill the rest. */
  | { kind: 'component'; component: string };

/**
 * Reads the URL. A supported version is applied value by value, keeping fallbacks for anything
 * invalid; an unsupported or missing version keeps only a valid component selection.
 */
export function parseSearch(search: URLSearchParams, stories: readonly AnyStory[], fallbackId: string): ParsedConfig {
  const requested = search.get(keys.component);
  const story = stories.find((candidate) => candidate.id === requested);
  if (search.get(keys.version) !== configVersion) return { kind: 'component', component: story?.id ?? fallbackId };
  const fallback = stories.find((candidate) => candidate.id === fallbackId);
  const chosen = story ?? fallback;
  if (!chosen) return { kind: 'component', component: fallbackId };
  return {
    kind: 'configured',
    config: {
      component: chosen.id,
      // Props written for an unknown component are not applied to the fallback.
      props: story ? decodeProps(chosen, search) : initialValues(chosen),
      preview: decodePreview(search),
    },
  };
}

/**
 * The same example with the preview's inherited product, theme and density written out, so a
 * visitor with other site settings sees what the author saw. Component props stay as they are.
 */
export function withCapturedAppearance(config: PlaygroundConfig, site: ModifierInput): PlaygroundConfig {
  const { product, theme, density } = config.preview;
  return {
    ...config,
    preview: {
      ...config.preview,
      product: product === inherit ? site.product : product,
      theme: theme === inherit ? site.theme : theme,
      density: density === inherit ? site.density : density,
    },
  };
}
