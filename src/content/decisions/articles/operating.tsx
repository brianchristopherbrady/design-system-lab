import { maturities, maturityDefinitions, maturityLabels } from '@/domain/system';
import { SourceList } from '@/features/docs';
import type { Decision } from '../types';

function RepositoryEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'src/domain/system/maturity.ts', note: 'What each maturity label promises, requires and allows to change' },
        { path: 'src/test/documentation.test.ts', note: 'Checks the maturity requirements marked “checked”, and every link and anchor' },
        { path: 'src/domain/system/activity.ts', note: 'The changelog the activity dashboard reads' },
        { path: 'docs/contributing.md', note: 'The contribution checklist, and why a breaking change updates every consumer at once here' },
        { path: 'docs/accessibility/accessibility-audit.md', note: 'The audit behind the defect ledger, and what it could not verify' },
        { path: 'scripts/architecture/check-styles.mjs', note: 'Rejects raw colors and stylesheets without a cascade layer' },
      ]}
    />
  );
}

const checked = { label: 'What this project checks', href: '/decisions/operating#checked' };

const maturityRows = maturities.map((maturity) => {
  const definition = maturityDefinitions[maturity];
  return [maturityLabels[maturity], definition.promise, definition.requires.join(' '), definition.change, definition.limits];
});

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
        text: 'Four measures, each with a unit, a scope, a baseline definition, an owner and the action a worrying result should trigger. None has a measured baseline yet.',
        example: { label: 'A few measures', href: '/decisions/operating#measures' },
      },
      {
        evidence: 'implemented',
        text: 'This repository checks its own rules in every build and test run: maturity labels have tested requirements, documentation is tested against the code, and browser tests run accessibility scans, keyboard checks and 320 pixel reflow. Adoption and delivery time are not measured, because there are no product teams.',
        example: checked,
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
          text: 'The product builds it, logs what it built and why, and owners review the log with product teams each month. If Meadow and Harbor both need the same thing, it becomes a candidate for the system. [An exception record](/decisions/operating#exceptions) shows what one entry holds.',
        },
        {
          kind: 'text',
          paragraphs: [
            'The next four sections work through this path: a request that becomes a stable component, a request that is declined, the exception it leaves behind, and the difference between fixing a defect and reviewing a contribution.',
          ],
        },
      ],
    },
    {
      id: 'contribution',
      title: 'A contribution, from request to stable',
      blocks: [
        {
          kind: 'text',
          evidence: 'hypothetical',
          paragraphs: ['A date field, requested by Harbor and needed by both products. Each step produces something the next step reviews.'],
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Request',
              text: 'Harbor’s representative asks for a shared date field. Both products already ask for dates: Meadow for a date of birth at sign-up, Harbor for a date range in its record filter. Before filing, they check the Components index and the exceptions log.',
              output: 'a request that links both local versions',
            },
            {
              title: 'Evidence',
              text: 'The core team checks the first two criteria. It is **useful**: two products need it. It is **unique**: no shared part does it. The local versions also disagree. Meadow splits day, month and year into three boxes; Harbor’s native date input has no format hint, and its error is not tied to the field.',
              output: 'an evidence note: the need, the local versions and their defects',
            },
            {
              title: 'API proposal',
              text: 'Harbor drafts the props before any code: `label`, `hint`, `error`, `required`, and `value` with `onChange` as ISO dates such as `2027-03-14`. There is no `format` prop, so the stored value never varies, and no calendar picker in the first version.',
              output: 'a proposal reviewed before anyone writes the component',
            },
            {
              title: 'Review feedback',
              text: 'The accessibility reviewer asks for one `fieldset` and `legend` around the parts, with a single error for the group. The design owner asks both products to agree one layout; they choose separate day, month and year boxes. A request for `min` and `max` is deferred until a form needs them.',
              output: 'a revised proposal that records each change and who asked for it',
            },
            {
              title: 'Experimental release',
              text: 'Core 2.6.0 ships `DateField` as experimental. Meadow uses it at sign-up and Harbor in one filter. Both note what they had to work around, and Meadow tests the sign-up step with a few of its users.',
              output: 'a changelog entry, two screens using it and the workarounds both teams noted',
              note: {
                evidence: 'implemented',
                text: 'This repository writes down what each label promises, requires and allows to change, and the table under Versions, maturity and retirement is read from that code.',
                example: { label: 'Maturity labels', href: '/decisions/operating#releases' },
              },
            },
            {
              title: 'Stable acceptance',
              text: 'Two minor releases later, with no forks and no open high-severity defects, the core team checks the stable requirements: props documented from its types, each prop traced to a token, keyboard, screen-reader and responsive notes, named in automated tests, and used outside its own page. Core 2.8.0 marks it stable; from then on it changes only through deprecation.',
              output: 'the stable label, with the evidence that earned it',
              note: {
                evidence: 'implemented',
                text: 'Here, `documentation.test.ts` fails if a stable component is not named in an automated test or not used outside its own documentation.',
                example: checked,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'disputed',
      title: 'A disputed request',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Some requests should be declined. The record says who decided, which evidence settled it and how the product carries on.'],
        },
        {
          kind: 'record',
          caption: 'Request: hide the Checkbox label in table rows',
          fields: [
            {
              label: 'Request',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Harbor asks for a `hideLabel` prop on the shared Checkbox, to select rows in its sortable table ([inventory finding I7](/decisions/planning#inventory)), where each row’s name already labels the box.',
                },
              ],
            },
            {
              label: 'Positions',
              statements: [
                {
                  evidence: 'hypothetical',
                  items: [
                    '**Harbor:** without it, the table keeps a local checkbox, which counts against adoption.',
                    '**Meadow:** uses Checkbox for consent, where a hidden label would hide what people agree to. A general prop makes that easy.',
                    '**Accessibility reviewer:** a box named by its row is fine. A hidden label on a form field is not, because people who rely on seeing the label lose it.',
                  ],
                },
              ],
            },
            {
              label: 'Who decides',
              statements: [
                {
                  evidence: 'proposed',
                  text: 'The core team’s design and engineering owners, after both product representatives state their case at the monthly review. A product that disagrees can ask once for the design and engineering leads to review the same evidence. Their answer is recorded and stands until the evidence changes.',
                },
              ],
            },
            {
              label: 'Evidence that matters',
              statements: [
                {
                  evidence: 'proposed',
                  items: [
                    'How many products need it: one.',
                    'The risk of adding it: a general way to remove visible labels from form fields.',
                    'The risk of declining: low. A native checkbox named by its row header is accessible, and Harbor can style it with shared tokens.',
                    'The contribution criteria: it is not yet **useful** to more than one product.',
                  ],
                },
              ],
            },
            {
              label: 'Evidence that does not decide it',
              statements: [
                {
                  evidence: 'proposed',
                  text: 'How often Harbor uses the table, or who asked first. Heavy use in one product argues for that product’s code, not for the core.',
                },
              ],
            },
            {
              label: 'Decision',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Declined as proposed. The core will not add `hideLabel`. If a second product needs selectable rows, the core will consider a part made for row selection instead of a general option.',
                },
              ],
            },
            {
              label: 'How Harbor proceeds',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Harbor keeps a native checkbox in its table, named by the row header and styled only with shared tokens, and logs it as [exception EX-007](/decisions/operating#exceptions).',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'exceptions',
      title: 'An exception record',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['An exception is a product departing from the system on purpose. Logging it keeps the departure visible, gives it an owner and sets a date to decide again.'],
        },
        {
          kind: 'record',
          caption: 'Exception EX-007: Harbor’s row-selection checkbox',
          fields: [
            {
              label: 'What departs',
              statements: [{ evidence: 'hypothetical', text: 'Harbor’s record table selects rows with a native checkbox instead of the shared Checkbox.' }],
            },
            {
              label: 'Reason',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'The shared Checkbox requires a visible label. In the table, each row’s name labels its box through `aria-labelledby`, and repeating it in every row would add noise. A request to change Checkbox was [declined](/decisions/operating#disputed).',
                },
              ],
            },
            {
              label: 'Owner',
              statements: [{ evidence: 'hypothetical', text: 'Harbor’s engineering lead, who answers for it at each review.' }],
            },
            {
              label: 'Affected products',
              statements: [{ evidence: 'hypothetical', text: 'Harbor only. Meadow has no selectable rows.' }],
            },
            {
              label: 'Logged and review date',
              statements: [{ evidence: 'hypothetical', text: 'Logged on 2 March 2027; review by 1 June 2027. Both dates are illustrative.' }],
            },
            {
              label: 'Remove when',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'The core ships a part for row selection, or Harbor’s table moves to a shared table that includes one. Harbor then migrates and deletes its checkbox.',
                },
              ],
            },
            {
              label: 'Include in the shared system when',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Meadow or a third product needs selectable rows. Harbor’s version, its tests and this record become the evidence for a new contribution.',
                },
              ],
            },
            {
              label: 'In the measures',
              statements: [
                {
                  evidence: 'proposed',
                  text: 'Left out of the adoption count while it is active, and listed with local overrides so it stays visible. See [counting adoption](/decisions/operating#measures).',
                },
              ],
            },
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['Owners review the log every month. An exception past its review date counts as not adopted until its owner renews it with a reason or removes it.'],
        },
      ],
    },
    {
      id: 'defects',
      title: 'Urgent defects and scheduled review',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['A defect breaks a promise the system already makes; a contribution asks it to make a new one. They need different speeds, so they take different paths.'],
        },
        {
          kind: 'table',
          caption: 'Two paths into the shared core',
          evidence: 'proposed',
          stacked: true,
          columns: ['Aspect', 'Urgent defect', 'Scheduled contribution'],
          rows: [
            ['What qualifies', 'A shared part breaks a promise it already makes: lost input, a keyboard trap, failing contrast, a crash or a security problem.', 'A new part, a new option, or a change to behavior or the public API.'],
            ['Who can raise it', 'Anyone: product teams, QA, support or the core team.', 'A product representative, after checking the system and the exceptions log.'],
            ['When it is looked at', 'On arrival. Severity decides whether it interrupts planned work.', 'At the monthly review, in order of arrival.'],
            ['Review', 'One core engineer, plus an accessibility reviewer for accessibility defects. The contribution criteria do not apply.', 'The contribution criteria and the written review list.'],
            ['Release', 'A patch release once the fix passes the shared checks. No API changes.', 'A minor release, starting as experimental.'],
            ['If the fix needs an API change', 'Ship the smallest patch or workaround first, then raise the API change as a contribution.', 'The API change is part of the proposal.'],
            ['Meanwhile, in the product', 'A local workaround, logged as an exception that expires with the patch.', 'The product builds what it needs and logs it, as with any gap.'],
            ['Consumers are told by', 'A release note naming the affected versions, and a direct message to each product.', 'The changelog and the contribution record.'],
          ],
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'This repository keeps an accessibility defect ledger. Each of its eight issues has a severity, a priority, an owner and acceptance criteria, and its status separates fixed from verified. All eight are fixed and await independent verification; the audit had no screen reader. The audit is listed under [What this project checks](/decisions/operating#checked).',
          ],
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
            ['Design-to-code alignment', 'Not applicable: there is no design-tool library.', 'Component properties in the design tool use the same names and values as props in code, and reviews check them ([alignment](/decisions/alignment)).'],
          ],
        },
        {
          kind: 'table',
          caption: 'Maturity labels in this repository, read from the code that defines them',
          evidence: 'implemented',
          stacked: true,
          columns: ['Label', 'Promise', 'Requires', 'Breaking changes', 'Does not claim'],
          rows: maturityRows,
        },
        {
          kind: 'text',
          paragraphs: ['A sample release note for a breaking change to a stable component. It follows the stable rule above: the old prop was deprecated first and kept working for more than one minor release.'],
        },
        {
          kind: 'record',
          caption: 'Release note: shared core 3.0.0',
          fields: [
            {
              label: 'Changes',
              statements: [
                {
                  evidence: 'hypothetical',
                  items: [
                    '**Breaking:** Button’s `variant` prop is removed. Use `appearance`, which takes the same values. `variant` was deprecated in 2.4.0 and has logged a development warning since.',
                    'Nothing else changes: tokens and markup are the same as in 2.9.0.',
                  ],
                },
              ],
            },
            {
              label: 'Affected consumers',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Meadow: 14 call sites still pass `variant`, found from the deprecation warnings. Harbor: none; it moved to `appearance` in 2.5.0. The counts are illustrative.',
                },
              ],
            },
            {
              label: 'Migration',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Run the `button-appearance` codemod, which renames the prop and leaves its value alone, then review the diff and run the product’s tests. By hand, replace `variant=` with `appearance=` on each Button.',
                },
              ],
            },
            {
              label: 'Compatibility support',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: '2.9.x receives fixes for severe defects and security problems for six months. Because tokens and markup are unchanged, Meadow and Harbor can upgrade on their own schedules.',
                },
              ],
            },
            {
              label: 'Rollback',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Pin `2.9.x` and redeploy. This release changes no tokens, markup or stored data, so nothing else needs undoing. Tell the core team, so the problem is fixed before the next attempt.',
                },
              ],
            },
            {
              label: 'In this repository',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'The changelog records a similar rename of Button’s `variant` to `appearance`. The site ships as one unit, so that change updated every consumer at once, with no compatibility period (`docs/contributing.md`).',
                  example: { label: 'Activity dashboard', href: '/patterns/activity-dashboard' },
                },
              ],
            },
          ],
        },
      ],
    },
    // Keep this id: older links point here. The material moved to /decisions/adoption.
    {
      id: 'migration',
      title: 'Migrating existing products',
      blocks: [
        {
          kind: 'note',
          title: 'Moved to its own page',
          text: 'Migration now has its own decision: [Adoption and migration](/decisions/adoption), with the order of work, how to choose an approach, and a worked migration from raw values to a removed wrapper.',
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
            'Four measures for Meadow and Harbor, each tied to a common reason for building a system. A **baseline definition** says what will be counted, where and when. A **measured baseline** is the dated result of running that definition. Every baseline here is a definition only: nothing has been measured, because this project has one author and no product teams.',
          ],
        },
        {
          kind: 'table',
          caption: 'Measures: unit, scope, baseline, collection and what a worrying result should trigger',
          evidence: 'proposed',
          stacked: true,
          columns: ['Measure', 'Unit', 'Scope', 'Baseline definition', 'Measured baseline', 'How to collect', 'Owner', 'Review', 'Could mislead because', 'If the result is worrying'],
          rows: [
            [
              'Adoption of shared controls',
              'Percentage of in-scope call sites that use a shared component. One figure per product, never averaged across products.',
              'Buttons, text inputs, selects, checkboxes and dialogs in each product’s own source code. The rules for wrappers, native elements, system internals and exceptions are in the next table.',
              'The same count, run on each product’s main branch before its first migrated screen ships.',
              'Not measured.',
              'A static scan of components and HTML elements, versioned with its allowlist so results can be rerun.',
              'Core team',
              'Every release; the trend monthly',
              'It counts places in code, not how often people see them: a busy screen and a rarely used settings page weigh the same. A wrapper that restyles a shared control still counts.',
              'If it stalls for two releases, read the exceptions log and local copies for the cause before asking teams to move faster. A stall often means the system is missing something.',
            ],
            [
              'Local overrides and copies',
              'Count per product: copied components, plus style rules that override a shared component’s tokens or classes. Logged exceptions are shown separately.',
              'Each product’s source code and stylesheets.',
              'The count on each product’s main branch before migration starts.',
              'Not measured.',
              'Lint rules for raw values and overridden classes, plus a scan for components with the same name or markup as a shared one.',
              'Core team',
              'Monthly, with the exceptions log',
              'Some overrides are legitimate exceptions. A low count can also mean overrides moved where the scan cannot see them, such as inline styles.',
              'An unlogged override gets an exception record or a fix. The same override in both products becomes a contribution candidate.',
            ],
            [
              'Accessibility defects in shared controls',
              'Open defects, by severity and component.',
              'Defects whose cause is in the shared core, whether reported by a product, an audit or a scan. Defects caused by product code stay with that product.',
              'Open defects in the controls the core replaces, counted from each product’s tracker and one audit before migration.',
              'Not measured for Meadow and Harbor. This repository’s own ledger is a record of one audit, not a product baseline.',
              'Tracker labels for component and severity, automated scans, and a manual audit each quarter.',
              'Product QA leads, with the core team for fixes',
              'Quarterly; high severity on arrival',
              'Fewer reported defects can mean less testing. Automated scans find only some kinds of problem, and a new audit can raise the count without anything getting worse.',
              'Any open high-severity defect takes the [urgent path](/decisions/operating#defects). A count that rises after an audit is read with that audit, not as a regression.',
            ],
            [
              'Time for a comparable task',
              'Working hours to build one defined flow with all its states; the median across attempts.',
              'The pilot form, built in each product.',
              'The time to build the same flow the old way, recorded before the pilot.',
              'Not measured.',
              'Timed exercises, or tickets of similar size logged by the people doing the work.',
              'Engineering managers',
              'Twice a year',
              'Small samples and learning effects swamp the signal, and speed without the states is not the same task.',
              'If it is slower than the baseline with no fewer defects, apply the [pilot’s decision rules](/decisions/planning#pilot) rather than a new interpretation.',
            ],
          ],
        },
        {
          kind: 'table',
          caption: 'Counting adoption: how each kind of call site affects the figure',
          evidence: 'proposed',
          stacked: true,
          columns: ['Call site', 'In the denominator', 'Counts as adopted', 'Why'],
          rows: [
            ['A shared component used directly', 'Yes', 'Yes', 'This is what adoption means.'],
            [
              'A product wrapper around a shared component',
              'Yes, once at each place the wrapper is used. The wrapper’s own definition is not counted.',
              'Yes. A wrapper that restyles the shared component is also counted in local overrides.',
              'Wrappers are a normal way to adopt, but one that changes styles is partly a fork.',
            ],
            ['A local copy or look-alike', 'Yes', 'No', 'This is what adoption should reduce.'],
            [
              'An intentional native element',
              'No, if it is on the allowlist with a reason, such as a file input the system has no part for. Otherwise, yes.',
              'Not applicable',
              'A native element the system does not replace is not a gap. Without an allowlist, any native element could be excused.',
            ],
            ['A logged exception, before its review date', 'No. Reported next to the figure.', 'Not applicable', 'An approved departure is a decision, not drift; listing it keeps it visible.'],
            ['An exception past its review date', 'Yes', 'No', 'An exception nobody reviews has become a fork.'],
            ['System internals: the core’s own source, documentation, stories and tests', 'No', 'Not applicable', 'They measure the system, not the products.'],
            ['Generated, third-party and test code in a product', 'No', 'Not applicable', 'Teams cannot change it, or it never reaches people.'],
          ],
        },
        {
          kind: 'table',
          caption: 'Illustrative only: invented numbers showing how a measured baseline is recorded. Nothing here was measured.',
          evidence: 'hypothetical',
          columns: ['Field', 'Example'],
          rows: [
            ['Measure', 'Adoption of shared controls'],
            ['Product', 'Harbor'],
            ['Measured on', '1 February 2027, on the main branch at a named commit, before the first migrated screen ships'],
            ['Method', 'Scan version 1.0, with the allowlist and exceptions log as they stood that day'],
            ['In scope', '138 call sites'],
            ['Excluded', '11: 8 allowlisted native elements and 3 logged exceptions'],
            ['Result', '42 of 127 counted call sites use shared components: 33%'],
            ['Reviewed by', 'The core team and Harbor’s representative'],
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
            ['Stable components are named in a test and used outside their own page', 'Unit tested', '`src/test/documentation.test.ts`'],
            ['Accessibility defects found by the October 2026 audit', 'Recorded: eight issues, all fixed and awaiting independent verification', '`docs/accessibility/accessibility-audit.md`'],
            ['Adoption, overrides, delivery time, defect trends, user research and production use', 'Not measured: no product teams or users', 'None'],
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The repository files behind the Implemented claims on this page. Each file opens in place.',
          Visual: RepositoryEvidence,
        },
      ],
    },
  ],
  sources: ['teams', 'criteria', 'lifecycle', 'semver', 'inventory'],
};
