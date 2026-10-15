import { ProductCompositions } from '../ProductCompositions';
import { SharingExplorer } from '../SharingExplorer';
import type { Decision } from '../types';

export const sharing: Decision = {
  id: 'sharing',
  stage: 'Sharing boundaries',
  question: 'What should Meadow, a guided consumer product, share with Harbor, a dense professional application?',
  matters: 'Sharing too much bends components toward options neither product needs; sharing too little means building keyboard and accessibility behavior twice.',
  project: {
    choice:
      'One component tree serves every product mode. A product changes brand colors, typefaces and corner radii through tokens, density changes sizes, and no component is forked or restyled per product.',
    constraint: 'Share behavior only where it is genuinely the same, and let tokens carry what varies, so one fix reaches every product mode.',
    tryIt: {
      text: 'Submit “abc” in both compositions below: the same message and error wiring, in two different presentations. Then change the Product control in the header and watch this whole site restyle.',
      links: [
        { label: 'Two compositions', href: '/decisions/sharing#compositions' },
        { label: 'Products × themes', href: '/foundations/products#matrix' },
      ],
    },
    tradeoff:
      'Product modes prove configurable presentation, not that two real products should share workflows or behavior. That needs evidence from their users and a pilot, which the scenario below works through.',
    evidence:
      'A policy test keeps each product’s overrides to brand colors, typefaces and corner radii, and a browser test checks that both compositions show the same error while their typefaces differ. The scenario and the constraints explorer below are hypothetical and proposed.',
    lead: ['compositions', 'this-site'],
  },
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'Meadow is used occasionally, mostly on phones, touch first and one step at a time. Harbor is used all day at a desk, keyboard first, with tables and bulk actions. Both are web apps on the same framework with related brands, each releases on its own schedule, and the inventory found that only form fields, buttons, alerts and dialogs behave the same in both.',
      },
    ],
    choice: [
      { evidence: 'proposed', text: 'Share principles and tokens, share component code only for controls that behave the same in both products, and keep screens separate.' },
      { evidence: 'proposed', text: 'In approach terms: a versioned shared core with product extensions, so each product upgrades on its own schedule.' },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**One broad shared library.** Every control would carry options for both audiences. Versioning lets each product upgrade when it is ready, but every breaking change still costs both products a migration.',
          '**Shared tokens and guidelines only.** Keyboard and accessibility behavior for the equivalent controls would be built and fixed twice.',
          '**Separate systems.** The least coordination, but status colors, focus styles and fixes would drift apart.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'Someone must own and version the core and decide what belongs in it. Some duplication stays on purpose: Harbor’s tables and Meadow’s guided steps are built separately.',
      },
    ],
    validation: [
      { evidence: 'hypothetical', text: 'The pilot form is built from the core in both products. It passes if neither product forks a core control and each keeps its own layout.' },
      {
        evidence: 'implemented',
        text: 'In this repository, one component tree renders in every product mode with nothing styled per product, and a policy test keeps each product’s overrides to brand colors, typefaces and corner radii.',
        example: { label: 'Products × themes', href: '/foundations/products#matrix' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'Meadow ships a native app, which can share tokens and specifications but not web components, while its web app could still share code with Harbor; the products move to different frameworks; or the exceptions log shows both products overriding the same core control.',
      },
    ],
  },
  sections: [
    {
      id: 'scenario',
      title: 'The scenario',
      blocks: [
        {
          kind: 'table',
          caption: 'Meadow and Harbor: different people, tasks and devices',
          evidence: 'hypothetical',
          columns: ['Aspect', 'Meadow', 'Harbor'],
          rows: [
            ['People', 'Occasional consumers who need guidance', 'Professionals who use it all day'],
            ['Devices', 'Mostly phones', 'Desktops with large screens'],
            ['Tasks', 'A few short, guided tasks', 'Scanning, comparing and acting on many records'],
            ['Density', 'Low', 'High, with tables and bulk actions'],
            ['Input', 'Touch first', 'Keyboard first'],
            ['Platform', 'Responsive web', 'Web, on the same framework as Meadow'],
            ['Releases', 'On its own schedule', 'On its own schedule'],
          ],
        },
      ],
    },
    {
      id: 'questions',
      title: 'Questions to answer first',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['The architecture follows from the answers, so it should not be chosen before them.'],
        },
        {
          kind: 'table',
          caption: 'Questions, why each one changes the answer, and the scenario’s answers',
          evidence: ['proposed', 'hypothetical'],
          wide: true,
          columns: ['Question', 'Why it matters', 'Meadow and Harbor'],
          rows: [
            ['Is the consumer product responsive web, a native app, or both?', 'Web products can share component code. A native app shares only tokens and specifications. If both, decide each part separately.', 'Responsive web.'],
            ['How do the people, tasks, usage frequency and density differ?', 'The more they differ, the less of each screen and pattern can be shared.', 'Sharply: occasional guided use against all-day dense work.'],
            ['Which controls have genuinely equivalent behavior?', 'Only equivalent controls benefit from one implementation. Forcing others together adds options neither product needs.', 'Few: form fields, buttons, alerts and dialogs.'],
            ['What differs in touch targets, keyboard use, accessibility and navigation?', 'A shared control must support both input styles. Size differences can live in density or target tokens.', 'Meadow needs large touch targets; Harbor needs full keyboard use and a compact density.'],
            ['Are the brands, platforms, frameworks and performance budgets compatible?', 'Different frameworks or tight performance budgets raise the cost of shared code. Whether a host needs an adapter depends on the framework and the component’s contract.', 'Yes: related brands on one framework.'],
            ['Can the teams release independently?', 'A shared library does not force shared releases: with versioned packages, each product adopts a change when it is ready, within a support window.', 'Yes, and they want to keep doing so.'],
            ['Who owns shared components, supports their users and resolves exceptions?', 'Without an owner, a shared library decays faster than two separate ones.', 'A small dedicated core team, with one representative from each product.'],
            ['What evidence would the pilot need to provide?', 'Decide in advance which results would change your mind.', 'Whether one form built from the core works in both products without a fork.'],
          ],
        },
      ],
    },
    {
      id: 'approaches',
      title: 'Four approaches',
      blocks: [
        {
          kind: 'table',
          caption: 'Trade-offs of each approach',
          evidence: 'proposed',
          wide: true,
          columns: ['Approach', 'Fit for each product', 'Consistency', 'Maintenance', 'Coordination', 'Migration', 'Release independence'],
          rows: [
            ['One broad shared library', 'Risky: one set of components must suit occasional touch use and dense keyboard work', 'Highest', 'One codebase, but components grow options for both audiences', 'High: both products must agree on every shared control', 'Both products move onto one library', 'Good if versioned: each product upgrades when ready, but every breaking change costs both a migration'],
            ['Shared core with product extensions', 'Good: shared where behavior matches, product-specific elsewhere', 'High for core controls', 'A core plus extensions to review', 'Only core changes need agreement', 'Gradual, control by control', 'Good with a versioned core; fewer breaking changes than a broad library'],
            ['Shared tokens and guidelines, separate implementations', 'Good: each implementation fits its platform', 'Visual consistency; behavior can drift', 'Behavior and accessibility built twice', 'Low', 'Each product moves its own code onto shared tokens', 'High'],
            ['Separate systems with selective alignment', 'Best for each product on its own', 'Only what you choose to align, such as status colors', 'Two systems', 'Lowest', 'Little or none', 'Highest'],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'These are not exclusive. A team can share tokens and three form controls while keeping navigation, tables and the mobile flows separate. Shared tokens are not a prerequisite either: separate systems can still align a few values, such as status colors and focus styles, without sharing a token source.',
          ],
        },
      ],
    },
    {
      id: 'explore',
      title: 'Change the constraints',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'The controls start at the scenario’s constraints. Pick a preset or change a constraint to see which conclusions change and why. The page address keeps the constraints, so **Copy scenario link** shares exactly what you see, and **Reset to the scenario** returns to the start.',
            'There is no score. The starting point names the constraints that support it and the evidence that would overturn it; one strong reason, such as a native app, can outweigh several weak ones. The pilot questions at the end are what would settle it.',
          ],
        },
        { kind: 'visual', evidence: 'proposed', Visual: SharingExplorer },
      ],
    },
    {
      id: 'compositions',
      title: 'Two compositions, one system',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Two demonstrations built from this repository’s components, each inside its product’s scope: a guided step for Meadow and a dense review panel for Harbor. The workflows are invented for the [scenario](/decisions/sharing#scenario), and nothing is sent or saved. They show what can be shared between compositions, not what either product’s users need.',
          ],
        },
        {
          kind: 'visual',
          evidence: ['implemented', 'hypothetical'],
          caption: 'Demonstrations: real components and tokens, invented workflows.',
          Visual: ProductCompositions,
        },
        {
          kind: 'table',
          caption: 'What the two compositions share, what differs, and why',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Part', 'Shared', 'Differs', 'Why'],
          rows: [
            [
              'Components',
              'Field, Input and Button, with the same props. Nothing is forked or restyled locally.',
              'Only Meadow uses RadioGroup cards; only Harbor uses Checkbox rows and status Badges.',
              'Each control behaves the same wherever it appears, so one implementation serves both.',
            ],
            [
              'Tokens',
              'The same semantic roles.',
              'The product scope re-points brand colors, typefaces and corner radii, and Harbor’s scope is compact.',
              'Brand and density are presentation, which tokens carry without new components.',
            ],
            [
              'Validation',
              'One email rule, one message, the same error wiring, and focus moves back to the field.',
              'Meadow checks on Continue, Harbor on Save; both check only on submit.',
              'Equivalent behavior, which [requirements R5 and R6](/decisions/planning#outputs) ask for in both products.',
            ],
            [
              'Composition',
              'Nothing.',
              'Meadow asks one question per step with a full-width action. Harbor shows a live filter, compact rows, selection and a bulk action.',
              'Different tasks and frequency, so each product composes its own screens ([finding I7](/decisions/planning#inventory)).',
            ],
          ],
        },
        {
          kind: 'table',
          caption: 'Appearance and behavior vary independently. Try both cases above.',
          evidence: 'implemented',
          stacked: true,
          columns: ['Case', 'Where', 'Looks', 'Behaves', 'So'],
          rows: [
            [
              'Matching appearance, different behavior',
              'Harbor’s “Filter records” and “Notify by email” fields.',
              'Identical: the same Field and Input in the same scope.',
              'The filter narrows the list on every keystroke and never shows an error. The email field waits for Save, then validates.',
              'Behavior belongs to the composition. Sharing the input does not mean sharing a filter or search component ([finding I8](/decisions/planning#similar)).',
            ],
            [
              'Different appearance, matching behavior',
              'The email fields in Meadow and Harbor. Submit “abc” in each.',
              'Different typeface, color, corner radius and size.',
              'The same message and error wiring, and focus returns to the field.',
              'Share the behavior; let tokens vary the look.',
            ],
          ],
        },
      ],
    },
    {
      id: 'this-site',
      title: 'What this site’s product modes show',
      blocks: [
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'The header switches this site between three product modes (Design System Lab, Harbor and Meadow), light and dark themes, and comfortable and compact density. One token source drives all twelve combinations, and no component knows which one is active.',
            'Here Harbor and Meadow are presentation modes only; the scenario borrows their names. They demonstrate **configurable presentation**: brand colors, typefaces, shape and density vary without forking components. They do not show that a guided consumer product and a dense professional application should share workflows or component behavior. That needs evidence from their users and a pilot.',
          ],
        },
        {
          kind: 'evidence',
          items: [
            { label: 'Products and modes', href: '/foundations/products', shows: 'What each product and density changes, computed from the token build.' },
            { label: 'Theme studio', href: '/foundations/theme-studio', shows: 'A new product theme generated from one brand color, with contrast checks.' },
            { label: 'Button in the Playground', href: '/playground?component=button', shows: 'One component previewed in any product, theme and density.' },
          ],
        },
      ],
    },
  ],
  sources: ['teams', 'criteria'],
};
