import { describe, expect, it } from 'vitest';
import { inLane, productNames } from '@/design-system/tokens';
import { tokenManifest } from '@/design-system/tokens/manifest';
import {
  analyzeRamp,
  assignRoles,
  closeDistance,
  compareWithStatus,
  exportProduct,
  generateRamp,
  hueName,
  productIdProblem,
  productNameOf,
  rampSteps,
  shapedComponents,
  shapeNames,
  shapes,
} from './brand';
import { apcaContrast, deltaEOK, hexToRgb, maxChroma, oklchToRgb, parseHex, rgbToHex, rgbToOklch, simulateVision, wcagContrast } from './color';
import { studioPresets } from './useThemeStudio';

const lightSurfaces = { canvas: '#ffffff', panel: '#f8f9fa', sunken: '#eef0f2' };
const darkSurfaces = { canvas: '#0b0c0e', panel: '#141518', sunken: '#1c1e22' };

describe('color math', () => {
  it('parses short and long hex, with or without #, and rejects anything else', () => {
    expect(parseHex('#2563EB')).toBe('#2563eb');
    expect(parseHex('2563eb')).toBe('#2563eb');
    expect(parseHex(' #26e ')).toBe('#2266ee');
    for (const bad of ['', '#12', '#12345', '#1234567', 'blue', '#ggg']) expect(parseHex(bad)).toBeNull();
  });

  it('measures ΔEOK: zero for identical colors, about 1 between black and white', () => {
    expect(deltaEOK('#336699', '#336699')).toBe(0);
    expect(deltaEOK('#000000', '#ffffff')).toBeCloseTo(1, 2);
  });

  it('finds the sRGB chroma ceiling, which every gamut-mapped color sits under', () => {
    const ceiling = maxChroma(0.64, 264);
    expect(ceiling).toBeGreaterThan(0.15);
    expect(rgbToOklch(oklchToRgb({ l: 0.64, c: 0.4, h: 264 })).c).toBeLessThanOrEqual(ceiling + 0.005);
    expect(maxChroma(0.999, 30)).toBeLessThan(0.02);
  });

  it('simulates dichromacy: grays are unchanged and red and green converge without red-green vision', () => {
    for (const vision of ['protanopia', 'deuteranopia', 'tritanopia'] as const) {
      expect(simulateVision('#808080', vision)).toBe('#808080');
      expect(simulateVision('#ffffff', vision)).toBe('#ffffff');
    }
    expect(simulateVision('#d32f2f', 'typical')).toBe('#d32f2f');
    const typical = deltaEOK('#d32f2f', '#388e3c');
    expect(deltaEOK(simulateVision('#d32f2f', 'deuteranopia'), simulateVision('#388e3c', 'deuteranopia'))).toBeLessThan(typical / 2);
    expect(deltaEOK(simulateVision('#d32f2f', 'protanopia'), simulateVision('#388e3c', 'protanopia'))).toBeLessThan(typical / 2);
  });

  it('round-trips sRGB through OKLCH', () => {
    for (const hex of ['#0f766e', '#7c3aed', '#e11d48', '#f59e0b', '#808080', '#000000', '#ffffff']) {
      expect(rgbToHex(oklchToRgb(rgbToOklch(hexToRgb(hex))))).toBe(hex);
    }
  });

  it('gamut-maps out-of-range chroma instead of clipping channels', () => {
    const rgb = oklchToRgb({ l: 0.7, c: 0.4, h: 145 });
    expect(rgb.every((channel) => channel >= 0 && channel <= 1)).toBe(true);
    expect(rgbToOklch(rgb).h).toBeCloseTo(145, 0);
  });

  it('computes WCAG 2 contrast', () => {
    expect(wcagContrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(wcagContrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('computes APCA Lc with polarity', () => {
    expect(apcaContrast('#000000', '#ffffff')).toBeCloseTo(106.04, 1);
    expect(apcaContrast('#ffffff', '#000000')).toBeCloseTo(-107.88, 1);
    expect(apcaContrast('#888888', '#ffffff')).toBeCloseTo(63.06, 1);
    expect(apcaContrast('#777777', '#777777')).toBe(0);
  });
});

describe('brand generation', () => {
  it('builds a ramp with strictly decreasing lightness and the brand hue', () => {
    const ramp = generateRamp('#0d9488');
    const lightness = rampSteps.map((step) => rgbToOklch(hexToRgb(ramp[step])).l);
    lightness.slice(1).forEach((value, index) => expect(value).toBeLessThan(lightness[index] ?? 1));
    expect(rgbToOklch(hexToRgb(ramp[500])).h).toBeCloseTo(rgbToOklch(hexToRgb('#0d9488')).h, 0);
  });

  it.each(['#0d9488', '#7c3aed', '#e11d48', '#f59e0b', '#2563eb', '#16a34a', '#64748b'])(
    'assigns roles for %s that pass every check in both themes',
    (brand) => {
      const ramp = generateRamp(brand);
      for (const [theme, surfaces] of [['light', lightSurfaces], ['dark', darkSurfaces]] as const) {
        const { checks } = assignRoles(ramp, theme, surfaces);
        expect(checks.filter((check) => !check.pass).map((check) => `${theme}: ${check.label}`)).toEqual([]);
      }
    },
  );

  it('reports which steps sRGB could not show at full chroma', () => {
    const vivid = analyzeRamp('#00ff66', generateRamp('#00ff66'));
    expect(vivid.some((step) => step.reduced)).toBe(true);
    for (const step of vivid) expect(step.c).toBeLessThanOrEqual(step.ceiling + 0.01);
    expect(analyzeRamp('#64748b', generateRamp('#64748b')).some((step) => step.reduced)).toBe(false);
  });

  it('names hue families and treats low-chroma colors as neutral', () => {
    expect(['#e11d48', '#dc2626', '#2563eb', '#0d9488', '#7c3aed', '#16a34a', '#475569'].map(hueName)).toEqual([
      'rose',
      'red',
      'blue',
      'teal',
      'violet',
      'green',
      'neutral',
    ]);
  });
});

const manifestValue = (path: string, theme: 'light' | 'dark') => tokenManifest.find((record) => record.path === path)?.values[theme].resolved ?? '';
const realSurfaces = (theme: 'light' | 'dark') => ({
  canvas: manifestValue('surface.canvas', theme),
  panel: manifestValue('surface.panel', theme),
  sunken: manifestValue('surface.sunken', theme),
});
const statuses = (theme: 'light' | 'dark') => ({
  danger: manifestValue('tone.danger.solid', theme),
  warning: manifestValue('tone.warning.solid', theme),
  success: manifestValue('tone.success.solid', theme),
  info: manifestValue('tone.info.solid', theme),
});

describe('studio presets against the real system', () => {
  it.each(studioPresets.map((preset) => [preset.id, preset.brand] as const))('%s passes every check on the real surfaces', (id, brand) => {
    expect(productIdProblem(id, productNames)).toBeUndefined();
    const ramp = generateRamp(brand);
    for (const theme of ['light', 'dark'] as const) {
      const { checks } = assignRoles(ramp, theme, realSurfaces(theme));
      expect(checks.filter((check) => !check.pass).map((check) => `${theme}: ${check.label}`)).toEqual([]);
    }
  });

  it('flags a brand that resembles danger and clears one that does not', () => {
    const strong = (brand: string) => {
      const ramp = generateRamp(brand);
      return ramp[assignRoles(ramp, 'light', realSurfaces('light')).roles.strong];
    };
    const typical = (brand: string, tone: string) =>
      compareWithStatus(strong(brand), statuses('light')).find((check) => check.tone === tone && check.vision === 'typical');
    expect(typical('#dc2626', 'danger')?.close).toBe(true);
    expect(typical('#7c3aed', 'danger')?.close).toBe(false);
    expect(typical('#7c3aed', 'danger')?.distance).toBeGreaterThan(closeDistance);
  });
});

describe('product ids', () => {
  it('accepts kebab-case ids that are not already products', () => {
    expect(productIdProblem('night-shift', productNames)).toBeUndefined();
    expect(productNameOf('night-shift')).toBe('Night Shift');
  });

  it.each(['', 'Aurora', '1st', 'night_shift', 'night--shift', 'night-', 'provider', 'a'.repeat(33)])('rejects "%s"', (id) => {
    expect(productIdProblem(id, productNames)).toBeTypeOf('string');
  });
});

describe('export', () => {
  const spec = (shape: (typeof shapeNames)[number]) => {
    const ramp = generateRamp('#2563eb');
    return exportProduct({
      id: 'clavius',
      brand: '#2563eb',
      shape,
      ramp,
      roles: { light: assignRoles(ramp, 'light', realSurfaces('light')).roles, dark: assignRoles(ramp, 'dark', realSurfaces('dark')).roles },
    });
  };
  const leafPaths = (value: unknown, prefix = ''): string[] =>
    value && typeof value === 'object' && !('$value' in value)
      ? Object.entries(value).flatMap(([key, child]) => (key.startsWith('$') ? [] : leafPaths(child, prefix ? `${prefix}.${key}` : key)))
      : [prefix];
  const productPaths = (shape: (typeof shapeNames)[number]) => {
    const file = spec(shape).find((candidate) => candidate.key === 'product');
    return leafPaths(JSON.parse(file?.content ?? '{}'));
  };

  it('writes six pieces: one new file and five merges', () => {
    const files = spec('machined');
    expect(files.map((file) => file.key)).toEqual(['product', 'ramp', 'light', 'dark', 'resolver', 'profile']);
    expect(files.filter((file) => file.action === 'create').map((file) => file.path)).toEqual([
      'src/design-system/tokens/source/product.clavius.tokens.json',
    ]);
    for (const file of files.filter((candidate) => candidate.filename.endsWith('.json'))) expect(() => JSON.parse(file.content) as unknown).not.toThrow();
  });

  it('only overrides existing tokens inside the product lane, as the resolver and the policy require', () => {
    const existing = new Set(tokenManifest.map((record) => record.path));
    for (const shape of shapeNames) {
      const paths = productPaths(shape);
      expect(paths.filter((path) => !existing.has(path) || !inLane('product', path))).toEqual([]);
    }
    expect(productPaths('machined')).toHaveLength(15);
    expect(productPaths('pill')).toHaveLength(15 + shapedComponents.length);
  });

  it('treats machined as the system default, so it exports no shape', () => {
    for (const component of shapedComponents) {
      const record = tokenManifest.find((candidate) => candidate.path === `${component}.radius`);
      const authored = record?.variants?.find((variant) => variant.input.product === 'system-lab')?.authored ?? record?.values.light.authored;
      expect(authored).toBe(`{radius.${shapes.machined.radii[component]}}`);
    }
  });

  it('keeps the ramp description ahead of the steps and registers the product file', () => {
    const files = spec('tight');
    const ramp = files.find((file) => file.key === 'ramp')?.content ?? '';
    expect(ramp.indexOf('$description')).toBeLessThan(ramp.indexOf('"50"'));
    const parsed = JSON.parse(ramp) as { color: Record<string, Record<string, { $value: { hex: string } }>> };
    expect(parsed.color.clavius?.['975']?.$value.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(JSON.parse(files.find((file) => file.key === 'resolver')?.content ?? '{}')).toEqual({
      modifiers: { product: { contexts: { clavius: [{ $ref: 'product.clavius.tokens.json' }] } } },
    });
    expect(files.find((file) => file.key === 'profile')?.content).toContain("overrides: 'Blue brand roles, tighter corners");
  });
});
