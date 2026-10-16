import { useMemo, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { productNames, type ThemeName } from '@/design-system/tokens';
import { tokenManifest } from '@/design-system/tokens/manifest';
import {
  analyzeRamp,
  assignRoles,
  brandRoles,
  compareWithStatus,
  exportProduct,
  generateRamp,
  glowColor,
  hueName,
  productIdProblem,
  productNameOf,
  shapedComponents,
  shapeNames,
  shapes,
  statusTones,
  type ShapeName,
  type StatusTone,
  type SurfaceSet,
} from './brand';
import { parseHex, rgbToOklch, hexToRgb } from './color';

const resolved = (path: string, theme: ThemeName) => tokenManifest.find((record) => record.path === path)?.values[theme].resolved ?? '#000000';
const surfacesOf = (theme: ThemeName): SurfaceSet => ({
  canvas: resolved('surface.canvas', theme),
  panel: resolved('surface.panel', theme),
  sunken: resolved('surface.sunken', theme),
});
const statusesOf = (theme: ThemeName) =>
  Object.fromEntries(statusTones.map((tone) => [tone, resolved(`tone.${tone}.solid`, theme)])) as Record<StatusTone, string>;

export interface StudioPreset {
  id: string;
  brand: string;
}

/** Starting points around the hue circle. Orion, Jupiter and Aries deliberately sit near a status color. */
export const studioPresets: readonly StudioPreset[] = [
  { id: 'clavius', brand: '#4f46e5' },
  { id: 'europa', brand: '#c026d3' },
  { id: 'monolith', brand: '#475569' },
  { id: 'orion', brand: '#e11d48' },
  { id: 'jupiter', brand: '#d97706' },
  { id: 'aries', brand: '#0f8a6a' },
];

const defaults = { brand: studioPresets[0]?.brand ?? '#4f46e5', id: studioPresets[0]?.id ?? 'clavius', shape: 'machined' as ShapeName };
const themes = ['light', 'dark'] as const;

/** The existing product the preview borrows, and the brand family whose roles it re-points inline, so no CSS is generated at runtime. */
export const previewProduct = 'provider';
const previewBrand = 'care';
const typefaceRoles = ['display', 'text'] as const;

function fromUrl(search: URLSearchParams) {
  const brand = parseHex(search.get('brand') ?? '') ?? defaults.brand;
  const id = search.get('id') ?? '';
  const shape = search.get('shape') as ShapeName | null;
  return {
    brand,
    id: productIdProblem(id, productNames) ? defaults.id : id,
    shape: shape && shapeNames.includes(shape) ? shape : defaults.shape,
  };
}

/**
 * State and derived results for the theme studio. Valid choices are mirrored to the URL
 * (replacing the history entry), so a generated theme can be bookmarked and shared.
 */
export function useThemeStudio() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initial] = useState(() => fromUrl(new URLSearchParams(location.search)));
  const [brand, setBrandValue] = useState(initial.brand);
  const [brandDraft, setBrandDraft] = useState(initial.brand);
  const [id, setIdValue] = useState(initial.id);
  const [idDraft, setIdDraft] = useState(initial.id);
  const [shape, setShapeValue] = useState<ShapeName>(initial.shape);

  // Navigates with the fragment kept, so a reader who arrived at #ramp is not sent back to the top.
  const sync = (patch: Partial<Record<'brand' | 'id' | 'shape', string>> | null) => {
    const next = new URLSearchParams(location.search);
    if (patch === null) for (const key of ['brand', 'id', 'shape']) next.delete(key);
    else for (const [key, value] of Object.entries(patch)) next.set(key, key === 'brand' ? value.slice(1) : value);
    const search = next.toString();
    void navigate({ search: search ? `?${search}` : '', hash: location.hash }, { replace: true, preventScrollReset: true });
  };

  const setBrandInput = (value: string) => {
    setBrandDraft(value);
    const parsed = parseHex(value);
    if (parsed) {
      setBrandValue(parsed);
      sync({ brand: parsed });
    }
  };
  const setIdInput = (value: string) => {
    setIdDraft(value);
    if (!productIdProblem(value, productNames)) {
      setIdValue(value);
      sync({ id: value });
    }
  };
  const setShape = (value: ShapeName) => {
    setShapeValue(value);
    sync({ shape: value });
  };
  const applyPreset = (preset: StudioPreset) => {
    setBrandValue(preset.brand);
    setBrandDraft(preset.brand);
    setIdValue(preset.id);
    setIdDraft(preset.id);
    sync({ brand: preset.brand, id: preset.id });
  };
  const reset = () => {
    setBrandValue(defaults.brand);
    setBrandDraft(defaults.brand);
    setIdValue(defaults.id);
    setIdDraft(defaults.id);
    setShapeValue(defaults.shape);
    sync(null);
  };

  const color = useMemo(() => {
    const ramp = generateRamp(brand);
    const roles = { light: assignRoles(ramp, 'light', surfacesOf('light')), dark: assignRoles(ramp, 'dark', surfacesOf('dark')) };
    const status = {
      light: compareWithStatus(ramp[roles.light.roles.strong], statusesOf('light')),
      dark: compareWithStatus(ramp[roles.dark.roles.strong], statusesOf('dark')),
    };
    return { ramp, roles, status, analysis: analyzeRamp(brand, ramp), oklch: rgbToOklch(hexToRgb(brand)), hue: hueName(brand) };
  }, [brand]);

  const files = useMemo(
    () => exportProduct({ id, brand, shape, ramp: color.ramp, roles: { light: color.roles.light.roles, dark: color.roles.dark.roles } }),
    [id, brand, shape, color],
  );

  /**
   * Inline custom properties that re-point the preview product's brand roles and shape. Generated
   * products inherit the system's typefaces, so the preview resets the ones it borrows.
   */
  const previewStyle = (theme: ThemeName) =>
    Object.fromEntries([
      ...brandRoles.map((role) => [`--brand-${previewBrand}-${role}`, color.ramp[color.roles[theme].roles[role]]]),
      [`--brand-${previewBrand}-glow`, glowColor(color.ramp[color.roles[theme].roles.border], theme)],
      ...shapedComponents.map((component) => [`--${component}-radius`, `var(--radius-${shapes[shape].radii[component]})`]),
      ...typefaceRoles.map((role) => [`--typeface-${role}`, resolved(`typeface.${role}`, theme)]),
    ]) as CSSProperties;

  const checks = themes.flatMap((theme) => color.roles[theme].checks);
  const closest = [...color.status.light, ...color.status.dark]
    .filter((check) => check.vision === 'typical')
    .reduce((nearest, check) => (check.distance < nearest.distance ? check : nearest));

  return {
    brand,
    brandDraft,
    brandProblem: parseHex(brandDraft) ? undefined : 'Enter a hex color such as #4f46e5 or #46e.',
    id,
    idDraft,
    idProblem: productIdProblem(idDraft, productNames),
    name: productNameOf(id),
    shape,
    setBrandInput,
    setIdInput,
    setShape,
    applyPreset,
    reset,
    ...color,
    files,
    previewStyle,
    summary: {
      passed: checks.filter((check) => check.pass).length,
      total: checks.length,
      closest,
    },
  };
}

export type ThemeStudioState = ReturnType<typeof useThemeStudio>;
