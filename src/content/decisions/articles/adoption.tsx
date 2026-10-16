import { SourceList } from '@/features/docs';
import wrapperSource from '../PwButton.tsx?raw';
import { TokenMapping, WrapperBench } from '../MigrationExamples';
import type { Decision } from '../types';

const legacyComponent = `// The provider workspace's existing button (hypothetical), used at about 200 call sites.
export function PwButton({ kind = 'default', small, busy, children, ...rest }) {
  return (
    <button
      className={\`pw-btn pw-btn--\${kind}\${small ? ' pw-btn--small' : ''}\`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}`;

const legacyStyles = `.pw-btn { height: 32px; padding: 0 14px; border: 1px solid #0b5cab; border-radius: 3px;
  font: 600 14px/1 Arial, sans-serif; background: #fff; color: #0b5cab; }
.pw-btn--primary { background: #0b5cab; color: #fff; }
.pw-btn--small { height: 26px; padding: 0 10px; font-size: 12px; }
.pw-btn--link { border-color: transparent; background: none; text-decoration: underline; }
.pw-btn:focus { outline: none; box-shadow: 0 0 0 2px #7fb2e5; }
.pw-btn:disabled { background: #e0e0e0; color: #9a9a9a; border-color: #e0e0e0; }`;

function MigrationEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'src/content/decisions/PwButton.tsx', note: 'The compatibility wrapper on this page, on the real Button' },
        { path: 'src/content/decisions/PwButton.test.tsx', note: 'What the wrapper preserves and what it changes on purpose' },
        { path: 'src/content/decisions/MigrationExamples.tsx', note: 'The live token mapping and the before-and-after call sites' },
        { path: 'scripts/architecture/check-styles.mjs', note: 'The strict guard rail: no raw colors in any stylesheet' },
      ]}
    />
  );
}

export const adoption: Decision = {
  id: 'adoption',
  stage: 'Adoption and migration',
  question: 'How do the patient app and the provider workspace move existing screens onto the shared core without pausing feature work or breaking what already works?',
  matters: 'A migration that stops at changed imports leaves two systems to maintain, and one that breaks behavior loses the trust it needs to finish.',
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'The provider workspace has its own button in about 200 places, styled with raw values; the patient app has a different one. Both keep shipping features while they move to the shared core, and the patient app and the provider workspace each upgrade the core on their own schedule.',
      },
    ],
    choice: [
      {
        evidence: 'proposed',
        text: 'Migrate in reversible steps, tokens first, then a wrapper that keeps call sites working, then screen-by-screen replacement, and count a migration done only when the wrapper and old styles are gone.',
      },
      {
        evidence: 'implemented',
        text: 'This page’s wrapper is real code on the shared Button, tested for what it keeps and what it changes. The legacy button and its call sites are invented.',
        example: { label: 'The wrapper and its call sites', href: '/decisions/adoption#wrapper' },
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Replace everything in one release.** One switch, but feature work stops, and a single regression reaches every screen at once.',
          '**A codemod alone.** Fast for mechanical renames, but it cannot decide what a call site meant, such as a button that navigates.',
          '**Use the core only for new screens.** No risk to old screens, and no end date: two systems stay forever.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'For a while the product carries a wrapper and two styles of button, and some screens look different from others. Each step can be shipped and reverted on its own, and feature work continues.',
      },
    ],
    validation: [
      {
        evidence: 'proposed',
        text: 'Done means zero call sites, a deleted wrapper, no old styles in the shipped CSS and a guard rail that fails any new raw value, checked in each product, not counted from imports.',
        example: { label: 'Evidence that it is done', href: '/decisions/adoption#completion' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'Call-site counts stop falling for two releases, a wrapper starts gaining options of its own, or the core plans a breaking change to a component that is still being migrated.',
      },
    ],
  },
  sections: [
    {
      id: 'order',
      title: 'The order of work',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['The patient app and the provider workspace keep shipping while they move. Migrate in small, reversible steps, and stop adding new debt before paying down the old.'],
        },
        {
          kind: 'steps',
          items: [
            { title: 'Tokens', text: 'Replace raw values with tokens. Record every value that changes on purpose, so reviewers know which differences to expect.' },
            {
              title: 'Guard rails',
              text: 'Add a lint rule that fails new raw values and only reports recorded old ones, then make it strict when the count reaches zero.',
              note: {
                evidence: 'implemented',
                text: 'This repository runs the strict version: `check-styles.mjs` rejects any raw color in a stylesheet.',
                example: { label: 'What this project checks', href: '/decisions/operating#checked' },
              },
            },
            { title: 'Primitives', text: 'Swap buttons, inputs and checkboxes, most used first. A wrapper with the old name can keep existing call sites working.' },
            { title: 'Composite components', text: 'Replace a whole dialog or menu at once. Mixing old and new focus handling breaks both.' },
            { title: 'Patterns', text: 'Adopt patterns when a team rebuilds a flow anyway.' },
            { title: 'Clean up', text: 'Delete old components, wrappers and overrides. That is when migration is done, not when imports change.' },
          ],
        },
      ],
    },
    {
      id: 'approaches',
      title: 'Choosing an approach',
      blocks: [
        {
          kind: 'table',
          caption: 'Five ways to make the switch, and when each fits',
          evidence: 'proposed',
          stacked: true,
          columns: ['Approach', 'Choose it when', 'Avoid it when', 'Finished when'],
          rows: [
            ['Token migration', 'Styles are hard-coded but the markup and behavior are sound.', 'The component itself is the problem, such as a broken focus model.', 'No raw values remain and the guard rail is strict.'],
            ['Compatibility wrapper', 'An old component is used in many places and its API can be expressed with the new one.', 'The old API has behavior the new component deliberately lacks, so the wrapper would grow its own logic.', 'No call site imports it and the file is deleted.'],
            ['Codemod', 'The change is mechanical, repeated and decidable from the code alone.', 'Each call site needs a judgment, such as whether a button navigates.', 'Its report lists no skipped sites, and every changed file was reviewed.'],
            ['Screen by screen', 'Screens change often, or a composite such as a dialog has to move as a whole.', 'A component appears on almost every screen, so old and new would mix for months.', 'Every screen on the list is done, including the ones no one is working on.'],
            ['Alongside feature work', 'Teams cannot pause, and features touch the screens that need migrating.', 'Some screens are never touched by features.', 'Someone tracks the remaining screens and schedules the untouched ones.'],
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['Approaches combine. The worked example below uses tokens, then a wrapper, then screen-by-screen replacement; a codemod would only be worth writing for its mechanical part.'],
        },
      ],
    },
    {
      id: 'existing',
      title: '1. The existing control',
      blocks: [
        {
          kind: 'text',
          evidence: 'hypothetical',
          paragraphs: ['The provider workspace’s `PwButton` is invented for this example. Before changing anything, write down what it does, because call sites may depend on any of it.'],
        },
        { kind: 'code', evidence: 'conceptual', language: 'tsx', caption: 'Hypothetical: the provider workspace’s button today.', code: legacyComponent },
        { kind: 'code', evidence: 'conceptual', language: 'css', caption: 'Hypothetical: its styles, with raw values throughout.', code: legacyStyles },
        {
          kind: 'table',
          caption: 'Observable behavior to keep or change on purpose',
          evidence: 'hypothetical',
          stacked: true,
          columns: ['Behavior', 'Today', 'Decision'],
          rows: [
            ['In a form', 'No `type`, so it submits the form. Some call sites rely on that; others submit by accident.', 'Keep it in the wrapper; each replaced call site states its `type`.'],
            ['While busy', 'Sets `disabled`, so keyboard focus drops to the page, and the label becomes “Please wait…”.', 'Change: `loading` keeps focus and the accessible name.'],
            ['Focus', '`outline: none` and a light ring of about 2.2:1 against white.', 'Change: the shared focus outline.'],
            ['`kind="link"`', 'A button styled as a link. Some call sites navigate in `onClick`.', 'Change: navigation becomes a Link; actions keep a ghost Button.'],
            ['Small size', '26 pixels tall.', 'Change: the shared small size, which density sets.'],
            ['Label text', 'Sentence case.', 'Change: the shared control type is uppercase.'],
          ],
        },
      ],
    },
    {
      id: 'tokens',
      title: '2. Raw values to tokens',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Map each raw value to the token with the same meaning, not the nearest color. Where the shared value differs, decide whether that is the point of migrating, and record it. Promise the same behavior and intended look, not identical pixels.',
          ],
        },
        {
          kind: 'visual',
          evidence: ['hypothetical', 'implemented'],
          caption: 'The provider workspace’s values are invented; the tokens and the values in the third column are real, measured from the two buttons above. Switch the theme in the header and they update.',
          Visual: TokenMapping,
        },
      ],
    },
    {
      id: 'wrapper',
      title: '3. A compatibility wrapper',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'The wrapper keeps the old name and props, so 200 call sites keep compiling, and renders the shared Button underneath. It translates; it does not add behavior of its own. When it needs logic the shared component lacks, stop and ask whether the old behavior is worth keeping.',
          ],
        },
        {
          kind: 'code',
          evidence: 'conceptual',
          language: 'tsx',
          caption: 'The wrapper exactly as this page runs it. The provider workspace is invented; the Button it renders is the shared one.',
          code: wrapperSource,
        },
      ],
    },
    {
      id: 'replace',
      title: '4. Replacing call sites',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'With the wrapper in place, replace call sites one screen at a time, starting with the most used. Each replacement says what the old code left implicit: the `type`, the size, and whether a link-styled button really navigates.',
          ],
        },
        {
          kind: 'visual',
          evidence: ['hypothetical', 'implemented'],
          caption: 'The left column renders the old call sites through the wrapper; the right column is the replacement. Turn on Saving: both Save buttons stay focusable and keep their name.',
          Visual: WrapperBench,
        },
      ],
    },
    {
      id: 'verify',
      title: '5. Verifying the change',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Check behavior, not imports. The shared Button’s own guarantees are already tested; what needs checking is how each screen uses it.'],
        },
        {
          kind: 'table',
          caption: 'Verification for each migrated screen',
          evidence: ['proposed', 'implemented'],
          stacked: true,
          columns: ['Area', 'Check', 'Already covered by the shared Button', 'Left to the product'],
          rows: [
            ['Appearance', 'Compare screenshots in each product and theme against the recorded list of intended changes.', 'Every appearance reads tokens; documentation tests trace each prop to one ([Button tokens](/components/button#tokens)).', 'Layout around the button, and any override that survived.'],
            ['Keyboard', 'Tab reaches each button in the same order; Enter and Space activate it.', 'A native button, so both keys work.', 'Tab order on the screen, and nothing focusable that used to be skipped.'],
            ['Focus', 'Focus is visible on every button and stays put while saving.', 'The focus ring is tested at 3:1 against every surface, and loading keeps focus (`Button.test.tsx`).', 'Where focus goes after the save finishes.'],
            ['Forms', 'Each form submits once, from the intended button, and Enter in a field still submits where it did.', 'Button defaults to `type="button"`; the wrapper keeps `submit`.', 'Every replaced call site in a form states its `type`.'],
            ['States', 'Busy, disabled and error states look and announce as intended.', '`loading` sets `aria-disabled` and keeps the name; `disabled` overrides every appearance.', 'A status message announcing the outcome of the save.'],
          ],
        },
      ],
    },
    {
      id: 'remove',
      title: '6. Removing the wrapper',
      blocks: [
        {
          kind: 'steps',
          items: [
            { title: 'Count the call sites', text: 'Search the product for the wrapper’s name and its old props. The count goes in the migration record each release.', output: 'zero call sites' },
            { title: 'Delete the wrapper', text: 'Remove the file and its tests. A build that still compiles proves nothing imports it.', output: 'a commit that only deletes' },
            { title: 'Delete the old styles', text: 'Remove `.pw-btn` and its variants, then confirm the class names are gone from the built CSS, not just the source.', output: 'a smaller stylesheet' },
            { title: 'Make the guard rail strict', text: 'Clear the recorded entries for this component from the lint baseline, so a raw value here now fails the build.', output: 'an empty baseline for the component' },
            { title: 'Close the record', text: 'Note the release that removed the wrapper and any intended differences that remain.', output: 'MIG-12 closed' },
          ],
        },
      ],
    },
    {
      id: 'codemod',
      title: 'If a codemod helps',
      blocks: [
        {
          kind: 'text',
          evidence: 'conceptual',
          paragraphs: ['No codemod exists in this repository. If the provider workspace wrote one for the mechanical part of step 4, it should be this narrow.'],
        },
        {
          kind: 'table',
          caption: 'A narrow codemod: what it rewrites, what it leaves, and how it is reviewed',
          evidence: 'conceptual',
          stacked: true,
          columns: ['Part', 'Specification'],
          rows: [
            ['Rewrites', '`<PwButton>` with literal props only: `kind="primary"` or `"default"` to `appearance`, `small` to `size="small"`, `busy` to `loading`, and an explicit `type="submit"` where the call site is inside a `<form>` in the same file.'],
            ['Leaves alone, and lists', 'Spread props, computed `kind`, any `kind="link"`, a `className` or `style`, call sites in files without a form whose parent form is elsewhere, and re-exports under another name.'],
            ['Review', 'Every changed file is read by the owning team, the product’s tests and screenshot comparison run, and the skipped list becomes part of the migration record.'],
            ['Never', 'Changes behavior to make a test pass, or edits files outside the product.'],
          ],
        },
      ],
    },
    {
      id: 'completion',
      title: 'Ownership and completion',
      blocks: [
        {
          kind: 'table',
          caption: 'Who owns what during a migration',
          evidence: 'proposed',
          columns: ['Owner', 'Owns'],
          rows: [
            ['Core team', 'The shared components and tokens, the list of intended differences, and answers when a call site does not fit.'],
            ['Product team', 'Its call sites, the wrapper, the screenshots and the decision to roll back.'],
            ['Migration lead, one per product', 'The migration record: remaining call sites, skipped codemod sites and the removal date.'],
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['A migration is complete when all of these hold in the product, checked rather than assumed:'],
        },
        {
          kind: 'list',
          items: [
            'No call site imports the old component or the wrapper, and the wrapper file is deleted.',
            'The old class names are absent from the built CSS.',
            'The guard rail is strict for the component, with no recorded entries left.',
            'Every intended difference is on the list and has been reviewed in each product and theme.',
            'Keyboard, focus, form and state checks from step 5 pass on every migrated screen.',
            'No open exception covers the component, or the remaining one has an owner and a review date.',
          ],
        },
      ],
    },
    {
      id: 'debt',
      title: 'New debt and recorded debt',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            'Stop the count from rising before trying to lower it. Record each existing raw value or local component once, with an owner. New code may not add to the record; old entries are allowed until their owner removes them.',
          ],
        },
        {
          kind: 'table',
          caption: 'Allowed and blocked during a migration',
          evidence: 'proposed',
          columns: ['Case', 'Rule'],
          rows: [
            ['A raw value already in the baseline', 'Allowed, reported in every run.'],
            ['A new raw value', 'Fails the build.'],
            ['Touching a file with recorded debt', 'Allowed; fixing the debt in the same change is encouraged, not required.'],
            ['A deliberate departure from the system', 'Allowed as a logged [exception](/decisions/operating#exceptions) with an owner and a review date.'],
            ['An exception past its review date', 'Counted as not migrated until it is renewed with a reason or removed.'],
          ],
        },
      ],
    },
    {
      id: 'rollout',
      title: 'Rollout and rollback',
      blocks: [
        {
          kind: 'table',
          caption: 'Conditions for each stage of a rollout',
          evidence: 'proposed',
          stacked: true,
          columns: ['Stage', 'Go ahead when', 'Roll back when', 'How'],
          rows: [
            ['Wrapper on the shared Button', 'The wrapper’s tests pass and screenshots match the list of intended differences.', 'A call site loses behavior the list did not mention, such as a form that no longer submits.', 'Revert the wrapper to the old implementation; call sites do not change.'],
            ['First screens replaced', 'The wrapper has shipped for one release without a rollback.', 'A replaced screen fails a step 5 check in production.', 'Revert that screen’s change; the wrapper still serves the rest.'],
            ['Most screens replaced', 'Replaced screens have had no regressions for two releases.', 'The same defect appears on several screens, which points at the shared component.', 'Pause, report it as an urgent defect to the core team, and keep the wrapper.'],
            ['Wrapper and old styles removed', 'The completion list holds.', 'Rarely: removing it should change nothing that ships.', 'Revert the deletion commit.'],
          ],
        },
      ],
    },
    {
      id: 'consumers',
      title: 'Consumers on their own schedule',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            'The patient app and the provider workspace upgrade the core separately, so a migration cannot assume both are on the same version. The wrapper lives in each product, not in the core, so each product removes its own when it is ready.',
          ],
        },
        {
          kind: 'list',
          items: [
            'State the oldest core version a migration step needs, and do not start that step in a product until it has upgraded.',
            'Do not combine a core major upgrade with a component swap in one release; when something breaks, it should be clear which one did it.',
            'When the core deprecates a prop that a product’s wrapper still passes, the deprecation warning finds those call sites; the [release note](/decisions/operating#releases) says when it is removed.',
            'Track each product’s migration record separately; one product finishing does not finish the other.',
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The wrapper, its tests and the examples on this page. Each file opens in place.',
          Visual: MigrationEvidence,
        },
      ],
    },
  ],
  sources: ['semver', 'wcag'],
};
