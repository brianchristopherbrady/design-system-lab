import { describe, expect, it } from 'vitest';
import { catalog } from '@/domain/system';
import { countSummary } from './DirectoryFilters';
import { defaultFilters, filterEntries, hasActiveFilters, parseFilters, toSearchParams, withType } from './filters';

describe('directory filters', () => {
  it('round-trips through URL parameters and drops defaults', () => {
    const filters = { query: 'focus', type: 'component', layer: 'Composite', maturity: 'beta' } as const;
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
    expect(toSearchParams(defaultFilters).toString()).toBe('');
  });

  it('keeps existing component-layer links working', () => {
    expect(parseFilters(new URLSearchParams('layer=Composite&q=focus'))).toEqual({ ...defaultFilters, query: 'focus', layer: 'Composite' });
  });

  it('reads resource types that older links passed as a layer', () => {
    expect(parseFilters(new URLSearchParams('layer=Pattern'))).toEqual({ ...defaultFilters, type: 'pattern' });
    expect(parseFilters(new URLSearchParams('layer=Decision&type=foundation'))).toEqual({ ...defaultFilters, type: 'foundation' });
  });

  it('falls back to defaults for unknown values', () => {
    expect(parseFilters(new URLSearchParams('layer=Widget&type=page&maturity=gold'))).toEqual(defaultFilters);
  });

  it('matches every term against name, summary, resource type, component layer and tags', () => {
    const names = filterEntries(catalog, { ...defaultFilters, query: 'form boolean' }).map((entry) => entry.name);
    expect(names).toEqual(['Checkbox', 'Switch']);
    expect(filterEntries(catalog, { ...defaultFilters, query: 'design decision' }).every((entry) => entry.kind === 'decision')).toBe(true);
  });

  it('combines query, resource type, component layer and maturity', () => {
    const result = filterEntries(catalog, { query: 'status', type: 'component', layer: 'Primitive', maturity: 'stable' });
    expect(result.map((entry) => entry.id)).toEqual(['badge', 'progress']);
    expect(filterEntries(catalog, { ...defaultFilters, type: 'foundation' }).every((entry) => entry.kind === 'foundation')).toBe(true);
  });

  it('clears a component layer when the resource type changes to one without layers', () => {
    const composites = { ...defaultFilters, type: 'component', layer: 'Composite' } as const;
    expect(withType(composites, 'pattern')).toEqual({ ...defaultFilters, type: 'pattern' });
    expect(withType(composites, 'all')).toEqual(defaultFilters);
    expect(withType({ ...composites, type: 'all' }, 'component').layer).toBe('Composite');
  });

  it('reports active filters, ignoring whitespace-only queries', () => {
    expect(hasActiveFilters({ ...defaultFilters, query: '  ' })).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters, type: 'pattern' })).toBe(true);
    expect(hasActiveFilters({ ...defaultFilters, layer: 'Layout' })).toBe(true);
  });

  it('counts what is listed, what matches and what exists, without conflating them', () => {
    expect(countSummary(48, 48, 48)).toBe('Showing 48 of 48');
    expect(countSummary(3, 3, 48)).toBe('Showing 3 of 48');
    expect(countSummary(12, 48, 48)).toBe('Showing 12 of 48 entries');
    expect(countSummary(12, 29, 48)).toBe('Showing 12 of 29 matches, 48 in total');
  });
});
