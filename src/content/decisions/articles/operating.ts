import type { Decision } from '../types';

export const operating: Decision = {
  id: 'operating',
  stage: 'Validation and operating practices',
  question: 'Once Meadow and Harbor depend on the shared core, how is it kept healthy, and how would anyone know it is working?',
  matters: 'Without named owners and a record of exceptions, products quietly copy and change shared components, and the system stops being shared.',
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'Meadow and Harbor release on their own schedules and both depend on the versioned core. Their old controls stay in place until each screen moves over, and neither team can pause feature work for a migration.',
      },
    ],
    choice: [
      { evidence: 'proposed', text: 'Name owners, log exceptions, migrate gradually and measure a few outcomes against baselines.' },
      {
        evidence: 'proposed',
        text: 'A small core team owns the system, with one representative each from Meadow and Harbor. Changes follow one written contribution path, releases are versioned, and new parts start as experimental.',
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Harbor’s team shares its own library.** Quickest to start, but Meadow’s needs would always come second.',
          '**Part-time owners from both products only.** Both have a say, but decisions stall without a core that writes them down.',
          '**Migrate everything at once.** One switch, but both products would pause feature work, and old and new focus handling would mix part-way through.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'The core team is a standing cost, and product teams wait for review on core changes. The exceptions log has to be read every month, or products will fork rather than wait.',
      },
    ],
    validation: [
      {
        evidence: 'proposed',
        text: 'Four measures, each with a baseline taken before migration and a note on how it could mislead.',
        example: { label: 'A few measures', href: '/decisions/operating#measures' },
      },
      {
        evidence: 'implemented',
        text: 'This repository checks its own rules in every build and test run: maturity labels have tested requirements, documentation is tested against the code, and browser tests run accessibility scans, keyboard checks and 320 pixel reflow. Adoption and delivery time are not measured, because there are no product teams.',
        example: { label: 'What this project checks', href: '/decisions/operating#checked' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'The exceptions log shows both products asking for the same thing, review waits start delaying releases, or a measure stops moving after its baseline.',
      },
    ],
  },
  sections: [
    {
      id: 'ownership',
      title: 'Ownership and contribution',
      blocks: [
        {
          kind: 'table',
          caption: 'Three team models',
          evidence: 'proposed',
          columns: ['Model', 'How it works', 'Works well when', 'Watch for'],
          rows: [
            ['Solitary', 'One product team shares its own library with everyone else.', 'There is one main product and little time.', 'Other products’ needs always come second.'],
            ['Centralized', 'A dedicated team builds and supports the system for product teams.', 'There are several products and budget for a team.', 'The team loses touch with real product problems.'],
            ['Federated', 'Designers and engineers from product teams decide together, part-time.', 'Product teams have capacity and want a say.', 'Decisions stall without a small core that writes them down.'],
          ],
        },
        {
          kind: 'text',
          paragraphs: ['Most organizations combine models: a small core maintains the system, and representatives from product teams help decide what goes in. Changes follow the same path whoever proposes them.'],
        },
        {
          kind: 'steps',
          items: [
            { title: 'Propose', text: 'Show the part is **useful** (teams need it) and **unique** (nothing in the system already does it).' },
            { title: 'Build', text: 'Show it is **usable** (tested with people), **consistent** with the rest of the system, and **versatile** enough for more than one context.' },
            { title: 'Review', text: 'An owner checks it against a written list: tokens only, accessibility, documentation and tests.' },
            { title: 'Release as experimental', text: 'New parts start as experimental and earn their way to stable.' },
          ],
        },
        {
          kind: 'note',
          title: 'When the system lacks something',
          text: 'The product builds it, logs what it built and why, and owners review the log with product teams each month. If Meadow and Harbor both need the same thing, it becomes a candidate for the system.',
        },
      ],
    },
    {
      id: 'releases',
      title: 'Versions, maturity and retirement',
      blocks: [
        {
          kind: 'table',
          caption: 'Practices in this project, and for Meadow and Harbor',
          evidence: ['implemented', 'proposed'],
          columns: ['Practice', 'In this project', 'For Meadow and Harbor'],
          rows: [
            ['Maturity labels', 'Implemented. Experimental, beta, stable and deprecated have written requirements, and tests check that stable components are tested and used.', 'The same, with the label shown wherever the component is documented.'],
            ['Versioning', 'Not applicable: one site, released together.', 'Semantic versioning: a major version for breaking changes, minor for features, patch for fixes.'],
            ['Changelog', 'Implemented. The catalog’s changelog feeds the [activity dashboard](/patterns/activity-dashboard) pattern.', 'Every release says what changed and why, with migration notes for breaking changes.'],
            ['Deprecation', 'Supported by the deprecated label; nothing is deprecated yet.', 'A deprecation names its replacement and the release that removes it.'],
            ['Design-to-code alignment', 'Not applicable: there is no design-tool library.', 'Component properties in the design tool use the same names and values as props in code, and reviews check them.'],
          ],
        },
      ],
    },
    {
      id: 'migration',
      title: 'Migrating existing products',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['Meadow and Harbor keep shipping while they move. Migrate in small, reversible steps, and stop adding new debt before paying down the old.'],
        },
        {
          kind: 'steps',
          items: [
            { title: 'Tokens', text: 'Replace raw values with tokens. Screens should look the same afterwards, so compare screenshots.' },
            {
              title: 'Guard rails',
              text: 'Add a lint rule that fails new raw values and only reports old ones, then make it strict when the count reaches zero.',
              note: {
                evidence: 'implemented',
                text: 'This repository runs the strict version: `check-styles.mjs` rejects any raw color.',
                example: { label: 'What this project checks', href: '/decisions/operating#checked' },
              },
            },
            { title: 'Primitives', text: 'Swap buttons, inputs and checkboxes, most used first. A wrapper with the old name can keep existing call sites working.' },
            { title: 'Composite components', text: 'Replace a whole dialog or menu at once. Mixing old and new focus handling breaks both.' },
            { title: 'Patterns', text: 'Adopt patterns when a team rebuilds a flow anyway.' },
            { title: 'Clean up', text: 'Delete old components, wrappers and overrides. That is when migration is done, not when imports change.' },
          ],
        },
        {
          kind: 'table',
          caption: 'Ways to make the switch',
          evidence: 'proposed',
          columns: ['Approach', 'Use it when', 'Watch for'],
          rows: [
            ['Token swap', 'Styles are hard-coded.', 'Mapping a value to the wrong token changes the look.'],
            ['Wrapper', 'An old component is used in hundreds of places.', 'Wrappers that are never removed.'],
            ['Automated rewrite (codemod)', 'The changes are mechanical and repeated.', 'It needs careful review and good tests.'],
            ['Screen by screen', 'The product changes often.', 'A long period with old and new mixed.'],
            ['With feature work', 'Teams cannot pause for migration.', 'Slow progress unless someone tracks it.'],
          ],
        },
      ],
    },
    {
      id: 'measures',
      title: 'A few measures',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Four measures for Meadow and Harbor, each tied to a common reason for building a system. None has been measured here: this project has one author and no product teams.',
          ],
        },
        {
          kind: 'table',
          caption: 'Measures, how to collect them, and how each can mislead',
          evidence: 'proposed',
          stacked: true,
          columns: ['Measure', 'Baseline', 'How to collect', 'Owner', 'Review', 'Could mislead because'],
          rows: [
            ['Adoption of shared controls', 'Share of buttons, inputs and dialogs that use the system, per product', 'A code scan of imports against native and look-alike elements', 'Core team', 'Every release', 'It counts use, not quality: a wrapper that restyles a shared control still counts.'],
            ['Local overrides and copies', 'Copied components and overriding styles, per product', 'Lint rules and a scan for look-alike components', 'Core team', 'Monthly', 'Some overrides are legitimate exceptions; read the count with the exceptions log.'],
            ['Accessibility defects in shared controls', 'Open defects by component and severity', 'Bug-tracker labels, automated scans and manual audits', 'Product QA leads', 'Quarterly', 'Fewer reported defects can mean less testing.'],
            ['Time for a comparable task', 'Time to build one defined flow, with its states, before the system', 'Timed exercises or tickets of similar size', 'Engineering managers', 'Twice a year', 'Small samples and learning effects swamp the signal, and speed without the states is not the same task.'],
          ],
        },
      ],
    },
    {
      id: 'checked',
      title: 'What this project checks, and what it does not',
      blocks: [
        {
          kind: 'table',
          caption: 'Technical checks in this repository, and outcomes that have not been measured',
          evidence: 'implemented',
          columns: ['Evidence', 'Status', 'Where'],
          rows: [
            ['Token sources are valid and every alias resolves in all twelve combinations', 'Checked in every build', '`scripts/tokens/pipeline.mjs`'],
            ['Who may read which token tier', 'Checked by the build and tests', '[Dependency policy](/foundations/tokens#policy)'],
            ['Stylesheets use only tokens and declare cascade layers', 'Checked by lint', '`scripts/architecture/check-styles.mjs`'],
            ['Imports respect the layer boundaries', 'Checked by lint', '[Implementation architecture](/#architecture)'],
            ['Text and control contrast in every product and theme', 'Unit tested', '[Contrast](/foundations/color#contrast)'],
            ['Keyboard, focus, reflow at 320 pixels and automated accessibility scans', 'Browser tests on the production build', '`e2e/`'],
            ['Documentation agrees with the implementation', 'Unit tested', '`src/test/documentation.test.ts`'],
            ['Adoption, delivery time, defect trends, user research and production use', 'Not measured: no product teams or users', 'None'],
          ],
        },
      ],
    },
  ],
  sources: ['teams', 'criteria', 'lifecycle', 'semver', 'inventory'],
};
