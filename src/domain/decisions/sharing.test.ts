import { describe, expect, it } from 'vitest';
import {
  assessApproaches,
  assessLayers,
  changedConstraints,
  compareOutcomes,
  constraints,
  constraintsToSearch,
  defaultConstraints,
  hasInvalidConstraints,
  isApplicable,
  parseConstraints,
  pilotQuestions,
  presetFor,
  presets,
  recommend,
  type Constraints,
} from './sharing';

const allCombinations = (): Constraints[] =>
  constraints.reduce<Constraints[]>(
    (combinations, constraint) => combinations.flatMap((partial) => constraint.options.map((option) => ({ ...partial, [constraint.id]: option.value }))),
    [{} as Constraints],
  );

const layer = (c: Constraints, name: string) => assessLayers(c).find((candidate) => candidate.layer === name);
const allText = (c: Constraints) =>
  [
    ...assessLayers(c).map((candidate) => candidate.because),
    ...assessApproaches(c).flatMap((approach) => [...approach.fits, ...approach.strains]),
    ...recommend(c).flatMap((part) => [...part.because, ...part.overturnedBy]),
    ...pilotQuestions(c),
  ].join(' ');

describe('sharing comparison', () => {
  it('assesses every layer and every approach for every combination of constraints', () => {
    const combinations = allCombinations();
    expect(combinations).toHaveLength(3 * 2 * 2 * 2 * 2 * 2);
    for (const c of combinations) {
      expect(assessLayers(c)).toHaveLength(c.mobile === 'web' ? 7 : 8);
      for (const approach of assessApproaches(c)) expect(approach.fits.length + approach.strains.length, approach.id).toBeGreaterThan(0);
      expect(pilotQuestions(c).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('never shares product screens and always shares principles', () => {
    for (const c of allCombinations()) {
      const layers = assessLayers(c);
      expect(layers.find((candidate) => candidate.layer === 'Principles')?.leaning).toBe('share');
      expect(layers.find((candidate) => candidate.layer === 'Product screens and workflows')?.leaning).toBe('separate');
    }
  });

  it('separates web code sharing from what a native app shares', () => {
    const nativeOnly = { ...defaultConstraints, mobile: 'native' };
    const both = { ...defaultConstraints, mobile: 'both' };
    expect(layer(nativeOnly, 'Component code (web)')?.leaning).toBe('separate');
    expect(layer(nativeOnly, 'The native patient app')?.because).toMatch(/tokens and the behavior specifications/);
    expect(layer(both, 'Component code (web)')?.leaning).not.toBe('separate');
    expect(layer(both, 'Component code (web)')?.because).toMatch(/the patient web app and the provider workspace/i);
    expect(layer(both, 'The native patient app')?.leaning).toBe('partial');
    expect(layer(defaultConstraints, 'The native patient app')).toBeUndefined();
  });

  it('ignores web frameworks when only one product is on the web', () => {
    const native = { ...defaultConstraints, mobile: 'native' };
    expect(isApplicable('frameworks', native)).toBe(false);
    expect(isApplicable('frameworks', { ...native, mobile: 'both' })).toBe(true);
    expect(assessApproaches({ ...native, frameworks: 'different' })).toEqual(assessApproaches({ ...native, frameworks: 'same' }));
    expect(pilotQuestions({ ...native, frameworks: 'different' })).toEqual(pilotQuestions({ ...native, frameworks: 'same' }));
    expect(recommend({ ...native, frameworks: 'different' })).toEqual(recommend({ ...native, frameworks: 'same' }));
  });

  it('keeps a cost on every approach, so none reads as automatically correct', () => {
    for (const c of allCombinations()) {
      for (const approach of assessApproaches(c)) expect(approach.strains.length, `${approach.id} ${JSON.stringify(c)}`).toBeGreaterThan(0);
    }
  });

  it('never equates a shared library with shared releases, or adapters with a requirement', () => {
    for (const c of allCombinations()) {
      const text = allText(c);
      expect(text, JSON.stringify(c)).not.toMatch(/ships to both|at once|needs Web Components with adapters/);
    }
    const independent = assessApproaches(defaultConstraints).find((approach) => approach.id === 'library');
    expect(independent?.strains.join(' ')).toMatch(/own schedules/);
    expect(layer({ ...defaultConstraints, frameworks: 'different' }, 'Component code (web)')?.because).toMatch(/depends on how it passes properties and events/);
  });

  it('adds a pilot question for each risky constraint', () => {
    const risky = pilotQuestions({ mobile: 'both', frameworks: 'different', brands: 'distinct', overlap: 'many', releases: 'independent', ownership: 'part-time' });
    const calm = pilotQuestions({ mobile: 'web', frameworks: 'same', brands: 'family', overlap: 'few', releases: 'coordinated', ownership: 'team' });
    expect(risky.length).toBeGreaterThan(calm.length);
  });
});

describe('starting recommendation', () => {
  const approachOf = (c: Partial<Constraints>, part: 'main' | 'native' = 'main') => recommend({ ...defaultConstraints, ...c }).find((candidate) => candidate.part === part)?.approach;

  it('gives every combination a supported, overturnable starting point', () => {
    for (const c of allCombinations()) {
      const parts = recommend(c);
      expect(parts.map((part) => part.part)).toEqual(c.mobile === 'both' ? ['main', 'native'] : ['main']);
      for (const part of parts) {
        expect(part.because.length, JSON.stringify(c)).toBeGreaterThan(0);
        expect(part.overturnedBy.length, JSON.stringify(c)).toBeGreaterThan(0);
      }
    }
  });

  it('follows the constraints in representative combinations', () => {
    expect(approachOf({})).toBe('core');
    expect(approachOf({ frameworks: 'different' })).toBe('specs');
    expect(approachOf({ frameworks: 'different', overlap: 'many' })).toBe('core');
    expect(approachOf({ overlap: 'many', releases: 'coordinated' })).toBe('library');
    expect(approachOf({ overlap: 'many', releases: 'coordinated', ownership: 'part-time' })).toBe('core');
    expect(approachOf({ brands: 'distinct', ownership: 'part-time' })).toBe('separate');
    expect(approachOf({ mobile: 'native' })).toBe('specs');
    expect(approachOf({ mobile: 'both' })).toBe('core');
    expect(approachOf({ mobile: 'both' }, 'native')).toBe('specs');
  });

  it('explains each part of a product that is both native and web', () => {
    const [web, native] = recommend({ ...defaultConstraints, mobile: 'both' });
    expect(web?.scope).toBe('The patient web app and the provider workspace');
    expect(native?.scope).toBe('The native patient app');
    expect(native?.because.join(' ')).toMatch(/cannot run the web components/);
  });
});

describe('presets and shareable URLs', () => {
  it('starts from the scenario and recognises every preset', () => {
    expect(presets[0]?.values).toEqual(defaultConstraints);
    expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length);
    for (const preset of presets) {
      expect(presetFor(preset.values)?.id).toBe(preset.id);
      expect(parseConstraints(constraintsToSearch(preset.values))).toEqual(preset.values);
    }
    expect(presetFor({ ...defaultConstraints, overlap: 'many' })).toBeUndefined();
  });

  it('covers the four named situations', () => {
    const byId = Object.fromEntries(presets.map((preset) => [preset.id, preset.values]));
    expect(byId.react).toMatchObject({ mobile: 'web', frameworks: 'same' });
    expect(byId.frameworks).toMatchObject({ mobile: 'web', frameworks: 'different' });
    expect(byId['native-web']).toMatchObject({ mobile: 'both' });
    expect(byId['distinct-small']).toMatchObject({ brands: 'distinct', ownership: 'part-time' });
  });

  it('round-trips every combination through the URL', () => {
    for (const c of allCombinations()) expect(parseConstraints(new URLSearchParams(constraintsToSearch(c).toString()))).toEqual(c);
  });

  it('keeps defaults for missing or invalid values and reports invalid ones', () => {
    expect(parseConstraints(new URLSearchParams(''))).toEqual(defaultConstraints);
    const search = new URLSearchParams('mobile=tablet&brands=distinct&overlap=&ownership=TEAM&unrelated=1');
    expect(parseConstraints(search)).toEqual({ ...defaultConstraints, brands: 'distinct' });
    expect(hasInvalidConstraints(search)).toBe(true);
    expect(hasInvalidConstraints(new URLSearchParams('brands=distinct&unrelated=1'))).toBe(false);
  });
});

describe('what changed', () => {
  it('reports nothing when the constraints are the same', () => {
    expect(compareOutcomes(defaultConstraints, defaultConstraints)).toEqual({ conclusions: [], reasoning: [] });
    expect(changedConstraints(defaultConstraints, defaultConstraints)).toEqual([]);
  });

  it('names each changed conclusion, its old and new value, and why', () => {
    const native = { ...defaultConstraints, mobile: 'native' };
    expect(changedConstraints(defaultConstraints, native)).toEqual([{ id: 'mobile', label: 'The patient app is built as', from: 'Responsive web', to: 'A native app' }]);
    const { conclusions } = compareOutcomes(defaultConstraints, native);
    const code = conclusions.find((change) => change.subject === 'Component code (web)');
    expect(code).toMatchObject({ from: 'Share in part', to: 'Keep separate' });
    expect(code?.why).toMatch(/Only the provider workspace is on the web/);
    expect(conclusions).toContainEqual(expect.objectContaining({ subject: 'The native patient app', to: 'Share in part' }));
    expect(conclusions).toContainEqual(
      expect.objectContaining({ from: 'Shared core with product extensions', to: 'Shared tokens and guidelines, separate implementations' }),
    );
  });

  it('reports parts that appear and disappear', () => {
    const both = { ...defaultConstraints, mobile: 'both' };
    expect(compareOutcomes(defaultConstraints, both).conclusions.map((change) => change.subject)).toEqual(
      expect.arrayContaining(['The native patient app', 'Starting point: The native patient app']),
    );
    const removed = compareOutcomes(both, defaultConstraints).conclusions.filter((change) => change.to === undefined);
    expect(removed.map((change) => change.subject)).toEqual(['The native patient app', 'Starting point: The native patient app']);
  });

  it('separates a changed conclusion from changed reasoning', () => {
    const distinct = compareOutcomes(defaultConstraints, { ...defaultConstraints, brands: 'distinct' });
    expect(distinct.conclusions).toContainEqual(expect.objectContaining({ subject: 'Visual language and tokens', from: 'Share', to: 'Share in part' }));
    const coordinated = compareOutcomes(defaultConstraints, { ...defaultConstraints, releases: 'coordinated' });
    expect(coordinated.conclusions).toEqual([]);
    expect(coordinated.reasoning.map((change) => change.subject)).toContain('Tooling and governance');
  });
});
