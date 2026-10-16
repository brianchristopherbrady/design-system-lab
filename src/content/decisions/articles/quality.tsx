import { SourceList } from '@/features/docs';
import { DirectionTabs } from '../QualityExamples';
import type { Decision } from '../types';

function QualityEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'src/design-system/composites/Tabs/Tabs.tsx', note: 'The contract in code: roving tabindex, mirrored arrows, linked panels' },
        { path: 'src/design-system/composites/Tabs/Tabs.test.tsx', note: 'Unit tests: tab stops, arrow keys, Home, End, wrapping, Tab to the panel' },
        { path: 'e2e/accessibility.spec.ts', note: 'Browser tests: the Tabs keyboard pattern, and axe scans in both themes' },
        { path: 'src/design-system/tokens/contrast.test.ts', note: 'Text, focus ring and selected-tab indicator contrast in every product and theme' },
        { path: 'src/domain/system/maturity.ts', note: 'What beta and stable promise and require' },
        { path: 'src/test/documentation.test.ts', note: 'The maturity requirements that are checked automatically' },
        { path: 'docs/accessibility.md', note: 'What was verified, how, and the known gaps' },
        { path: 'docs/accessibility/accessibility-audit.md', note: 'The audit: scope, methods, findings and what it could not test' },
      ]}
    />
  );
}

const tabsDocs = { label: 'Tabs behavior and accessibility', href: '/components/tabs#behavior' };

export const quality: Decision = {
  id: 'quality',
  stage: 'Quality and release',
  question: 'How do quality and accessibility requirements become acceptance criteria, and what decides that a shared component is ready for products?',
  matters: 'A clean automated scan is easy to mistake for accessibility, and without written criteria each product assumes the other one tested the component.',
  project: {
    choice: 'I write a component’s behavior as criteria that can pass or fail, and name the check that proves each one. Tabs is the worked example.',
    constraint:
      'A clean automated scan is easy to mistake for accessibility, and this project has had no screen-reader evaluation, so every claim has to say which check supports it.',
    tryIt: {
      text: 'Focus a tab in the demo below and use the arrow keys, Home and End. Then switch to right to left: ArrowLeft now moves to the next tab.',
      links: [
        { label: 'Try the contract', href: '/decisions/quality#demo' },
        { label: 'Tabs behavior and accessibility', href: '/components/tabs#behavior' },
      ],
    },
    tradeoff:
      'Writing criteria and evaluating by hand slows promotion. In return, each guarantee and each gap is written down, and an untested area is listed rather than assumed to pass.',
    evidence:
      'Unit tests and Chromium browser tests cover the keyboard pattern, including mirrored arrows in right to left; token tests cover contrast in every product and theme; axe scans run in both themes. Passing them is not a conformance claim, and screen readers, other browsers and a cue for overflowing tabs remain open.',
    lead: ['contract', 'demo'],
  },
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'The patient app wants the shared Tabs for appointment details on phones; the provider workspace wants it for request details used all day from the keyboard. Each team assumes the other has tested it with assistive technology.',
      },
    ],
    choice: [
      {
        evidence: 'proposed',
        text: 'Write each component’s behavior as acceptance criteria, name the check that proves each one, and promote a component only when every criterion has evidence or a recorded gap that its owner has accepted.',
      },
      {
        evidence: 'implemented',
        text: 'This repository proves part of that automatically: unit and browser tests cover the Tabs keyboard pattern, token tests cover its contrast in every product and theme, and axe scans run in both themes. No screen reader has been used.',
        example: tabsDocs,
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**A clean axe scan as the bar.** Cheap and repeatable, but it cannot tell whether names make sense, focus moves sensibly or a screen reader announces the state.',
          '**A full manual audit for every change.** Thorough, and too slow to run on each release, so it would be skipped.',
          '**Leave acceptance to each product.** Every product repeats the same checks, and the component’s own guarantees are never written down.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'Promotion takes longer, because manual evaluations need people and time. In return, products know exactly what the component guarantees and what is still theirs to check.',
      },
    ],
    validation: [
      {
        evidence: 'implemented',
        text: 'A browser test on this page checks that the arrow keys mirror in right to left, which no earlier test covered.',
        example: { label: 'Try the contract', href: '/decisions/quality#demo' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'A product reports a defect that a criterion should have caught, a new supported environment is added, or the cost of manual evaluation starts delaying every release.',
      },
    ],
  },
  sections: [
    {
      id: 'contract',
      title: 'The contract for Tabs',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Tabs is beta, interactive and used outside its own page, in the [resource detail](/patterns/resource-detail) pattern and the theme studio’s export panel. Its contract follows the ARIA tabs pattern. The [Tabs page](/components/tabs#behavior) is the reference; this table restates it only as criteria that can pass or fail.',
          ],
        },
        {
          kind: 'table',
          caption: 'Behavior and accessibility Tabs promises',
          evidence: 'implemented',
          stacked: true,
          columns: ['Area', 'Promise'],
          rows: [
            ['Tab stops', 'One stop for the list, on the selected tab. The next Tab moves into the selected panel, which is focusable.'],
            ['Arrow keys', 'Right and Left move to the next and previous tab and select it, wrapping at the ends. In right to left, they are mirrored.'],
            ['Home and End', 'Move to and select the first and last tab.'],
            ['Names', 'The list is named by the required `label` prop; each tab by its label; each panel by its tab.'],
            ['States', '`aria-selected` on the selected tab; other panels are `hidden` but stay mounted, so their state survives.'],
            ['Visible selection', 'Text color and an indicator bar under the selected tab; an underline in forced colors.'],
            ['Focus', 'The shared focus outline, drawn inside the tab so the scrolling list does not clip it.'],
            ['Motion', 'The indicator animates when selection moves; reduced motion removes the transition.'],
            ['Narrow screens', 'The list scrolls sideways instead of wrapping.'],
          ],
        },
      ],
    },
    {
      id: 'demo',
      title: 'Try the contract',
      blocks: [
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The shared Tabs. Focus a tab and use the arrow keys, Home and End, then switch to right to left: ArrowLeft now moves to the next tab.',
          Visual: DirectionTabs,
        },
      ],
    },
    {
      id: 'evidence',
      title: 'What each kind of check establishes',
      blocks: [
        {
          kind: 'table',
          caption: 'Checks that apply to Tabs, what they prove, and what they cannot',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Check', 'Establishes', 'Does not establish', 'In this repository'],
          rows: [
            ['Unit tests', 'Roles, names, one tab stop, arrow keys, Home, End, wrapping and Tab into the panel, in jsdom.', 'Anything that depends on layout or CSS: focus visibility, scrolling, right-to-left direction.', 'Implemented: `Tabs.test.tsx`.'],
            ['Browser tests', 'The same keyboard pattern in a real browser, and, on this page, mirrored arrows in right to left.', 'Other browsers, and how assistive technology announces anything.', 'Implemented in Chromium: `e2e/accessibility.spec.ts` and the decisions tests.'],
            ['Automated scans', 'No machine-detectable WCAG A and AA rule failures on pages that use Tabs, in light and dark.', 'Whether names make sense, whether the keyboard model is right, or conformance.', 'Implemented: axe-core on the resource detail pattern and other routes.'],
            ['Token contrast tests', 'Tab text, the focus outline and the selected indicator meet their ratios on every surface, in every product and theme.', 'Contrast of what products put inside panels.', 'Implemented: `contrast.test.ts`.'],
            ['Manual evaluation', 'Keyboard behavior as a person uses it, forced colors and reduced motion.', 'Screen-reader output, real Windows contrast themes, real zoom.', 'Done once, in the audit, in Edge with emulated modes.'],
            ['Screen-reader evaluation', 'What is announced when a tab is focused and selected, and whether the panel is reachable.', 'Other screen reader and browser pairings than those tried.', 'Not done. Proposed before stable.'],
          ],
        },
        {
          kind: 'note',
          title: 'A pass is not conformance',
          text: 'Passing every automated check means no check found a problem. It does not mean Tabs conforms to WCAG; this project makes no conformance claim, and [What remains unverified](/decisions/quality#unverified) lists what was never tested.',
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The code, tests and records behind this page. Each file opens in place.',
          Visual: QualityEvidence,
        },
      ],
    },
    {
      id: 'unverified',
      title: 'What remains unverified',
      blocks: [
        {
          kind: 'list',
          items: [
            '**Screen readers.** No pairing has been tried, so role, name and selection announcements are unconfirmed.',
            '**Firefox and Safari.** Every browser check ran in Chromium.',
            '**Real forced colors and zoom.** Forced colors were emulated, and 400% zoom was approximated by 320-pixel reflow.',
            '**Touch.** Phones were emulated by viewport size; swiping the tab list was not tried on a device.',
            '**A cue that tabs overflow.** The list hides its scrollbar, so on a narrow screen nothing shows that more tabs are off-screen.',
            '**Heavy panels.** Automatic activation suits light panels; whether a slow panel needs manual activation is undecided.',
          ],
        },
      ],
    },
    {
      id: 'matrix',
      title: 'An acceptance matrix',
      blocks: [
        {
          kind: 'table',
          caption: 'Acceptance matrix for Tabs, with the evidence each row has today',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Area', 'Accept when', 'Evidence today', 'Status'],
          rows: [
            ['Keyboard interaction', 'Tab, arrows, Home and End behave as the contract says, in both writing directions.', 'Unit and Chromium browser tests; right to left on this page.', 'Met in Chromium.'],
            ['Focus', 'Focus is always visible, never clipped, and stays on the tab when selection changes.', 'Focus outline contrast tested; keyboard checked in the audit.', 'Met in Chromium.'],
            ['Accessible names', 'The list, every tab and every panel have names that make sense out of context.', 'Unit tests query by role and name.', 'Met for the component; product labels are the product’s job.'],
            ['States', 'Selection is exposed and announced; hidden panels are not reachable.', 'Unit tests for `aria-selected` and visibility.', 'Exposure met; announcement not verified.'],
            ['Contrast', 'Text 4.5:1; indicator and focus outline 3:1, on every surface.', '`contrast.test.ts` in every product and theme.', 'Met.'],
            ['Motion preferences', 'With reduced motion, the indicator moves without animating.', 'The audit measured no long transitions under emulated reduced motion.', 'Met once, by hand; not automated.'],
            ['Supported environments', 'The rows above hold in each supported browser, with at least two screen-reader pairings, in forced colors and at 400% zoom.', 'Chromium only; emulated modes.', 'Not met. Blocks stable.'],
          ],
        },
      ],
    },
    {
      id: 'findings',
      title: 'Recording and prioritizing findings',
      blocks: [
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'This repository records findings in an accessibility defect ledger: each issue has a severity, a priority, an owner and acceptance criteria, and its status separates fixed from verified. Eight issues were recorded; all are fixed and await independent verification. The audit that produced them is listed with [the evidence](/decisions/quality#evidence).',
          ],
        },
        {
          kind: 'record',
          caption: 'Finding TAB-01 (hypothetical): hidden tabs on narrow screens',
          fields: [
            { label: 'Observed', statements: [{ evidence: 'hypothetical', text: 'The provider workspace’s record view has seven tabs. At 320 pixels the last three are off-screen, and nothing shows they exist.' }] },
            { label: 'Cause', statements: [{ evidence: 'implemented', text: 'The tab list scrolls sideways and hides its scrollbar (`Tabs.module.css`).', example: tabsDocs }] },
            { label: 'Affected criterion', statements: [{ evidence: 'proposed', text: 'Narrow screens, in the contract. Keyboard users still reach every tab with the arrow keys, so it is not a keyboard failure.' }] },
            { label: 'Severity and priority', statements: [{ evidence: 'proposed', text: 'Medium severity: content is hard to discover, not blocked. Priority before stable, because both products have narrow screens.' }] },
            { label: 'Owner', statements: [{ evidence: 'hypothetical', text: 'The core team’s Tabs owner, with the provider workspace’s representative to confirm the fix.' }] },
            { label: 'Accept when', statements: [{ evidence: 'proposed', text: 'At 320 pixels, a visible cue shows that more tabs exist, in both writing directions and in forced colors.' }] },
            { label: 'Status', statements: [{ evidence: 'hypothetical', text: 'Open. Recorded in the ledger and the acceptance matrix.' }] },
          ],
        },
        {
          kind: 'table',
          caption: 'How findings are prioritized',
          evidence: 'proposed',
          columns: ['Severity', 'Meaning', 'Handling'],
          rows: [
            ['High', 'Someone cannot complete a task: a keyboard trap, a missing name, lost input.', 'An urgent defect: fixed in a patch release, whatever the label.'],
            ['Medium', 'A task is harder or something is hard to discover.', 'Fixed before the next promotion; may ship in beta with the finding listed.'],
            ['Low', 'Friction with an easy workaround.', 'Scheduled; does not block promotion.'],
          ],
        },
      ],
    },
    {
      id: 'promotion',
      title: 'What keeps Tabs at beta',
      blocks: [
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'The stable requirements that are checked automatically would already pass for Tabs: it is named in automated tests and used outside its own page. Automation is not what holds it back.',
          ],
        },
        {
          kind: 'list',
          items: [
            'The supported-environments row of the matrix: other browsers, two screen-reader pairings, real forced colors and zoom.',
            'Finding TAB-01, a medium-severity finding, in this example.',
            'A decision on manual activation for heavy panels, since adding it later would change the API.',
            'Use in more than one product context, which the beta label says it has not yet had.',
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['Promote when every matrix row is met or has a recorded gap that the component owner and both product representatives accept, with a date to revisit it.'],
        },
      ],
    },
    {
      id: 'responsibilities',
      title: 'Component and product responsibilities',
      blocks: [
        {
          kind: 'table',
          caption: 'What the shared component guarantees, and what depends on how a product uses it',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Concern', 'Tabs guarantees', 'The product must'],
          rows: [
            ['Names', 'A required list name, and panels named by their tabs.', 'Write labels that make sense on their own, not “Tab 1”.'],
            ['Keyboard', 'The full keyboard pattern and the focus outline.', 'Keep panels free of keyboard traps, and not move focus on load.'],
            ['Panel content', 'A focusable panel, so content without controls is reachable.', 'Make the content itself accessible: headings, links, images and forms.'],
            ['Direction and language', 'Arrows mirror whatever direction the page sets.', 'Set `dir` and `lang` correctly for the content.'],
            ['Contrast', 'Tested tokens for tabs, indicator and focus.', 'Check colors and images it puts inside panels.'],
            ['Motion', 'No animation under reduced motion.', 'Respect reduced motion in its own panel content.'],
            ['Choice of pattern', 'Nothing: the component cannot know.', 'Use tabs for alternative views, not steps or page navigation, and keep critical content out of hidden tabs.'],
          ],
        },
      ],
    },
    {
      id: 'regressions',
      title: 'When a regression ships',
      blocks: [
        {
          kind: 'steps',
          items: [
            { title: 'Report', text: 'Anyone reports it with the steps, the environment and the version. It goes straight to the [urgent defect path](/decisions/operating#defects) if it blocks a task.' },
            { title: 'Reproduce and classify', text: 'The owner reproduces it, sets severity, and names the matrix row it breaks.', output: 'a ledger entry linked to the row' },
            { title: 'Contain', text: 'Products pin the previous version or apply a logged workaround that expires with the fix.' },
            { title: 'Fix test first', text: 'Write the check that would have caught it, see it fail, then fix the component.', output: 'a new automated check, or a new manual step where automation cannot reach' },
            { title: 'Release and verify', text: 'A patch release with a note naming affected versions; each product confirms the fix on its own screens.' },
            { title: 'Update the matrix', text: 'Record the new evidence, and ask why the matrix allowed it: a missing row, or a row marked met too early.' },
          ],
        },
      ],
    },
  ],
  sources: ['apg', 'wcag'],
};
