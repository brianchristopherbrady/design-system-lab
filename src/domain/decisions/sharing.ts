/**
 * How sharing between Meadow (a guided consumer product, mostly on phones) and Harbor (a dense
 * professional desktop application) shifts with a few constraints. It lists reasons, strains and
 * open questions per layer and per approach; it never scores the approaches or names a winner.
 */

export const constraintIds = ['mobile', 'frameworks', 'brands', 'overlap', 'releases', 'ownership'] as const;
export type ConstraintId = (typeof constraintIds)[number];

export interface Constraint {
  id: ConstraintId;
  label: string;
  options: readonly { value: string; label: string }[];
}

export const constraints: readonly Constraint[] = [
  {
    id: 'mobile',
    label: 'Meadow is built as',
    options: [
      { value: 'web', label: 'Responsive web' },
      { value: 'native', label: 'A native app' },
      { value: 'both', label: 'Both' },
    ],
  },
  {
    id: 'frameworks',
    label: 'Web frameworks',
    options: [
      { value: 'same', label: 'The same in both' },
      { value: 'different', label: 'Different' },
    ],
  },
  {
    id: 'brands',
    label: 'Brands',
    options: [
      { value: 'family', label: 'One brand family' },
      { value: 'distinct', label: 'Distinct brands' },
    ],
  },
  {
    id: 'overlap',
    label: 'Controls with equivalent behavior',
    options: [
      { value: 'many', label: 'Many' },
      { value: 'few', label: 'Few' },
    ],
  },
  {
    id: 'releases',
    label: 'Releases',
    options: [
      { value: 'coordinated', label: 'Coordinated' },
      { value: 'independent', label: 'Independent' },
    ],
  },
  {
    id: 'ownership',
    label: 'System ownership',
    options: [
      { value: 'team', label: 'A dedicated team' },
      { value: 'part-time', label: 'Part-time owners' },
    ],
  },
];

export type Constraints = Record<ConstraintId, string>;

/** The scenario's constraints; the comparison starts here. */
export const defaultConstraints: Constraints = {
  mobile: 'web',
  frameworks: 'same',
  brands: 'family',
  overlap: 'few',
  releases: 'independent',
  ownership: 'team',
};

export type Leaning = 'share' | 'partial' | 'separate';

/** Whether a constraint matters for the others chosen: web frameworks only matter when both products are on the web. */
export const isApplicable = (id: ConstraintId, c: Constraints) => !(id === 'frameworks' && c.mobile === 'native');

const effective = (c: Constraints): Constraints => (isApplicable('frameworks', c) ? c : { ...c, frameworks: 'not-applicable' });

export const leaningLabels: Record<Leaning, string> = { share: 'Share', partial: 'Share in part', separate: 'Keep separate' };

export interface LayerAssessment {
  layer: string;
  leaning: Leaning;
  because: string;
}

/** Layer by layer: how much to share, and why, for these constraints. */
export function assessLayers(chosen: Constraints): LayerAssessment[] {
  const c = effective(chosen);
  const native = c.mobile !== 'web';
  const nativeOnly = c.mobile === 'native';

  const tokens: LayerAssessment =
    c.brands === 'family'
      ? {
          layer: 'Visual language and tokens',
          leaning: 'share',
          because: `One token source with product overrides for brand roles and shape${native ? ', exported to each native platform’s format' : ''}.`,
        }
      : {
          layer: 'Visual language and tokens',
          leaning: 'partial',
          because: 'Align what users rely on across brands, such as status colors, focus and spacing steps; keep brand values in each product.',
        };

  const behavior: LayerAssessment =
    c.overlap === 'many'
      ? { layer: 'Component behavior', leaning: 'share', because: 'Many controls mean the same thing in both products, so one specification for states, keyboard and accessibility avoids solving them twice.' }
      : {
          layer: 'Component behavior',
          leaning: 'partial',
          because: 'Only the genuinely equivalent controls, typically form fields, buttons, alerts and dialogs. Dense tables and guided mobile steps behave differently by design.',
        };

  let code: LayerAssessment;
  if (nativeOnly) {
    code = { layer: 'Component code', leaning: 'separate', because: 'Native and web code cannot be shared directly; share specifications and tokens instead.' };
  } else if (c.frameworks === 'different') {
    code = {
      layer: 'Component code',
      leaning: 'partial',
      because: 'Sharing code across frameworks needs Web Components with adapters, or framework-free CSS. Worth it only for controls with complex, equivalent behavior.',
    };
  } else {
    code = {
      layer: 'Component code',
      leaning: c.overlap === 'many' ? 'share' : 'partial',
      because: `One framework allows one library${c.overlap === 'few' ? ', limited to the equivalent controls' : ''}${c.mobile === 'both' ? '; the native app reimplements from the same specifications' : ''}.`,
    };
  }

  return [
    { layer: 'Principles', leaning: 'share', because: 'Cheap to share, and they keep decisions consistent even where the products differ.' },
    tokens,
    behavior,
    code,
    {
      layer: 'Interaction patterns',
      leaning: 'partial',
      because: 'Share how validation, errors, empty states and confirmations behave and are worded; layouts differ with the task and screen.',
    },
    { layer: 'Product screens and workflows', leaning: 'separate', because: 'Different users, tasks, frequency and density. Each product composes its own screens.' },
    {
      layer: 'Tooling and governance',
      leaning: c.ownership === 'team' ? 'share' : 'partial',
      because:
        c.ownership === 'team'
          ? `One owning team, shared build and checks${c.releases === 'independent' ? ', with versioned packages and a support window' : ''}.`
          : 'Part-time owners can sustain shared tooling and review, but only a small shared surface. Name a lead for each shared package.',
    },
  ];
}

export const approaches = [
  { id: 'library', name: 'One broad shared library' },
  { id: 'core', name: 'Shared core with product extensions' },
  { id: 'specs', name: 'Shared tokens and guidelines, separate implementations' },
  { id: 'separate', name: 'Separate systems with selective alignment' },
] as const;
export type ApproachId = (typeof approaches)[number]['id'];

export interface ApproachAssessment {
  id: ApproachId;
  name: string;
  fits: string[];
  strains: string[];
}

/** What favors and what strains each approach under these constraints. No totals: one strain can outweigh several fits. */
export function assessApproaches(chosen: Constraints): ApproachAssessment[] {
  const c = effective(chosen);
  const native = c.mobile !== 'web';
  const add = (list: string[], condition: boolean, reason: string) => {
    if (condition) list.push(reason);
  };

  const library = { fits: [] as string[], strains: [] as string[] };
  add(library.fits, c.frameworks === 'same' && !native, 'Both products run the same web framework.');
  add(library.fits, c.overlap === 'many', 'Many controls behave the same.');
  add(library.fits, c.releases === 'coordinated', 'Releases are already coordinated.');
  add(library.strains, native, 'A native app cannot use a web library.');
  add(library.strains, c.frameworks === 'different', 'Different frameworks need one library each, or an adapter layer.');
  add(library.strains, c.overlap === 'few', 'Few equivalent controls: components would carry options for both audiences.');
  add(library.strains, c.releases === 'independent', 'Every change ships to both products, so independent releases need careful versioning.');
  add(library.strains, c.ownership === 'part-time', 'A broad library is a lot to own part-time.');
  library.strains.push('A defect or redesign in a shared component reaches both products at once.');

  const core = { fits: [] as string[], strains: [] as string[] };
  add(core.fits, c.overlap === 'few', 'Shares only the equivalent controls; each product extends the rest.');
  add(core.fits, c.releases === 'independent', 'A small, versioned core is easier to upgrade on separate schedules.');
  add(core.fits, c.brands === 'distinct', 'Product extensions and token overrides absorb brand differences.');
  add(core.strains, native, 'The core can serve only the web products; the native app shares specifications.');
  add(core.strains, c.frameworks === 'different', 'A cross-framework core needs Web Components or two implementations.');
  add(core.strains, c.ownership === 'part-time', 'Someone must decide what is core and review extensions.');
  core.strains.push('The line between core and extension needs ongoing judgement, or extensions quietly become forks.');

  const specs = { fits: [] as string[], strains: [] as string[] };
  add(specs.fits, native, 'Works across native and web platforms.');
  add(specs.fits, c.frameworks === 'different', 'No shared code across frameworks to maintain.');
  add(specs.fits, c.ownership === 'part-time', 'A small shared surface: tokens and written specifications.');
  add(specs.strains, c.overlap === 'many', 'Many equivalent controls are built and tested more than once.');
  specs.strains.push('Accessibility fixes must be repeated in each implementation.');

  const separate = { fits: [] as string[], strains: [] as string[] };
  add(separate.fits, c.brands === 'distinct', 'Distinct brands need little visual alignment.');
  add(separate.fits, c.overlap === 'few', 'Few controls would be shared anyway.');
  add(separate.fits, c.releases === 'independent', 'No coordination cost between releases.');
  add(separate.strains, c.overlap === 'many', 'Equivalent controls drift apart, and people who use both products notice.');
  add(separate.strains, c.brands === 'family', 'A shared brand will drift without shared values.');
  separate.strains.push('Every improvement, including accessibility fixes, is made twice.');

  const byId = { library, core, specs, separate };
  return approaches.map((approach) => ({ id: approach.id, name: approach.name, ...byId[approach.id] }));
}

/** Evidence a pilot should produce before the choice is final. */
export function pilotQuestions(chosen: Constraints): string[] {
  const c = effective(chosen);
  const questions = [
    'Build one equivalent flow, such as a form, in both products. Where did a shared component need a product-only option?',
    'Test the shared controls with touch on a phone and with a keyboard on a desktop. Do target sizes and focus behavior hold up in both densities?',
  ];
  if (c.overlap === 'many') questions.push('Confirm the overlap: list the controls both products use and compare their states, keyboard behavior and content.');
  if (c.mobile !== 'web') questions.push('Build one control natively and on the web from the same specification. How long did parity take, and what still differs?');
  if (c.frameworks === 'different') questions.push('Wrap one form control for both frameworks. How much wrapper code was needed, and does the control join each framework’s forms?');
  if (c.releases === 'independent') questions.push('Ship a breaking change to a shared package. How long does each product take to adopt it?');
  if (c.ownership === 'part-time') questions.push('Track review time for shared changes. Can part-time owners keep up?');
  return questions;
}
