/**
 * How sharing between the patient app (a guided product for patients, mostly on phones) and the provider workspace (a
 * dense desktop tool for clinic staff) shifts with a few constraints. It lists reasons, strains and
 * open questions per layer and per approach, and offers a conditional starting point with the
 * evidence that would overturn it. It never scores the approaches.
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
    label: 'The patient app is built as',
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
    label: 'Product release schedules',
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

export interface Preset {
  id: string;
  name: string;
  description: string;
  values: Constraints;
}

/** Named starting points. The first is the scenario itself. */
export const presets: readonly Preset[] = [
  {
    id: 'react',
    name: 'Two React products',
    description: 'The scenario: both are web apps on React, with related brands, few equivalent controls, their own release schedules and a dedicated core team.',
    values: defaultConstraints,
  },
  {
    id: 'frameworks',
    name: 'Different web frameworks',
    description: 'The patient app and the provider workspace on different web frameworks, such as React and Angular. Everything else as in the scenario.',
    values: { ...defaultConstraints, frameworks: 'different' },
  },
  {
    id: 'native-web',
    name: 'Native plus web',
    description: 'The patient app ships a native app as well as its responsive web app. The provider workspace stays on the web, on the same framework as the patient web app.',
    values: { ...defaultConstraints, mobile: 'both' },
  },
  {
    id: 'distinct-small',
    name: 'Distinct brands, small team',
    description: 'Two unrelated brands, few equivalent controls, and a few part-time owners instead of a dedicated team.',
    values: { ...defaultConstraints, brands: 'distinct', ownership: 'part-time' },
  },
];

export const sameConstraints = (a: Constraints, b: Constraints) => constraintIds.every((id) => a[id] === b[id]);

export const presetFor = (values: Constraints) => presets.find((preset) => sameConstraints(preset.values, values));

const optionLabel = (id: ConstraintId, value: string) => constraints.find((c) => c.id === id)?.options.find((o) => o.value === value)?.label ?? value;
const constraintLabel = (id: ConstraintId) => constraints.find((c) => c.id === id)?.label ?? id;

/** Reads constraints from a URL. A missing or unrecognised value falls back to the scenario's default. */
export function parseConstraints(search: URLSearchParams): Constraints {
  const values = { ...defaultConstraints };
  for (const constraint of constraints) {
    const value = search.get(constraint.id);
    if (value !== null && constraint.options.some((option) => option.value === value)) values[constraint.id] = value;
  }
  return values;
}

/** Every constraint, explicitly, so a shared link reproduces the scenario even if the defaults change. */
export const constraintsToSearch = (values: Constraints) => new URLSearchParams(constraintIds.map((id) => [id, values[id]]));

/** Whether a URL carries any constraint value that parsing would ignore or replace. */
export const hasInvalidConstraints = (search: URLSearchParams) =>
  constraints.some((constraint) => {
    const value = search.get(constraint.id);
    return value !== null && !constraint.options.some((option) => option.value === value);
  });

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

/** Layer by layer: how much to share, and why, for these constraints. Web code and the native app are assessed separately. */
export function assessLayers(chosen: Constraints): LayerAssessment[] {
  const c = effective(chosen);
  const nativeOnly = c.mobile === 'native';
  const hasNative = c.mobile !== 'web';
  const webPair = c.mobile === 'both' ? 'The patient web app and the provider workspace' : 'The patient app and the provider workspace';

  const tokens: LayerAssessment =
    c.brands === 'family'
      ? {
          layer: 'Visual language and tokens',
          leaning: 'share',
          because: `One token source with product overrides for brand roles and shape${hasNative ? ', built as CSS for the web and exported to the native platform’s format' : ''}.`,
        }
      : {
          layer: 'Visual language and tokens',
          leaning: 'partial',
          because: 'Align what users rely on across brands, such as status colors, focus and spacing steps; keep brand values in each product.',
        };

  const behavior: LayerAssessment =
    c.overlap === 'many'
      ? {
          layer: 'Component behavior (specifications)',
          leaning: 'share',
          because: `Many controls mean the same thing in both products, so one specification for states, keyboard and accessibility avoids solving them twice${hasNative ? '. It is also the layer the native app shares' : ''}.`,
        }
      : {
          layer: 'Component behavior (specifications)',
          leaning: 'partial',
          because: `Only the genuinely equivalent controls, typically form fields, buttons, alerts and dialogs. Dense tables and guided steps behave differently by design${hasNative ? '. The native app follows the same specifications' : ''}.`,
        };

  let code: LayerAssessment;
  if (nativeOnly) {
    code = {
      layer: 'Component code (web)',
      leaning: 'separate',
      because: 'Only the provider workspace is on the web, so there is no second web product to share code with. The native patient app shares tokens and specifications instead.',
    };
  } else if (c.frameworks === 'different') {
    code = {
      layer: 'Component code (web)',
      leaning: 'partial',
      because: `${webPair} use different frameworks. Share framework-neutral components, such as custom elements, only for complex equivalent controls. Whether a host needs an adapter depends on how it passes properties and events and joins forms, and on each component’s contract.`,
    };
  } else {
    code = {
      layer: 'Component code (web)',
      leaning: c.overlap === 'many' ? 'share' : 'partial',
      because: `${webPair} use the same framework, so one library can serve both${c.overlap === 'few' ? ', limited to the equivalent controls' : ''}.`,
    };
  }

  const native: LayerAssessment[] = hasNative
    ? [
        {
          layer: 'The native patient app',
          leaning: 'partial',
          because: 'Shares the exported tokens and the behavior specifications. Its code is native, so it is written and tested on its platform, not shared with either web product.',
        },
      ]
    : [];

  return [
    { layer: 'Principles', leaning: 'share', because: 'Cheap to share, and they keep decisions consistent even where the products differ.' },
    tokens,
    behavior,
    code,
    ...native,
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
          ? `One owning team, shared build and checks. ${
              c.releases === 'independent'
                ? 'Packages are versioned, so each product adopts a release when it is ready, and older major versions are supported for an agreed window.'
                : 'Products upgrade together, so one supported version is usually enough.'
            }`
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
  const nativeOnly = c.mobile === 'native';
  const both = c.mobile === 'both';
  const sameWeb = !nativeOnly && c.frameworks === 'same';
  const add = (list: string[], condition: boolean, reason: string) => {
    if (condition) list.push(reason);
  };

  const library = { fits: [] as string[], strains: [] as string[] };
  add(library.fits, sameWeb, 'Both web products run the same framework, so one library can serve them.');
  add(library.fits, c.overlap === 'many', 'Many controls behave the same.');
  add(library.fits, c.releases === 'coordinated', 'Products upgrade together, so one supported version is enough.');
  add(library.strains, nativeOnly, 'Only the provider workspace is on the web, so a web library has one consumer.');
  add(library.strains, both, 'It serves the patient web app and the provider workspace only; the native app needs specifications and exported tokens.');
  add(library.strains, c.frameworks === 'different', 'Different frameworks: one library needs framework-neutral components or an implementation per framework.');
  add(library.strains, c.overlap === 'few', 'Few equivalent controls: components would grow options for both audiences.');
  add(
    library.strains,
    c.releases === 'independent',
    'Products upgrade on their own schedules, so older major versions need support for a window, and a fix reaches each product only when it upgrades.',
  );
  add(library.strains, c.ownership === 'part-time', 'A broad library is a lot to own part-time.');
  library.strains.push('Every breaking change costs each product a migration, even when they take it at different times.');

  const core = { fits: [] as string[], strains: [] as string[] };
  add(core.fits, c.overlap === 'few', 'Shares only the equivalent controls; each product extends the rest.');
  add(core.fits, c.releases === 'independent', 'A small, versioned core lets each product adopt changes when it is ready.');
  add(core.fits, c.brands === 'distinct', 'Product extensions and token overrides absorb brand differences.');
  add(core.strains, nativeOnly, 'Only the provider workspace is on the web, so a shared core has one consumer.');
  add(core.strains, both, 'The core serves the web products; the native patient app follows its specifications instead.');
  add(
    core.strains,
    c.frameworks === 'different',
    'Across frameworks, the core needs framework-neutral components, with adapters only where a host needs them, or one implementation per framework.',
  );
  add(core.strains, c.ownership === 'part-time', 'Someone must decide what is core and review extensions.');
  core.strains.push('The line between core and extension needs ongoing judgement, or extensions quietly become forks.');

  const specs = { fits: [] as string[], strains: [] as string[] };
  add(specs.fits, c.mobile !== 'web', 'Tokens and specifications are the layers that cross from web to native.');
  add(specs.fits, c.frameworks === 'different', 'No component code has to run in two frameworks.');
  add(specs.fits, c.ownership === 'part-time', 'A small shared surface: tokens and written specifications.');
  add(specs.strains, c.overlap === 'many', 'Many equivalent controls are built and tested more than once.');
  add(specs.strains, sameWeb, 'Both web products could share code, but would build each control twice.');
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

export const approachName = (id: ApproachId) => approaches.find((approach) => approach.id === id)?.name ?? id;

export interface Recommendation {
  /** `main` covers the web products, or both products when the patient app is native only; `native` is the native patient app beside its web app. */
  part: 'main' | 'native';
  scope: string;
  approach: ApproachId;
  /** The constraints that support it. */
  because: string[];
  /** Evidence that would overturn it. */
  overturnedBy: string[];
}

function webRecommendation(c: Constraints): Omit<Recommendation, 'part' | 'scope'> {
  if (c.brands === 'distinct' && c.ownership === 'part-time' && c.overlap === 'few') {
    return {
      approach: 'separate',
      because: ['Distinct brands need little visual alignment.', 'Few controls behave the same in both products.', 'Part-time owners cannot sustain a shared library.'],
      overturnedBy: [
        'People who use both products report that the same control behaves differently.',
        'The same accessibility defect keeps being fixed in both products.',
        'A dedicated owner is funded.',
      ],
    };
  }
  if (c.frameworks === 'different') {
    return c.overlap === 'few'
      ? {
          approach: 'specs',
          because: ['The web products use different frameworks.', 'Few controls behave the same, so little code would be shared.'],
          overturnedBy: [
            'A spike shows a complex control, such as a dialog, works as a framework-neutral component in both hosts with little or no adapter code.',
            'Accessibility fixes to the same control keep being made twice.',
          ],
        }
      : {
          approach: 'core',
          because: [
            'Many controls behave the same, so implementing each twice is costly.',
            'Framework-neutral components can serve both frameworks; a host gets a thin adapter only if its property, event or form handling needs one.',
            ...(c.ownership === 'team' ? ['A dedicated team can own the integration testing in both hosts.'] : []),
          ],
          overturnedBy: [
            'A spike needs substantial adapter code, or a control cannot join one framework’s forms.',
            'Server rendering or a performance budget rules out custom elements in one product.',
            ...(c.ownership === 'part-time' ? ['Part-time owners cannot keep up with testing in both hosts.'] : []),
          ],
        };
  }
  if (c.overlap === 'many' && c.releases === 'coordinated' && c.ownership === 'team') {
    return {
      approach: 'library',
      because: ['Both web products use the same framework.', 'Many controls behave the same.', 'Products upgrade together, so one supported version is enough.', 'A dedicated team can own it.'],
      overturnedBy: [
        'The pilot shows shared controls growing options that only one product uses.',
        'Release schedules separate, so several major versions need support.',
      ],
    };
  }
  return {
    approach: 'core',
    because: [
      'Both web products use the same framework, so shared code needs no adapters.',
      c.overlap === 'few' ? 'Few controls behave the same, so the core stays small.' : 'Many controls behave the same, so the core can grow as each proves equivalent.',
      ...(c.releases === 'independent' ? ['Each product upgrades on its own schedule, so the core is versioned.'] : []),
      c.brands === 'family' ? 'Related brands share one token source.' : 'Distinct brands live in product token overrides.',
      ...(c.ownership === 'part-time' ? ['Part-time owners keep the core to a few controls, with a named lead for each.'] : []),
    ],
    overturnedBy: [
      'The pilot form needs product-only behavior in a core control: take that control out of the core.',
      'The exceptions log shows both products overriding the same core control.',
      'A second web framework arrives.',
    ],
  };
}

/** A conditional starting point, never a verdict: each part names what supports it and what would overturn it. */
export function recommend(chosen: Constraints): Recommendation[] {
  const c = effective(chosen);
  if (c.mobile === 'native') {
    return [
      {
        part: 'main',
        scope: 'The native patient app and the provider workspace on the web',
        approach: 'specs',
        because: [
          'The patient app is a native app, so it cannot run the provider workspace’s web components.',
          'Only tokens and behavior specifications cross from web to native.',
          ...(c.overlap === 'many' ? ['Many equivalent controls make a careful shared specification worth writing.'] : []),
        ],
        overturnedBy: ['The patient app adds a web app, so two web products could share code.', 'Behavior drifts between platforms despite the specification, which calls for shared acceptance tests per control.'],
      },
    ];
  }
  const parts: Recommendation[] = [{ part: 'main', scope: c.mobile === 'both' ? 'The patient web app and the provider workspace' : 'The patient app and the provider workspace on the web', ...webRecommendation(c) }];
  if (c.mobile === 'both') {
    parts.push({
      part: 'native',
      scope: 'The native patient app',
      approach: 'specs',
      because: ['Native code cannot run the web components.', 'It uses the tokens exported to its platform’s format and follows the same behavior specifications.'],
      overturnedBy: ['The patient app adopts a cross-platform framework that can share code with its web app.', 'The patient app retires its native app or its web app.'],
    });
  }
  return parts;
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
  if (c.frameworks === 'different')
    questions.push('Build one form control as a framework-neutral component and use it in both frameworks. Does either host need adapter code to pass properties, handle events or join its forms?');
  if (c.releases === 'independent') questions.push('Ship a breaking change to a shared package. How long does each product take to adopt it, and how many versions are in use meanwhile?');
  if (c.ownership === 'part-time') questions.push('Track review time for shared changes. Can part-time owners keep up?');
  return questions;
}

export interface ConstraintChange {
  id: ConstraintId;
  label: string;
  from: string;
  to: string;
}

export function changedConstraints(before: Constraints, after: Constraints): ConstraintChange[] {
  return constraintIds
    .filter((id) => before[id] !== after[id])
    .map((id) => ({ id, label: constraintLabel(id), from: optionLabel(id, before[id] ?? ''), to: optionLabel(id, after[id] ?? '') }));
}

/** One conclusion that changed, with the new reason. `from` or `to` is missing when a layer or part appears or disappears. */
export interface OutcomeChange {
  subject: string;
  from?: string;
  to?: string;
  why: string;
}

export interface OutcomeComparison {
  /** Leanings and starting recommendations that changed. */
  conclusions: OutcomeChange[];
  /** Same conclusion, different reasoning, including approaches that gained or lost a fit or strain. */
  reasoning: OutcomeChange[];
}

/** What a change of constraints changed in the conclusions, and why. */
export function compareOutcomes(before: Constraints, after: Constraints): OutcomeComparison {
  const conclusions: OutcomeChange[] = [];
  const reasoning: OutcomeChange[] = [];

  const beforeLayers = new Map(assessLayers(before).map((layer) => [layer.layer, layer]));
  const afterLayers = assessLayers(after);
  for (const layer of afterLayers) {
    const old = beforeLayers.get(layer.layer);
    if (!old) conclusions.push({ subject: layer.layer, to: leaningLabels[layer.leaning], why: layer.because });
    else if (old.leaning !== layer.leaning) conclusions.push({ subject: layer.layer, from: leaningLabels[old.leaning], to: leaningLabels[layer.leaning], why: layer.because });
    else if (old.because !== layer.because) reasoning.push({ subject: layer.layer, why: layer.because });
  }
  for (const [name, old] of beforeLayers) {
    if (!afterLayers.some((layer) => layer.layer === name)) conclusions.push({ subject: name, from: leaningLabels[old.leaning], why: 'This layer no longer applies to these constraints.' });
  }

  const beforeParts = recommend(before);
  for (const part of recommend(after)) {
    const old = beforeParts.find((candidate) => candidate.part === part.part);
    const subject = `Starting point: ${part.scope}`;
    if (!old) conclusions.push({ subject, to: approachName(part.approach), why: part.because.join(' ') });
    else if (old.approach !== part.approach) conclusions.push({ subject, from: approachName(old.approach), to: approachName(part.approach), why: part.because.join(' ') });
    else if (old.because.join() !== part.because.join() || old.scope !== part.scope) reasoning.push({ subject, why: part.because.join(' ') });
  }
  const afterParts = recommend(after);
  for (const old of beforeParts) {
    if (!afterParts.some((part) => part.part === old.part)) {
      const why = after.mobile === 'native' ? 'The patient app is now native only, so the starting point above covers it.' : 'The patient app no longer has a native app.';
      conclusions.push({ subject: `Starting point: ${old.scope}`, from: approachName(old.approach), why });
    }
  }

  const beforeApproaches = new Map(assessApproaches(before).map((approach) => [approach.id, approach]));
  for (const approach of assessApproaches(after)) {
    const old = beforeApproaches.get(approach.id);
    if (!old) continue;
    const gained = [...approach.fits.filter((fit) => !old.fits.includes(fit)).map((fit) => `Now fits: ${fit}`), ...approach.strains.filter((strain) => !old.strains.includes(strain)).map((strain) => `New strain: ${strain}`)];
    const lost = old.fits.filter((fit) => !approach.fits.includes(fit)).length + old.strains.filter((strain) => !approach.strains.includes(strain)).length;
    if (gained.length || lost) reasoning.push({ subject: approach.name, why: [...gained, ...(lost ? [`${lost} earlier ${lost === 1 ? 'reason no longer applies' : 'reasons no longer apply'}.`] : [])].join(' ') });
  }

  return { conclusions, reasoning };
}
