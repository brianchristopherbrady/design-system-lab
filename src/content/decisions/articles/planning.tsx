import { Text } from '@/design-system/primitives';
import { Rich } from '../Blocks';
import type { Decision } from '../types';
import styles from '../decisions.module.css';

const chain = [
  {
    stage: 'Principle',
    text: '**Purpose before appearance.** Components read what a value is for, not the value itself. One of the [principles above](/decisions/planning#principles).',
  },
  {
    stage: 'Requirement',
    text: 'Components may read semantic and component tokens, never palette colors. **Accepted when** lint fails if a stylesheet reads a palette variable, and the token build fails if a component token points at a palette color. See the [“Colors go through roles” rule](/foundations/tokens#policy).',
  },
  {
    stage: 'Implementation',
    text: 'Three [token tiers](/foundations/tokens#tiers) and a written [dependency policy](/foundations/tokens#policy). The token build checks every alias in all twelve theme, product and density combinations.',
  },
  {
    stage: 'Validation',
    text: '`check-styles.mjs` (run by lint) and the [token pipeline and policy tests](/foundations/tokens#source) fail when a rule breaks; [What this project checks](/decisions/operating#checked) lists every check. To see the result, compare [Products × themes](/foundations/products#matrix): every component restyles without a code change.',
  },
] as const;

function PrincipleChain() {
  return (
    <ol className={styles.chain} aria-label="From principle to validation">
      {chain.map((link) => (
        <li key={link.stage} className={styles.chainLink}>
          <Text as="span" variant="caption" tone="muted">
            {link.stage}
          </Text>
          <Text as="span" variant="bodySmall">
            <Rich text={link.text} />
          </Text>
        </li>
      ))}
    </ol>
  );
}

export const planning: Decision = {
  id: 'planning',
  stage: 'Discovery and requirements',
  question: 'How do I decide what a design system should solve?',
  matters: 'An architecture chosen before the requirements tends to fit whichever product was studied first.',
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'Meadow and Harbor each built their own buttons, form fields and dialogs. The same control behaves differently in each product, accessibility fixes are made twice, and nobody has counted how much overlaps.',
      },
    ],
    choice: [
      { evidence: 'proposed', text: 'Inventory both products and write testable requirements before deciding what to share.' },
      {
        evidence: 'proposed',
        text: 'Agree a few principles that settle the trade-off between Meadow’s guidance and Harbor’s density, address [form fields and their errors first](/decisions/planning#priorities), and test them in one [pilot form](/decisions/planning#pilot) in each product.',
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Promote one product’s components.** Fastest, but every control inherits Harbor’s density or Meadow’s step-by-step guidance.',
          '**Principles only.** Easy to agree, but nothing in them can pass or fail.',
          '**Choose the architecture first.** It settles what to share before anyone knows which controls are equivalent.',
          '**Build a full system up front.** Patterns, templates and a documentation site before one shared control is proven; [smaller options](/decisions/planning#scope) may be enough.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'Shared components start later than a straight port would. In exchange, each requirement can pass or fail, and the pilot can show a principle is wrong before both products depend on it.',
      },
    ],
    validation: [
      { evidence: 'hypothetical', text: 'Pilot checks P1 to P6 pass in both products without forking a shared component, judged by decision rules agreed before the pilot starts.' },
      {
        evidence: 'implemented',
        text: 'In this repository, “purpose before appearance” is enforced: lint fails when a stylesheet reads a palette color, and the token build fails when a component token aliases one.',
        example: { label: 'Dependency policy', href: '/foundations/tokens#policy' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'The pilot shows Meadow and Harbor need different behavior from a control the requirements treat as shared, or a third product arrives whose people are unlike either.',
      },
    ],
  },
  sections: [
    {
      id: 'process',
      title: 'The process',
      blocks: [
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: ['Five steps, each producing something a team can review. In practice they overlap: a pilot often sends you back to rewrite a requirement.'],
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Understand what exists',
              text: 'Who uses the products, for which workflows, on which devices. Take an [interface inventory](https://bradfrost.com/blog/post/interface-inventory/): one screenshot of every distinct control, with the versions counted. Ask designers, engineers and product owners where the inconsistencies cost them, and separate product differences from duplication.',
              output: 'an inventory and a short system brief',
            },
            {
              title: 'Agree principles',
              text: 'Three to five statements that settle the trade-offs the inventory exposed, such as flexibility against consistency.',
              output: 'principles, each with a worked decision',
            },
            {
              title: 'Write scoped requirements',
              text: 'Turn each principle and finding into a requirement with an acceptance criterion someone could test. Say what is out of scope.',
              output: 'a requirements table, traced to findings',
            },
            {
              title: 'Prioritize and define a pilot',
              text: 'Weigh each candidate’s frequency, user impact, accessibility risk, duplication and migration effort; decide how much system is enough. Name who owns it, then pilot the first candidate in one real workflow, with rules for continuing, revising or stopping.',
              output: 'priorities and a pilot plan',
            },
            {
              title: 'Set baselines and measures',
              text: 'Measure today before anything changes, and choose a few measures tied to the problems in the brief.',
              output: 'a measurement plan',
            },
          ],
        },
      ],
    },
    {
      id: 'inventory',
      title: 'What the inventory found',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'An inventory is evidence, not a verdict. Each finding needs a judgment: a **legitimate difference** follows from different people or tasks and should stay; **unnecessary duplication** solves the same problem twice; a **defect** is wrong in either product.',
          ],
        },
        {
          kind: 'table',
          caption: 'A Meadow and Harbor inventory. Findings are invented to show the method; version counts are illustrative, not measured.',
          evidence: 'hypothetical',
          stacked: true,
          columns: ['Finding', 'Meadow', 'Harbor', 'Judgment'],
          rows: [
            [
              'I1 · Primary button (control, styling)',
              'Three versions: pill-shaped, full width on phones. The brand color is hard-coded as four slightly different values.',
              'Two versions: square corners, compact. The brand color is hard-coded.',
              '**Unnecessary duplication.** Same behavior in both. Shape and color are legitimate brand expression, which tokens can carry without separate components.',
            ],
            [
              'I2 · Text field errors (behavior)',
              'Validates as people type. Errors are red text, not tied to the field. A failed request clears the step.',
              'Validates on save. Errors are tied to fields, with a summary. A failed request keeps the values.',
              '**Defect in Meadow, then duplication.** Losing input and color-only errors are not product differences.',
            ],
            [
              'I3 · Error wording (terminology)',
              '“Oops, something’s not right.”',
              '“Validation failed (code 422).”',
              '**Partly legitimate.** Voice can differ. Neither says what went wrong or how to fix it, which both products need.',
            ],
            [
              'I4 · Confirmation dialog (control, behavior)',
              'A styled overlay. Focus can leave it, and closing sends focus to the top of the page.',
              'A native dialog. Focus stays inside and returns to the button that opened it.',
              '**Defect in Meadow, and duplication.** One behavior is correct for everyone.',
            ],
            [
              'I5 · Focus indicator (styling)',
              'Removed from buttons on some screens.',
              'Browser default, faint against the brand color.',
              '**Defect in both.** One focus role, mapped per product, fixes it without new components.',
            ],
            [
              'I6 · Control size (styling)',
              '48 pixel controls for touch.',
              '32 pixel controls for dense lists.',
              '**Legitimate difference.** A density setting, not separate components.',
            ],
            [
              'I7 · Product-only controls',
              'Step progress (“Step 2 of 4”) with a back link on every step.',
              'A sortable table with row selection and bulk actions.',
              '**Legitimate difference.** Each serves one product’s task; neither is shared.',
            ],
            [
              'I8 · Search (control, behavior)',
              'A text field with a search icon.',
              'A text field with a search icon.',
              '**Legitimate difference.** It looks the same and behaves differently; see [below](/decisions/planning#similar).',
            ],
          ],
        },
      ],
    },
    {
      id: 'similar',
      title: 'Similar look, different behavior',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Search (I8) looks identical in both products. Sharing one search component would mean an option for every difference below, and each product would carry behavior it never uses.'],
        },
        {
          kind: 'table',
          caption: 'Meadow’s search step and Harbor’s list filter',
          evidence: 'hypothetical',
          columns: ['Aspect', 'Meadow search step', 'Harbor list filter'],
          rows: [
            ['What it does', 'Asks one question, then moves to a results step', 'Narrows the visible list as people type, without leaving the page'],
            ['Results', 'A few ranked matches, with guidance when nothing fits', 'A count of matching rows, announced politely; no results shown inline'],
            ['Keyboard', 'Enter submits', 'A shortcut focuses the field; Escape clears it; no submit'],
            ['State', 'Part of the guided task’s progress', 'In the URL, so a filtered list can be shared and restored'],
          ],
        },
        {
          kind: 'list',
          items: [
            '**Share** the text input, its label pattern and the tokens.',
            '**Keep in each product** the search component and its behavior.',
            '**Revisit** if Meadow ever needs a list filter: it would reuse Harbor’s, because the behavior would then match.',
          ],
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'The [Resource directory](/patterns/resource-directory) here behaves like Harbor’s filter: it narrows entries as you type and announces the count. The [Components index](/components) keeps the same filters in the URL.',
          ],
        },
      ],
    },
    {
      id: 'priorities',
      title: 'What to address first',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Five questions for each candidate: how often people meet it, how much harm it does, how risky it is for accessibility, how much work is duplicated, and how hard it is to migrate. The answers below are judgments to argue with, not measurements.',
          ],
        },
        {
          kind: 'table',
          caption: 'Candidates from the inventory, weighed in words. Frequencies are assumptions until counted.',
          evidence: ['hypothetical', 'proposed'],
          stacked: true,
          columns: ['Candidate', 'Frequency', 'User impact', 'Accessibility risk', 'Duplication', 'Migration effort', 'Decision'],
          rows: [
            [
              'Form field and its errors (I2, I3)',
              'High: most tasks in both products end in a form (assumption).',
              'High: Meadow loses what people entered when a request fails.',
              'High: Meadow’s errors are color only and not tied to fields.',
              'High: two implementations, two error styles.',
              'Medium: many forms, but each can move on its own.',
              '**First.** The pilot.',
            ],
            [
              'Confirmation dialog (I4)',
              'Low: confirmations only.',
              'Medium: a lost place, not lost work.',
              'High: focus escapes Meadow’s overlay.',
              'Medium: two implementations.',
              'Low: few call sites.',
              '**Second,** or first if an audit or a user report flags it.',
            ],
            [
              'Primary button (I1, I5)',
              'High: on every screen.',
              'Low: it works; it looks different.',
              'Medium: the missing focus indicator, which a token fixes.',
              'High: five versions between the products (I1).',
              'High: used everywhere.',
              '**Tokens now,** component later.',
            ],
            [
              'Search (I8)',
              'High in Harbor, low in Meadow.',
              'Medium.',
              'Medium.',
              'Low: similar look, different behavior.',
              'Not applicable.',
              '**Not shared.**',
            ],
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            '**Why the form field goes first.** It is the only candidate high on frequency, user impact and accessibility risk at once, and its migration can happen one form at a time. One pilot form also exercises all six requirements, so the riskiest shared behavior is tested early.',
            '**Why not a score.** Adding up the ratings would put the button near the top on frequency and duplication alone, although tokens fix most of what is wrong with it. One high accessibility risk can outweigh several lows, and a total hides which.',
            '**What would change the order.** An audit or user report about the dialog, or a count showing forms are rarer than assumed.',
          ],
        },
      ],
    },
    {
      id: 'scope',
      title: 'How much system is enough',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['A larger system is not the default. Choose the smallest option that removes the duplication and defects the inventory found.'],
        },
        {
          kind: 'table',
          caption: 'Options, when each is enough, and where Meadow and Harbor land',
          evidence: ['proposed', 'hypothetical'],
          stacked: true,
          columns: ['Option', 'Enough when', 'Not enough when', 'Meadow and Harbor'],
          rows: [
            [
              'Shared tokens only',
              'Differences are mostly visual (color, type, spacing, shape), and each product’s controls already behave correctly. Works across any stack.',
              'Behavior or accessibility defects are duplicated in the controls themselves.',
              'Enough for the button and focus findings (I1, I5); not for field errors (I2) or the dialog (I4).',
            ],
            [
              'A small component collection',
              'A handful of controls carry most of the duplicated behavior, both products use one framework, and a small team can own it.',
              'Many shared patterns need governing, or more products join.',
              'The plan: field, select, checkbox, button and alert, then the dialog.',
            ],
            [
              'An existing library',
              'The controls are standard, its theming can express both brands, its accessibility is documented and tested, and nobody can fund maintenance.',
              'Required behavior is missing, the brands need overrides of its internals, or its upgrades would force both products to move at once.',
              'Evaluate one for the dialog before building it; the focus handling is the hard part.',
            ],
            [
              'A larger system',
              'Several products share many patterns, and a team is funded to run contribution, releases and documentation.',
              'Two products share five or six controls: it would cost more than the duplication it removes.',
              'Not yet. Revisit if a third product joins.',
            ],
          ],
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'Tokens already carry the button and focus findings here: product modes change only [brand colors, typefaces and corner radii](/foundations/products#overrides), and the `focus.ring` role is [contrast-tested](/foundations/color#contrast) at 3:1 against surfaces in every product and theme.',
          ],
        },
      ],
    },
    {
      id: 'principles',
      title: 'Principles that settle trade-offs',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'A principle earns its place when it decides between two reasonable options. “Keep it simple” does not: everyone agrees, and nothing changes. Each principle behind this system resolves a specific tension.',
          ],
        },
        {
          kind: 'table',
          caption: 'Tensions, and the principles this system uses to resolve them',
          evidence: 'implemented',
          columns: ['Tension', 'Principle', 'What it decides'],
          rows: [
            ['Flexibility or consistency', 'Choices, not values', 'Visual props accept named options such as `size="large"` rather than arbitrary CSS, and the options map to token scales.'],
            ['Brand expression or shared behavior', 'Purpose before appearance', 'Components read semantic roles; products remap the roles instead of forking components.'],
            ['Custom polish or accessibility', 'Native first', 'A button is a `<button>`, so the platform supplies its keyboard and screen-reader basics; components add what the element lacks, and both still need testing.'],
            ['Page layouts or reusable parts', 'Space-aware components', 'Components respond to their container, so one implementation works in a sidebar, a dialog or a full page.'],
            ['Speed of documentation or trust in it', 'Verified where it can be checked', 'Claims are backed by the token build, lint and tests, documentation is generated from the code, and the limits of automated checks are stated.'],
          ],
        },
      ],
    },
    {
      id: 'example',
      title: 'Worked example: from principle to validation',
      blocks: [
        {
          kind: 'visual',
          evidence: 'implemented',
          Visual: PrincipleChain,
          caption: 'One principle traced through this project: what it requires, how it is built, and what fails when it is broken.',
        },
      ],
    },
    {
      id: 'outputs',
      title: 'What the plan produces',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'The documents below are written for Meadow and Harbor to show the level of detail, not real findings. The requirements are shown in full, each beside the closest working example in this repository, followed by a trace from every inventory finding to the plan.',
          ],
        },
        {
          kind: 'table',
          caption: 'Requirements for Meadow and Harbor, with acceptance criteria and the closest working example here',
          evidence: ['hypothetical', 'implemented'],
          wide: true,
          columns: ['ID', 'Requirement', 'Accepted when', 'Priority', 'Closest working example here'],
          rows: [
            [
              'R1',
              'Every shared control works with a keyboard alone.',
              'The pilot flow completes with Tab, Shift+Tab, Enter, Space and arrow keys, and focus is always visible.',
              'Must',
              '[Tabs](/components/tabs) and [Dialog](/components/dialog): arrow keys, focus containment and focus return, covered by browser tests.',
            ],
            [
              'R2',
              'The pilot flow targets WCAG 2.2 AA.',
              'An evaluation of the pilot flow lists the applicable success criteria; records automated results and manual checks of keyboard use, focus, labels and error handling, plus a screen-reader pass; and names untested criteria and open failures. It reports results per criterion rather than claiming conformance.',
              'Must',
              'Automated axe scans in both themes, keyboard and reflow tests; [not a full evaluation](/decisions/operating#checked).',
            ],
            [
              'R3',
              'Products change brand and shape without forking components.',
              'Each product’s token file overrides only brand colors, typefaces and corner radii, and a test fails otherwise.',
              'Must',
              '[What a product changes](/foundations/products#overrides): the Harbor and Meadow modes, held to that limit by a policy test.',
            ],
            [
              'R4',
              'Dense screens can opt into a compact density.',
              'Compact density applies per screen or region, and targets and contrast still pass.',
              'Should',
              '[Density](/foundations/products#density): compact controls stay above the 24 pixel minimum target size.',
            ],
            [
              'R5',
              'A failed submission keeps what people entered.',
              'Two forced failures each keep every value. Invalid input moves focus to an error summary that links to each field; a failed request after valid input moves focus to an alert that explains it and offers to retry.',
              'Must',
              '[Form validation](/patterns/form-validation) covers invalid input: values stay and focus moves to the summary. It sends no request. [Resource detail](/patterns/resource-detail#states) keeps a failed archive open with an alert and Try again.',
            ],
            [
              'R6',
              'Error messages say what is wrong and how to fix it. Voice stays per product.',
              'Every message in the pilot names the problem and the fix, and each product’s content owner approves the wording.',
              'Should',
              '[Form validation](/patterns/form-validation) messages, such as “Use PascalCase letters only, like DatePicker.”',
            ],
          ],
        },
        {
          kind: 'table',
          caption: 'From inventory findings to principles, requirements, pilot checks and measures',
          evidence: 'hypothetical',
          wide: true,
          columns: ['Finding', 'Principle', 'Requirement', 'Pilot check', 'Proposed measure'],
          rows: [
            ['I1 Primary button', 'Purpose before appearance', 'R3', 'P3', 'Duplicate controls'],
            ['I2 Text field errors', 'Native first: Field adds the error wiring a native input lacks', 'R5', 'P5, P6', 'Forms that keep input; accessibility defects in shared controls'],
            ['I3 Error wording', 'Purpose before appearance: structure shared, voice per product', 'R6', 'P5', 'None: reviewed in the pilot'],
            ['I4 Confirmation dialog', 'Native first', 'R1', 'Not in this pilot; next candidate', 'Accessibility defects in shared controls; duplicate controls'],
            ['I5 Focus indicator', 'Verified where it can be checked', 'R1, R2', 'P1, P2', 'Accessibility defects in shared controls'],
            ['I6 Control size', 'Choices, not values: density is a named option', 'R4', 'P4', 'None: checked in the pilot'],
            ['I7 Product-only controls', 'None: they stay in each product', 'Out of scope', 'None', 'None'],
            ['I8 Search', 'None: share the input only', 'Out of scope', 'None', 'None'],
          ],
        },
        {
          kind: 'details',
          items: [
            {
              summary: 'System brief',
              blocks: [
                {
                  kind: 'table',
                  caption: 'A one-page system brief',
                  evidence: 'hypothetical',
                  columns: ['Part', 'Content'],
                  rows: [
                    ['Problem', 'Meadow and Harbor rebuild the same controls with different behavior, and accessibility fixes are made twice ([inventory](/decisions/planning#inventory)).'],
                    ['People', 'Meadow: occasional consumers completing guided tasks, mostly on phones. Harbor: professionals scanning and acting on dense information at desks.'],
                    ['In scope', 'Tokens, then a small collection: field, select, checkbox, button and alert, with the dialog next.'],
                    ['Out of scope', 'Product screens, workflows, search, tables, step progress and business logic.'],
                    ['Owner', 'A small core team, with one representative from each product (assumption).'],
                    ['First pilot', 'One form in each product ([pilot](/decisions/planning#pilot)).'],
                  ],
                },
              ],
            },
            {
              summary: 'Measurement plan',
              blocks: [
                {
                  kind: 'table',
                  caption: 'A measurement plan, each measure tied to inventory findings',
                  evidence: 'proposed',
                  columns: ['Measure', 'Findings', 'Baseline', 'Proposed target', 'Owner'],
                  rows: [
                    ['Duplicate controls', 'I1, I4', 'Local buttons, inputs and dialogs per product, recounted before the pilot', 'Falling every release', 'Core team'],
                    ['Forms that keep input', 'I2', 'Share of forms per product that keep every value after a failed request, counted before the pilot', 'Every form built on the shared field', 'Product engineering leads'],
                    ['Accessibility defects in shared controls', 'I2, I4, I5', 'Open defects by component and severity', 'None open at high severity', 'Product QA leads'],
                    ['Time for the pilot flow', 'All', 'Time to build the same form the old way', 'Set only after the baseline exists', 'Engineering managers'],
                  ],
                },
                { kind: 'text', paragraphs: ['How each measure can mislead is covered in [Operating and measuring a system](/decisions/operating#measures).'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'pilot',
      title: 'The pilot',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'One form in each product, because the form field ranks first and one form exercises every requirement. The dialog is not in this pilot; it is the next candidate.',
          ],
        },
        {
          kind: 'table',
          caption: 'A pilot plan. Team size and duration are assumptions.',
          evidence: 'hypothetical',
          columns: ['Item', 'Plan'],
          rows: [
            [
              'Workflow',
              'Entering and correcting details: text fields, a choice from a short list, a confirmation checkbox, an error summary and a failed request. In Meadow it is one step of a guided task on a phone; in Harbor, an edit panel beside a dense list, in compact density.',
            ],
            ['Shared controls', 'Field, text input, select, checkbox, button and alert.'],
            ['People', 'One designer and one engineer from each product, with the core team (assumption).'],
            ['Duration', 'Six weeks (assumption).'],
            ['Way back', 'Behind a feature flag; the old screens stay until the pilot passes.'],
          ],
        },
        {
          kind: 'table',
          caption: 'Pilot checks, each tied to a requirement',
          evidence: 'hypothetical',
          columns: ['Check', 'Requirement', 'What the pilot does'],
          rows: [
            ['P1', 'R1', 'Completes each form with Tab, Shift+Tab, Enter, Space for the checkbox and arrow keys for the list; focus stays visible.'],
            ['P2', 'R2', 'Evaluates the flow criterion by criterion: automated scan, manual keyboard, focus, labels and error checks, and a screen-reader pass.'],
            ['P3', 'R3', 'Builds both forms from the same components; the product token files differ only in brand colors, typefaces and corner radii.'],
            ['P4', 'R4', 'Renders Harbor’s panel in compact density and checks target sizes and contrast.'],
            ['P5', 'R5, R6', 'Submits invalid input: every value stays, focus moves to the error summary, and each message names the problem and the fix.'],
            ['P6', 'R5', 'Forces a request failure after valid input: every value stays, and focus moves to an alert that offers to retry.'],
          ],
        },
        {
          kind: 'table',
          caption: 'Decision rules, agreed by both product representatives before the pilot starts',
          evidence: 'proposed',
          stacked: true,
          columns: ['Outcome', 'When', 'Then'],
          rows: [
            [
              'Continue',
              'P1 to P6 pass in both products, shared components needed product differences only through tokens, and both teams would build their next form with them.',
              'Move form by form, and start on the dialog.',
            ],
            [
              'Revise',
              'A check fails for a reason the component or requirement can fix, such as compact targets below 24 pixels or an acceptance criterion nobody can test.',
              'Fix it and rerun the failed checks, within one extra two-week cycle (assumption).',
            ],
            [
              'Narrow the shared surface',
              'A control needs product-specific behavior, not just styling, to pass, such as validating per step in Meadow and on save in Harbor.',
              'Take that control out of the shared collection. Share its tokens and a written specification; keep the rest.',
            ],
            [
              'Stop or change approach',
              'Both products had to fork a core control, the core team could not review both teams’ changes in time, or the shared form took longer than the old-way baseline with no fewer defects.',
              'Stop building shared components. Fall back to shared tokens and guidelines, or evaluate an existing library, and record why.',
            ],
          ],
        },
        {
          kind: 'text',
          evidence: 'proposed',
          paragraphs: [
            'Each condition uses evidence the pilot produces anyway: check results, requests for product-only options, review times, and build time against the baseline. Agreeing the rules first stops the result from being reinterpreted afterwards.',
          ],
        },
      ],
    },
    {
      id: 'evidence',
      title: 'See it on this site',
      blocks: [
        {
          kind: 'evidence',
          items: [
            { label: 'Principles', href: '/#principles', shows: 'The six principles this system follows.' },
            { label: 'Token dependency policy', href: '/foundations/tokens#policy', shows: 'A requirement enforced by the build, with its recorded exceptions.' },
            { label: 'Products and modes', href: '/foundations/products', shows: 'The nearest thing to R3 here: three product modes from one token source.' },
            { label: 'Form validation', href: '/patterns/form-validation', shows: 'Errors appear on submit, and focus moves to a summary that links to each field.' },
            { label: 'Resource detail', href: '/patterns/resource-detail#states', shows: 'A failed request keeps the dialog open with an alert and Try again: the nearest thing to P6 here.' },
          ],
        },
      ],
    },
  ],
  sources: ['inventory', 'atomic', 'criteria'],
};
