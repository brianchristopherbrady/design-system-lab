import { describe, expect, it } from 'vitest';
import { densityNames, productNames, themeNames } from '@/design-system/tokens';
import { densityTokens, permutationCount, permutationIndex, productTokens, recordOf, resolveFor, selectorFor } from './modes';

const every = themeNames.flatMap((theme) => productNames.flatMap((product) => densityNames.map((density) => ({ theme, product, density }))));

describe('mode helpers', () => {
  it('numbers all permutations once, from 1', () => {
    expect(every).toHaveLength(permutationCount);
    expect(new Set(every.map(permutationIndex))).toEqual(new Set(Array.from({ length: permutationCount }, (_, index) => index + 1)));
  });

  it('resolves a token for a permutation using only the modifiers it depends on', () => {
    const radius = recordOf('card.radius');
    const link = recordOf('text.link');
    const height = recordOf('control.height.medium');
    if (!radius || !link || !height) throw new Error('missing token');
    expect(resolveFor(radius, { theme: 'dark', product: 'provider', density: 'compact' }).authored).toBe('{radius.md}');
    expect(resolveFor(height, { theme: 'dark', product: 'patient', density: 'compact' }).resolved).toBe('2.25rem');
    expect(resolveFor(link, { theme: 'dark', product: 'provider', density: 'compact' }).chain).toContain('brand.care.text');
    expect(selectorFor(link, { theme: 'dark', product: 'provider', density: 'compact' })).toBe("[data-theme='dark'][data-product='provider']");
    expect(selectorFor(height, { theme: 'light', product: 'provider', density: 'compact' })).toBe("[data-density='compact']");
  });

  it('separates direct product overrides from aliases that follow them', () => {
    const { direct, aliases, shared } = productTokens('light');
    expect(direct.map(({ record }) => record.path)).toContain('action.primary.background');
    expect(direct.map(({ record }) => record.path)).toContain('card.radius');
    expect(aliases.map((record) => record.path)).toContain('button.primary.background');
    expect(direct.every(({ values }) => values.length === productNames.length)).toBe(true);
    expect(direct.findIndex(({ record }) => record.type !== 'color')).toBeGreaterThan(direct.findLastIndex(({ record }) => record.type === 'color'));
    expect(direct.length + aliases.length + shared).toBeGreaterThan(300);
  });

  it('measures compact density as smaller for every token it changes', () => {
    const rows = densityTokens();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.comfortable).toMatch(/rem$/);
      expect(row.compactPx ?? Infinity).toBeLessThan(row.comfortablePx ?? 0);
    }
  });
});
