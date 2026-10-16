import {
  apcaContrast,
  deltaEOK,
  hexToRgb,
  maxChroma,
  oklchToRgb,
  rgbToHex,
  rgbToOklch,
  simulateVision,
  visionTypes,
  wcagContrast,
  type Vision,
} from './color';

export const rampSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975] as const;
export type RampStep = (typeof rampSteps)[number];
export type Ramp = Record<RampStep, string>;

/** OKLCH lightness per step: perceptually even, unlike HSL lightness. */
const lightness: Record<RampStep, number> = {
  50: 0.975, 100: 0.945, 200: 0.895, 300: 0.82, 400: 0.725, 500: 0.64,
  600: 0.555, 700: 0.48, 800: 0.405, 900: 0.34, 950: 0.255, 975: 0.2,
};
/** Chroma relative to the brand color: muted at the extremes, full in the middle. */
const chromaScale: Record<RampStep, number> = {
  50: 0.12, 100: 0.24, 200: 0.48, 300: 0.74, 400: 0.92, 500: 1,
  600: 1, 700: 0.94, 800: 0.84, 900: 0.74, 950: 0.58, 975: 0.5,
};

const baseOf = (brand: string) => {
  const base = rgbToOklch(hexToRgb(brand));
  return { hue: base.h, chroma: Math.max(base.c, 0.02) };
};

/** A 12-step ramp at fixed OKLCH lightness, keeping the brand's hue and gamut-mapping its chroma. */
export function generateRamp(brand: string): Ramp {
  const { hue, chroma } = baseOf(brand);
  return Object.fromEntries(
    rampSteps.map((step) => [step, rgbToHex(oklchToRgb({ l: lightness[step], c: chroma * chromaScale[step], h: hue }))]),
  ) as Ramp;
}

export interface RampStepInfo {
  step: RampStep;
  hex: string;
  /** OKLCH lightness and chroma of the delivered 8-bit color. */
  l: number;
  c: number;
  /** Chroma the step asked for before gamut mapping. */
  requested: number;
  /** The most chroma sRGB can show at this step's lightness and hue. */
  ceiling: number;
  /** True when sRGB could not show the requested chroma and the reduction is large enough to see. */
  reduced: boolean;
}

/** Half a just-noticeable difference: smaller chroma reductions are not worth reporting. */
const visibleReduction = 0.01;

/** What each step asked for, what it got, and the sRGB limit in between. */
export function analyzeRamp(brand: string, ramp: Ramp): RampStepInfo[] {
  const { hue, chroma } = baseOf(brand);
  return rampSteps.map((step) => {
    const delivered = rgbToOklch(hexToRgb(ramp[step]));
    const requested = chroma * chromaScale[step];
    const ceiling = maxChroma(lightness[step], hue);
    return { step, hex: ramp[step], l: delivered.l, c: delivered.c, requested, ceiling, reduced: requested - ceiling > visibleReduction };
  });
}

const hueFamilies: readonly (readonly [number, string])[] = [
  [20, 'rose'], [45, 'red'], [70, 'orange'], [100, 'amber'], [125, 'yellow'], [160, 'green'],
  [190, 'teal'], [230, 'cyan'], [280, 'blue'], [310, 'violet'], [350, 'magenta'], [360, 'rose'],
];

/** A plain name for the color's OKLCH hue family, or "neutral" when it has too little chroma to read as a hue. */
export function hueName(hex: string): string {
  const { c, h } = rgbToOklch(hexToRgb(hex));
  if (c < 0.05) return 'neutral';
  return hueFamilies.find(([limit]) => h < limit)?.[1] ?? 'rose';
}

export const brandRoles = ['strong', 'stronger', 'strongest', 'on-strong', 'text', 'subtle', 'border'] as const;
export type BrandRole = (typeof brandRoles)[number];
export type BrandRoles = Record<BrandRole, RampStep>;

export interface SurfaceSet {
  canvas: string;
  panel: string;
  sunken: string;
}

export interface ContrastCheck {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  /** APCA Lc, informative. */
  apca: number;
  minimum: number;
  pass: boolean;
}

const darker: RampStep[] = [500, 600, 700, 800, 900, 950, 975];
const lighter: RampStep[] = [500, 400, 300, 200, 100, 50];
const next = (order: RampStep[], step: RampStep, by = 1) => order[Math.min(order.indexOf(step) + by, order.length - 1)] ?? step;

/** The first candidate that satisfies every requirement, or the last candidate (whose checks will then fail visibly). */
function pick(candidates: RampStep[], ok: (step: RampStep) => boolean): RampStep {
  return candidates.find(ok) ?? (candidates.at(-1) as RampStep);
}

/**
 * Chooses ramp steps for each brand role by contrast, not by taste: the first step from an
 * ordered preference list that passes WCAG 2 against the theme's real surfaces. Returns the
 * roles and every check, so the result is auditable.
 */
export function assignRoles(ramp: Ramp, theme: 'light' | 'dark', surfaces: SurfaceSet): { roles: BrandRoles; checks: ContrastCheck[] } {
  const all = [surfaces.canvas, surfaces.panel, surfaces.sunken];
  const passes = (foreground: string, backgrounds: string[], minimum: number) =>
    backgrounds.every((background) => wcagContrast(foreground, background) >= minimum);

  const light = theme === 'light';
  const onStrong: RampStep = light ? 50 : 975;
  const subtle: RampStep = light ? 50 : 975;
  const strong = pick(light ? [600, 700, 800, 900] : [300, 400, 200, 500], (step) =>
    passes(ramp[onStrong], [ramp[step]], 4.5) && passes(ramp[step], [surfaces.canvas], 3),
  );
  const order = light ? darker : lighter;
  const roles: BrandRoles = {
    strong,
    stronger: next(order, strong),
    strongest: next(order, strong, 2),
    'on-strong': onStrong,
    subtle,
    text: pick(light ? [700, 600, 800, 900, 950] : [300, 200, 400, 100, 50], (step) => passes(ramp[step], [...all, ramp[subtle]], 4.5)),
    border: pick(light ? [500, 600, 700, 800] : [500, 400, 600, 300], (step) => passes(ramp[step], [surfaces.canvas, surfaces.panel], 3)),
  };

  const check = (label: string, foreground: string, background: string, minimum: number): ContrastCheck => {
    const ratio = wcagContrast(foreground, background);
    return { label, foreground, background, ratio, apca: apcaContrast(foreground, background), minimum, pass: ratio >= minimum };
  };
  const color = (role: BrandRole) => ramp[roles[role]];
  const checks = [
    check('Label on strong (primary button)', color('on-strong'), color('strong'), 4.5),
    check('Label on stronger (hover)', color('on-strong'), color('stronger'), 4.5),
    check('Label on strongest (pressed)', color('on-strong'), color('strongest'), 4.5),
    check('Text on canvas', color('text'), surfaces.canvas, 4.5),
    check('Text on panel', color('text'), surfaces.panel, 4.5),
    check('Text on sunken', color('text'), surfaces.sunken, 4.5),
    check('Text on subtle', color('text'), color('subtle'), 4.5),
    check('Border on canvas', color('border'), surfaces.canvas, 3),
    check('Border on panel', color('border'), surfaces.panel, 3),
    check('Strong on canvas (non-text)', color('strong'), surfaces.canvas, 3),
  ];
  return { roles, checks };
}

const srgbComponents = (hex: string) => hexToRgb(hex).map((channel) => Math.round(channel * 10000) / 10000);

const dtcgColor = (hex: string) => ({ $value: { colorSpace: 'srgb', components: srgbComponents(hex), hex } });

/** Opacity of the halo around the signal indicator, matching the system's own glow colors. */
const glowAlpha = { light: 0.28, dark: 0.55 } as const;

/** The signal halo for a theme: the brand border step, translucent. */
export const glowColor = (hex: string, theme: 'light' | 'dark') =>
  `rgb(${hexToRgb(hex)
    .map((channel) => Math.round(channel * 255))
    .join(' ')} / ${glowAlpha[theme]})`;

export const statusTones = ['danger', 'warning', 'success', 'info'] as const;
export type StatusTone = (typeof statusTones)[number];

/** Below this OKLab distance two solid fills are flagged as easy to mistake for each other. A heuristic, not a standard. */
export const closeDistance = 0.1;

/** Two decimals, rounded down, so a displayed value never contradicts the threshold. */
export const formatDistance = (distance: number) => (Math.floor(distance * 100) / 100).toFixed(2);

export interface StatusCheck {
  tone: StatusTone;
  vision: Vision;
  /** Both fills as they appear with this vision. */
  brand: string;
  status: string;
  distance: number;
  close: boolean;
}

/**
 * Compares the brand's strong fill with each status fill, with typical vision and three simulated
 * dichromacies. A brand that looks like danger makes primary actions read as destructive.
 */
export function compareWithStatus(brand: string, statuses: Record<StatusTone, string>): StatusCheck[] {
  return statusTones.flatMap((tone) =>
    visionTypes.map((vision) => {
      const seenBrand = simulateVision(brand, vision);
      const seenStatus = simulateVision(statuses[tone], vision);
      const distance = deltaEOK(seenBrand, seenStatus);
      return { tone, vision, brand: seenBrand, status: seenStatus, distance, close: distance < closeDistance };
    }),
  );
}

export const shapeNames = ['machined', 'tight', 'pill'] as const;
export type ShapeName = (typeof shapeNames)[number];
export const shapedComponents = ['control', 'badge', 'card', 'dialog'] as const;
export type ShapedComponent = (typeof shapedComponents)[number];
export type RadiusStep = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface Shape {
  label: string;
  description: string;
  /** The radius token each shaped component uses. */
  radii: Record<ShapedComponent, RadiusStep>;
  /** Phrase for the product profile's overrides sentence. */
  summary: string;
}

/** Corner sets a product can choose. Machined is the system's own, so choosing it exports no shape overrides. */
export const shapes: Record<ShapeName, Shape> = {
  machined: {
    label: 'Machined',
    description: 'The system default. Inherited, so nothing is exported.',
    radii: { control: 'md', badge: 'sm', card: 'lg', dialog: 'xl' },
    summary: 'shape inherited from the system',
  },
  tight: {
    label: 'Tight',
    description: 'Crisp corners for dense, all-day tools, as in the provider workspace.',
    radii: { control: 'sm', badge: 'sm', card: 'md', dialog: 'md' },
    summary: 'tighter corners on controls, badges, cards and dialogs',
  },
  pill: {
    label: 'Pill',
    description: 'Pill controls and badges with soft cards.',
    radii: { control: 'full', badge: 'full', card: 'xl', dialog: 'xl' },
    summary: 'pill-shaped controls and badges, soft extra-large card corners',
  },
};

const idPattern = /^[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

/** Why an id cannot become a product context, or undefined when it can. */
export function productIdProblem(id: string, existing: readonly string[]): string | undefined {
  if (id === '') return 'Enter an id for the product.';
  if (!idPattern.test(id)) return 'Use lowercase letters, numbers and single hyphens, starting with a letter.';
  if (id.length > 32) return 'Use 32 characters or fewer.';
  if (existing.includes(id)) return `“${id}” is already a product. Choose a new id.`;
  return undefined;
}

/** "night-shift" → "Night Shift" */
export const productNameOf = (id: string) =>
  id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export interface ProductSpec {
  id: string;
  brand: string;
  shape: ShapeName;
  ramp: Ramp;
  roles: Record<'light' | 'dark', BrandRoles>;
}

export interface ExportFile {
  /** Stable key for tabs and tests. */
  key: 'product' | 'ramp' | 'light' | 'dark' | 'resolver' | 'profile';
  label: string;
  /** Repository path the content belongs in. */
  path: string;
  /** create: a new file. merge: an object to merge into an existing file. */
  action: 'create' | 'merge';
  /** Name used when the content is downloaded. */
  filename: string;
  content: string;
}

const tokenSource = 'src/design-system/tokens/source';

/**
 * Everything a new product needs, in the shape of the repository's own files: the ramp, brand roles
 * per theme, the product context (brand roles and, unless inherited, shape), the resolver entry and
 * the profile TypeScript requires for every product.
 */
export function exportProduct({ id, brand, shape, ramp, roles }: ProductSpec): ExportFile[] {
  const name = productNameOf(id);
  const glowName = (theme: 'light' | 'dark') => `${id}-glow${theme === 'light' ? '-soft' : ''}`;
  const glow = (theme: 'light' | 'dark') => ({
    $value: { colorSpace: 'srgb', components: srgbComponents(ramp[roles[theme].border]), alpha: glowAlpha[theme] },
    $description: `Halo around ${name}’s signal indicator on ${theme} surfaces.`,
  });
  const brandFile = (theme: 'light' | 'dark') => ({
    brand: {
      $type: 'color',
      [id]: {
        ...Object.fromEntries(brandRoles.map((role) => [role, { $value: `{color.${id}.${roles[theme][role]}}` }])),
        glow: { $value: `{color.${glowName(theme)}}` },
      },
    },
  });
  const ref = (role: BrandRole) => ({ $value: `{brand.${id}.${role}}` });
  const radius = (component: ShapedComponent) => ({ radius: { $value: `{radius.${shapes[shape].radii[component]}}` } });
  const shaped = shape === 'machined' ? {} : Object.fromEntries(shapedComponents.map((component) => [component, radius(component)]));
  const product = {
    $description: `${name}: generated by the theme studio from ${brand}. Overrides only brand roles${shape === 'machined' ? '' : ' and shape'}; everything else is inherited.`,
    action: {
      primary: { background: ref('strong'), hover: ref('stronger'), active: ref('strongest'), foreground: ref('on-strong'), border: ref('strong') },
    },
    text: { link: ref('text') },
    focus: { ring: ref('border') },
    surface: { accent: ref('subtle') },
    signal: { current: ref('border'), glow: { $value: `{brand.${id}.glow}` } },
    tone: { brand: { text: ref('text'), surface: ref('subtle'), border: ref('border'), solid: ref('strong'), 'on-solid': ref('on-strong') } },
    ...shaped,
  };
  const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
  // Integer-like keys always serialize first, so the group description is spliced in ahead of the steps.
  const ramps = json({
    color: {
      $type: 'color',
      [id]: Object.fromEntries(rampSteps.map((step) => [step, dtcgColor(ramp[step])])),
      [glowName('dark')]: glow('dark'),
      [glowName('light')]: glow('light'),
    },
  }).replace(
    `"${id}": {\n`,
    `"${id}": {\n      "$description": ${JSON.stringify(`${name} product ramp, generated from ${brand} at fixed OKLCH lightness.`)},\n`,
  );
  const resolver = { modifiers: { product: { contexts: { [id]: [{ $ref: `product.${id}.tokens.json` }] } } } };
  const key = /^[a-z][a-z0-9]*$/.test(id) ? id : `'${id}'`;
  const overrides = `${hueName(brand).replace(/^./, (letter) => letter.toUpperCase())} brand roles, ${shapes[shape].summary}.`;
  const profile = [
    `  ${key}: {`,
    `    id: '${id}',`,
    `    name: '${name}',`,
    `    audience: 'Who ${name} serves, in one sentence.',`,
    `    overrides: '${overrides}',`,
    '  },',
  ].join('\n');
  return [
    { key: 'product', label: 'Product', path: `${tokenSource}/product.${id}.tokens.json`, action: 'create', filename: `product.${id}.tokens.json`, content: json(product) },
    { key: 'ramp', label: 'Ramp', path: `${tokenSource}/reference.modes.tokens.json`, action: 'merge', filename: `${id}.ramp.json`, content: ramps },
    { key: 'light', label: 'Light roles', path: `${tokenSource}/brands.light.tokens.json`, action: 'merge', filename: `${id}.brands.light.json`, content: json(brandFile('light')) },
    { key: 'dark', label: 'Dark roles', path: `${tokenSource}/brands.dark.tokens.json`, action: 'merge', filename: `${id}.brands.dark.json`, content: json(brandFile('dark')) },
    { key: 'resolver', label: 'Resolver', path: `${tokenSource}/system-lab.resolver.json`, action: 'merge', filename: `${id}.resolver.json`, content: json(resolver) },
    { key: 'profile', label: 'Profile', path: 'src/domain/system/products.ts', action: 'merge', filename: `${id}.profile.ts`, content: `${profile}\n` },
  ];
}
