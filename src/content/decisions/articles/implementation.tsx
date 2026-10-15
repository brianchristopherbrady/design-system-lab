import { SourceList } from '@/features/docs';
import { switchElement, switchInReact, switchTypes, switchUsage } from '../switchSketch';
import type { Decision } from '../types';

function RecordedEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'docs/decisions/0001-stack.md', note: 'The brief, the stack, and no component or headless library' },
        { path: 'docs/decisions/0002-design-tokens.md', note: 'DTCG source and the project’s own generator, with the alternatives' },
        { path: 'docs/decisions/0005-reference-site-and-prop-vocabularies.md', note: 'Prop vocabularies shared by components, docs and stories' },
        { path: 'scripts/architecture/boundaries.mjs', note: 'forbiddenPackages: no react-router in the design system or domain' },
        { path: 'scripts/tokens/pipeline.mjs', note: 'The token generator: Node only, no React' },
        { path: 'src/design-system/primitives/Link/Link.tsx', note: 'Routing through context instead of a router dependency' },
      ]}
    />
  );
}

const pipeline = { label: 'Token pipeline', href: '/foundations/tokens#pipeline' };

export const implementation: Decision = {
  id: 'implementation',
  stage: 'Implementation choices',
  question: 'How should the shared components reach Meadow and Harbor, and what changes if their frameworks diverge?',
  matters: 'Every framework a system supports adds integration and testing work in each product that uses it.',
  project: {
    choice:
      'I build the components in React 19 and strict TypeScript, styled with CSS Modules, over tokens generated from framework-free DTCG JSON. There are no Web Components and no component or headless library.',
    constraint:
      'The brief asked for React, a small dependency list and the project’s own design-system surface rather than a styled library (ADR 0001), and for one token source whose build fails on broken references (ADR 0002).',
    tryIt: {
      text: 'Change Button’s appearance in the Playground and switch the product in the header, then follow the same value from its token file to the CSS.',
      links: [
        { label: 'Button in the Playground', href: '/playground?component=button' },
        { label: 'Token pipeline', href: '/foundations/tokens#pipeline' },
      ],
    },
    tradeoff:
      'Components work only in React, and every keyboard model and focus rule is written and tested here, with no upstream library to share fixes. The tokens stay portable to any framework.',
    evidence:
      'ADR 0001 and 0002 record the constraints and the token alternatives. No record explains why Dialog and Tabs were later written by hand, and the repository’s record below says so rather than supplying a history. Lint rejects raw colors in stylesheets, and the token generator fails on DTCG features it does not support.',
    lead: ['current'],
  },
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'Meadow and Harbor are web apps on the same framework. The sharing decision puts form fields, buttons, alerts and dialogs in a versioned core, and tokens in one source.',
      },
    ],
    choice: [
      { evidence: 'proposed', text: 'Build components for the one framework both products use, and keep tokens framework-free.' },
      {
        evidence: 'implemented',
        text: 'This repository makes the same choice: React 19 components styled with CSS Modules, reading tokens generated from DTCG JSON as CSS custom properties.',
        example: pipeline,
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Web Components, used directly or with thin adapters.** One implementation for any framework, but testing in every host, adapters for forms and typing, and server rendering cost more than one framework needs.',
          '**A separate implementation per framework.** Every fix made twice, for a framework neither product uses.',
          '**Shared tokens and CSS only.** Each product would rebuild keyboard and accessibility behavior for the shared controls.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'A fix to a shared control is made once and reaches each product when it upgrades. A product that moved to another framework would get tokens and CSS, not components, until the decision is revisited.',
      },
    ],
    validation: [
      { evidence: 'hypothetical', text: 'The pilot form is built in both products from the same components, with no wrapper or fork.' },
      {
        evidence: 'implemented',
        text: 'In this repository, each component renders in any product mode, theme and density without a code change, and lint rejects raw colors and palette variables in stylesheets.',
        example: { label: 'Button in the Playground', href: '/playground?component=button' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'Either product adopts a second framework that must share complex controls, such as a combobox or date picker. Run the prototype acceptance matrix below before committing.',
      },
    ],
  },
  sections: [
    {
      id: 'current',
      title: 'Design System Lab’s decision',
      blocks: [
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'Design System Lab builds its own React 19 components over framework-free tokens. It has no Web Components and no adapters for other frameworks.',
            'The record below separates what the repository’s decision records state from current analysis. Where the original reasoning was not written down, the statement says so rather than supplying a history.',
          ],
        },
        {
          kind: 'record',
          caption: 'Decision record: how Design System Lab implements its components',
          fields: [
            {
              label: 'Constraints',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'From ADR 0001: the brief asked for React, strict TypeScript, Vite, and CSS Modules with native custom properties, a small and justified dependency list, and the project’s own design-system surface instead of a styled library.',
                  example: { label: 'Components', href: '/components' },
                },
                {
                  evidence: 'implemented',
                  text: 'From ADR 0002: one token source, preferably in the DTCG format, generating CSS custom properties and TypeScript keys, with a build that fails on missing references or cycles.',
                  example: pipeline,
                },
              ],
            },
            {
              label: 'Choice and reasons',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'React 19 function components in strict TypeScript, styled with CSS Modules in cascade layers. No CSS-in-JS runtime and no utility framework (ADR 0001).',
                  example: { label: 'Button in the Playground', href: '/playground?component=button' },
                },
                {
                  evidence: 'implemented',
                  text: 'Tokens are DTCG JSON that the project’s own generator turns into CSS custom properties, TypeScript keys and a manifest. ADR 0002 passes over Style Dictionary and Terrazzo here because they would hide the mechanics the site shows.',
                  example: pipeline,
                },
                {
                  evidence: 'implemented',
                  text: 'No component or headless library. ADR 0001 records that native elements covered every interaction at the time, and prefers a proven accessible headless implementation if a complex widget becomes necessary.',
                  example: { label: 'Switch, on a native checkbox', href: '/components/switch' },
                },
                {
                  evidence: 'proposed',
                  text: 'Current analysis, not recorded rationale: Dialog and Tabs were later written directly rather than on a headless library, and no record explains why. Both stay close to the platform or a documented pattern (the native `<dialog>` element, the APG tabs keyboard model), which keeps the hand-written behavior small. A combobox or date picker would not.',
                },
              ],
            },
            {
              label: 'Alternatives',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'Recorded for tokens in ADR 0002: Style Dictionary or Terrazzo, which it says would be the right call for multi-platform output; hand-written CSS and TypeScript maps, rejected because two sources drift; and `light-dark()` in one block, which shows nested theme scopes less clearly.',
                  example: pipeline,
                },
                {
                  evidence: 'proposed',
                  text: 'Not recorded for components. This page weighs them now: a styled library, a wrapper around one, behavioral primitives and Web Components, in [Build or adopt](/decisions/implementation#adopt) and [Four approaches](/decisions/implementation#approaches).',
                },
              ],
            },
            {
              label: 'Accepted limitations',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'Components work only in React. Their 28 stylesheets are CSS Modules with bundler-generated class names, so another framework could reuse them only by reproducing the markup and the build.',
                  example: { label: 'Components', href: '/components' },
                },
                {
                  evidence: 'implemented',
                  text: 'Accessibility is owned here. Every keyboard model, focus rule and ARIA state is written and tested in this repository, with no upstream library to share fixes.',
                  example: { label: 'Tabs', href: '/components/tabs' },
                },
                {
                  evidence: 'implemented',
                  text: 'Portability is partial. Lint forbids `react-router` in the design system and domain, so `Link` routes through a context, but React itself is allowed everywhere.',
                  example: { label: 'Link', href: '/components/link' },
                },
                {
                  evidence: 'implemented',
                  text: 'The generator supports only the DTCG features the project uses, and fails on others (ADR 0002).',
                  example: pipeline,
                },
              ],
            },
            {
              label: 'Reconsider when',
              statements: [
                {
                  evidence: 'proposed',
                  text: 'A second framework must render the shared components, not only read tokens. Run the [prototype acceptance matrix](/decisions/implementation#matrix) before choosing an approach.',
                },
                { evidence: 'proposed', text: 'A widget needs behavior beyond native elements and documented patterns, such as a combobox or date picker. ADR 0001 already points to a proven headless implementation.' },
                { evidence: 'proposed', text: 'Tokens are needed on another platform, such as native apps. ADR 0002 names Style Dictionary or Terrazzo as the right tools for that.' },
                { evidence: 'proposed', text: 'Fixing behavior here costs more than adopting and retesting a library’s, judged by defects and fixes in shared components over a release cycle.' },
              ],
            },
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The decision records and code behind this record. Each file opens in place.',
          Visual: RecordedEvidence,
        },
      ],
    },
    {
      id: 'layers',
      title: 'Tokens versus components',
      blocks: [
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: ['The token layer is independent of any framework: JSON in, CSS and TypeScript out. The components are React code throughout. The stylesheets and tests sit in between.'],
        },
        {
          kind: 'table',
          caption: 'What a second framework could reuse today',
          evidence: 'implemented',
          stacked: true,
          columns: ['Part', 'Where', 'Framework-independent?', 'What another framework would get'],
          rows: [
            ['Token source', '`src/design-system/tokens/source/`: DTCG JSON, with a resolver for theme, product and density', 'Yes', 'Everything. Any build can read the files.'],
            ['Token generator', '`scripts/tokens/pipeline.mjs`', 'Yes', 'A Node script with no React import. It validates the source and writes the CSS, types and manifest.'],
            ['Generated CSS', '`tokens.css`, switched by `data-theme`, `data-product` and `data-density`', 'Yes', 'Every theme, product and density, for any markup that loads the file and sets the attributes.'],
            ['Token types and helpers', '`tokens.ts` and `manifest.ts` (generated), `policy.ts`, `resolve.ts`, `vocabulary.ts`', 'Yes, as TypeScript', 'Typed token names and prop vocabularies with no React import. A JavaScript-only host would use the compiled output.'],
            ['Component stylesheets', '28 CSS Modules', 'Partly', 'Plain CSS that reads only tokens, but the bundler generates the class names and each selector assumes its component’s markup.'],
            ['Components', '30 React components in layout, primitives and composites', 'No', 'Nothing directly. Props use React’s element prop types, refs are props, `Field` passes ids to render-function children, and `ThemeScope` and `Link` use context.'],
            ['Tests', 'Vitest with Testing Library; Playwright with axe', 'Partly', 'Unit tests render React. Browser tests find elements by role, name and key on the built site, so they describe behavior any implementation must keep.'],
          ],
        },
      ],
    },
    {
      id: 'adopt',
      title: 'Build or adopt',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['In any framework, components can be adopted from a library, wrapped, assembled from behavioral primitives, or written directly. The first three options are general; the last describes this repository.'],
        },
        {
          kind: 'table',
          caption: 'Four ways to get components, compared on seven tradeoffs',
          evidence: ['proposed', 'implemented'],
          stacked: true,
          columns: ['Option', 'Customization', 'Accessibility ownership', 'API stability', 'Dependency upgrades', 'Maintenance', 'Performance', 'Migration'],
          rows: [
            [
              'An existing component library',
              'Within its theming API. Brand or density changes beyond it mean overriding its internals.',
              'Its maintainers own keyboard and ARIA behavior. You own how it is used, and still test it.',
              'Set by the library. Its breaking changes reach every call site.',
              'One large dependency. An upgrade can change markup, styles and behavior at once.',
              'Lowest, while its scope matches yours.',
              'You ship its runtime and styling approach, whether or not you use all of it.',
              'Hardest to leave: product code calls its API directly.',
            ],
            [
              'A wrapper around a library',
              'Your API, its limits: options the library lacks stay out of reach.',
              'Shared: the library’s behavior, plus whatever the wrapper adds or changes.',
              'Yours. The wrapper absorbs the library’s changes.',
              'Contained in the wrapper, which is retested on each upgrade.',
              'The wrapper, plus tracking the library.',
              'The library’s cost plus a thin layer.',
              'Easiest to leave: replace the implementation behind the same API.',
            ],
            [
              'Behavioral primitives (headless)',
              'Full control of markup and styles.',
              'The primitives own the hardest behavior, such as focus management and keyboard models. You own names, semantics and visible states.',
              'Your styled components keep their API; changes in the primitives stay inside them.',
              'Smaller than a styled library, but behavior changes still need retesting.',
              'Styling and composition are yours; the hardest behavior is shared with everyone using the primitives.',
              'Behavior code only; the styles are yours.',
              'Moderate: behavior is wired into each component.',
            ],
            [
              'Directly authored (this repository)',
              'Complete. Every visual prop takes a named value that maps to a token, and product, theme and density are attributes.',
              'Entirely yours. Keyboard models, focus rules and ARIA states are written and tested here.',
              'Yours. Components, docs and stories import the same option arrays, and tests fail when they drift.',
              'Only React and the platform: three runtime libraries plus four font packages.',
              'Highest. Every fix is made here.',
              'Only what you write.',
              'Your API, but the behavior is React code; another framework means rewriting it.',
            ],
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            'Directly authored components cost the most to maintain and the least to change. That suits a small surface built mostly on native elements, which is what this repository has. Behavioral primitives become the better trade once a widget’s keyboard and focus model outgrows native elements, as ADR 0001 anticipates.',
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
          caption: 'Ways to support more than one framework',
          evidence: 'proposed',
          columns: ['Approach', 'What is shared', 'Fits when', 'Costs'],
          rows: [
            ['Components for one framework', 'Components, tokens and CSS', 'Every product uses the same framework, now and for the foreseeable future.', 'Products on another framework get only tokens and CSS.'],
            ['A separate implementation per framework', 'Tokens, CSS and written specifications', 'Two frameworks, each with a large team, and behavior that can be specified precisely.', 'Every fix and feature is made twice, and behavior drifts without parity reviews.'],
            ['Shared tokens and CSS only', 'Values and class names', 'Many stacks, including server-rendered pages, and mostly simple controls.', 'Interactive behavior and accessibility are rebuilt by each product.'],
            [
              'Web Components (custom elements)',
              'One implementation of each control, used directly or through thin adapters',
              'Several frameworks must share complex controls, and a team can own testing in every host.',
              'Testing in every framework, plus adapters where a host’s forms, typing or conventions need them. Styling and accessibility across shadow boundaries need care.',
            ],
          ],
        },
      ],
    },
    {
      id: 'web-components',
      title: 'What Web Components require',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Choosing Web Components is not one decision. For each concern, the table separates what works with direct integration from what an optional adapter adds. Framework behavior comes from each framework’s documentation, listed under Sources; the React behavior is also checked by a test in this repository.',
          ],
        },
        {
          kind: 'table',
          caption: 'Direct integration and optional adapters, by concern',
          evidence: 'conceptual',
          stacked: true,
          columns: ['Concern', 'Direct integration', 'What an optional adapter adds'],
          rows: [
            [
              'Host setup',
              'React 19 needs none. Vue’s compiler must be told which tags are custom elements (`compilerOptions.isCustomElement`). Angular components or modules that use them declare `CUSTOM_ELEMENTS_SCHEMA`.',
              'Nothing beyond that configuration.',
            ],
            [
              'Attributes and properties',
              'Attributes are strings and work in plain HTML and server-rendered markup; rich values need properties. React 19 sets a prop as a property when the element defines one, and otherwise as an attribute, so an object passed before the element is defined arrives as the string "[object Object]". Vue sets a property when the key is `in` the element, and `.prop` forces one. Angular’s `[checked]` binding sets the property.',
              'A wrapper can hide the split and hold rich values until the element is defined.',
            ],
            [
              'Events',
              'Standard events such as `change` and `input` need no mapping. React 19 listens on the element with `on` plus the exact event name (`onchange`, `onsay-hi`); React’s own `onChange` sees only events that bubble. Vue uses `@change` and Angular `(change)`.',
              'Framework-style callbacks, where teams expect `onChange` props or Angular outputs.',
            ],
            [
              'Forms',
              'A form-associated element (`static formAssociated = true`) submits through `ElementInternals.setFormValue()`, reports validity with `setValidity()`, and receives reset, disabled and state-restore callbacks. Native forms need nothing else.',
              'A bridge to a framework’s form library. Angular forms reach custom controls through a `ControlValueAccessor` (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`).',
            ],
            [
              'Accessibility',
              '`ElementInternals` gives the element a default role and states, which page authors can override. `<label for>` and ARIA ID references resolve within one tree: they reach the host element, not into its shadow root.',
              'Nothing. An adapter cannot carry ID references across a shadow root.',
            ],
            [
              'Styling',
              'CSS custom properties pass into shadow roots, so tokens still apply, and `::part()` exposes chosen internals. Other page styles stop at the boundary.',
              'Nothing.',
            ],
            [
              'Slots',
              'Children rendered by any framework become the element’s light-DOM children, fill its slots, and stay styleable and accessible from the page.',
              'Nothing; named slots use the standard `slot` attribute.',
            ],
            [
              'Server rendering',
              'Declarative shadow DOM (`<template shadowrootmode="open">`) lets a server send a shadow root, but something must generate that markup. React 19 renders strings, numbers and `true` as attributes on the server, and omits `false`, objects and functions.',
              'A server renderer for the elements, in each host that renders on the server.',
            ],
            [
              'Typing',
              'None. To a framework’s type checker the tag is unknown, or, under Angular’s schema, accepted without checks.',
              'Declarations: `JSX.IntrinsicElements` for React (see the example below) and `GlobalComponents` for Vue. In Angular, a wrapper directive with typed inputs.',
            ],
            ['Testing', 'Each element on its own, in every supported browser.', 'Each adapter inside its framework, including forms and focus.'],
          ],
        },
      ],
    },
    {
      id: 'matrix',
      title: 'Prototype acceptance',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            'Before committing to a multi-framework architecture, build one form control as a custom element and run it in every host framework. A row passes for a host only when its evidence exists. The last column records whether direct integration was enough.',
          ],
        },
        {
          kind: 'table',
          caption: 'Prototype acceptance matrix, filled in once per host',
          evidence: 'proposed',
          stacked: true,
          columns: ['Concern', 'Accept when', 'Evidence', 'Direct or adapter'],
          rows: [
            [
              'Properties',
              'The control takes `checked` as a property and as an attribute, set before and after the element is defined, and every order ends in the same state.',
              'A test per host for each order.',
              'Expected direct. Record any host that needs a wrapper to hold rich values until the definition loads.',
            ],
            [
              'Events',
              'Each host receives one `input` and one `change` per user action and can read the new state from the event target.',
              'Listener call counts per host, including after the element moves in the page.',
              'Direct. An adapter only for framework-style callbacks.',
            ],
            [
              'Forms',
              'The value submits, reset restores the default, disabled controls are skipped, and each host’s form library reads and writes the state.',
              'Submitted form data before and after reset, and a form-library test per host.',
              'Direct for native forms. Angular forms need a `ControlValueAccessor`.',
            ],
            [
              'Focus',
              'Tab reaches the control, Space and label clicks toggle it, focus is visible in every product and theme, and focus survives host re-renders.',
              'A keyboard walk per host, and an accessibility-tree snapshot with role, name and checked state.',
              'Direct.',
            ],
            [
              'Styling',
              'Tokens apply in every product, theme and density, host styles cannot break the internals, and exposed parts are documented.',
              'Screenshots across the 12 token combinations, and the list of parts and custom properties.',
              'Direct.',
            ],
            [
              'Server rendering',
              'Server-rendered pages show the initial state and layout before JavaScript runs, without hydration warnings.',
              'Screenshots with JavaScript off, and hydration logs from each host that renders on the server.',
              'Depends on the host. Record what generated the markup.',
            ],
            [
              'Typing',
              'Each host’s type checker rejects a wrong property or event type in templates and JSX.',
              'A deliberate type error caught in each host, and the declarations to publish.',
              'Adapter: type declarations per host.',
            ],
            [
              'Host integration',
              'Each host’s rendering, routing and test tools work with the element, using only documented configuration.',
              'The configuration each host needed, and the host’s existing tests passing with the element in place.',
              'Direct with configuration: none for React 19, `isCustomElement` for Vue, `CUSTOM_ELEMENTS_SCHEMA` for Angular.',
            ],
          ],
        },
        { kind: 'text', evidence: 'proposed', paragraphs: ['Before anyone commits to an architecture, the prototype must provide:'] },
        {
          kind: 'list',
          items: [
            'The matrix, filled in per host, with each pass linked to a test that runs in continuous integration.',
            'An adapter inventory: what each adapter does (types, events, forms) and its size, so “thin” is measured rather than assumed.',
            'A screen reader pass per host, with at least one screen reader on each platform the products support.',
            'Bundle size and runtime cost per host, compared with the current React component.',
            'Server-rendered output and hydration logs from each host that renders on the server.',
            'The ongoing test matrix of hosts and browsers, and the team that owns it.',
            'Pass rules agreed before the prototype starts. For example: stop if any host needs more than type declarations and a form adapter.',
          ],
        },
      ],
    },
    {
      id: 'example',
      title: 'A conceptual example',
      blocks: [
        {
          kind: 'text',
          evidence: 'conceptual',
          paragraphs: [
            'The sketch has one purpose: to show how a custom element joins a native form and the accessibility tree. It renders nothing visible and is not part of this design system. A browser test in this repository runs this exact code.',
          ],
        },
        {
          kind: 'code',
          evidence: 'conceptual',
          language: 'js',
          caption:
            'The checked attribute sets the initial state and remains the default. Attribute changes apply until the state is changed, as with a native checkbox; reset restores the default; listeners are added once, in the constructor.',
          code: switchElement,
        },
        {
          kind: 'code',
          evidence: 'conceptual',
          language: 'html',
          caption: 'A native label names the switch. The form submits updates=on when it is on and nothing when it is off, and Reset restores the default.',
          code: switchUsage,
        },
        {
          kind: 'details',
          items: [
            {
              summary: 'Using the sketch from React 19',
              blocks: [
                {
                  kind: 'code',
                  evidence: 'conceptual',
                  language: 'tsx',
                  caption:
                    'Direct integration, no wrapper. React sets checked as a property because the element defines one, and onchange listens for the native change event. A form reset restores the element’s default without an event, so React state must be reset as well.',
                  code: switchInReact,
                },
                {
                  kind: 'code',
                  evidence: 'conceptual',
                  language: 'ts',
                  caption: 'An optional adapter at its smallest: declarations only, so TypeScript checks the props and rejects, for example, a string for checked.',
                  code: switchTypes,
                },
              ],
            },
          ],
        },
        {
          kind: 'table',
          caption: 'What the sketch covers, and what it leaves out',
          evidence: 'conceptual',
          columns: ['Concern', 'In the sketch'],
          rows: [
            ['Initial state', 'Role, checked state and form value come from the checked attribute when the element upgrades, before any interaction.'],
            ['Attribute changes', 'Applied while the state is untouched. After the state changes, the attribute is only the default, as with a native checkbox.'],
            ['Reset', '`formResetCallback` restores the default. As with native controls, no event fires.'],
            ['Listener lifecycle', 'Listeners are added once, in the constructor, on the element itself. Moving it cannot duplicate them, and there is nothing to remove.'],
            ['Disabled', 'In Chromium, a disabled form-associated element, directly or through a fieldset, cannot be focused, ignores user clicks and is not submitted. The toggle also ignores scripted clicks. There is no disabled styling.'],
            ['State restore', '`formStateRestoreCallback` restores the saved state. It is not tested.'],
            ['Left out', 'Any visual design or focus indicator, shadow DOM, `required` and validity, read-only, `formDisabledCallback`, right-to-left layout, server rendering, Firefox and Safari, and screen-reader testing.'],
          ],
        },
      ],
    },
    {
      id: 'deciding',
      title: 'How I would decide',
      blocks: [
        { kind: 'text', evidence: 'proposed', paragraphs: ['Each step below ends with where Meadow and Harbor land.'] },
        {
          kind: 'steps',
          items: [
            {
              title: 'List the frameworks and their lifespans',
              text: 'Count the frameworks in production and the ones being retired. A framework that will be gone in a year does not need an adapter.',
              note: { evidence: 'hypothetical', text: 'One framework in both products, and none being retired.' },
            },
            {
              title: 'Find the controls worth sharing',
              text: 'Shared code pays off for controls with complex behavior, such as comboboxes, date pickers and dialogs. Simple controls can share tokens and CSS.',
              note: { evidence: 'hypothetical', text: 'Form fields, buttons, alerts and dialogs. Dialogs have the most complex behavior.' },
            },
            {
              title: 'Prototype one form control in every host',
              text: 'Build one control as a custom element, use it directly in each framework, add adapters only where the acceptance matrix shows a need, and collect the evidence listed above.',
              note: { evidence: 'hypothetical', text: 'Not needed with one host. It becomes the first step if a second framework arrives.' },
            },
            {
              title: 'Compare the costs',
              text: 'Weigh adapter and testing work against building the control once per framework.',
              note: { evidence: 'hypothetical', text: 'With one framework, adapters cost work and save none.' },
            },
            {
              title: 'Decide per layer',
              text: 'Keep tokens framework-free regardless. Decide component code separately, and revisit when the framework mix changes.',
              note: { evidence: 'hypothetical', text: 'Framework-free tokens and components for the shared framework, revisited if either product changes framework.' },
            },
          ],
        },
        {
          kind: 'note',
          title: 'Scope',
          text: 'Moving this project to Web Components would be a separate project. This page records the reasoning and one tested sketch; it does not claim a working implementation.',
        },
      ],
    },
  ],
  sources: ['custom-elements', 'declarative-shadow-dom', 'react-custom-elements', 'vue-custom-elements', 'angular-custom-elements-schema', 'angular-control-value-accessor', 'apg', 'wcag'],
};
