import { Text } from '@/design-system/primitives';
import { Rich } from '../Blocks';
import type { Decision } from '../types';
import styles from '../decisions.module.css';

const chain = [
  {
    stage: 'Principle',
    text: '**Purpose before appearance.** Components read what a value is for, not the value itself.',
  },
  {
    stage: 'Requirement',
    text: 'Components may read semantic and component tokens, never palette colors. **Accepted when** lint fails if a stylesheet reads a palette variable, and the token build fails if a component token points at a palette color.',
  },
  {
    stage: 'Implementation',
    text: 'Three [token tiers](/foundations/tokens#tiers) and a written [dependency policy](/foundations/tokens#policy). The token build checks every alias in all twelve theme, product and density combinations.',
  },
  {
    stage: 'Validation',
    text: '`check-styles.mjs` (run by lint) and the token pipeline (run by the build) fail when a rule breaks, and policy tests cover each rule. To see the result, switch **Product** in the header: every component restyles without a code change.',
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
        text: 'Agree a few principles that settle the trade-off between Meadow’s guidance and Harbor’s density, then test the requirements in one equivalent pilot flow in each product.',
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Promote one product’s components.** Fastest, but every control inherits Harbor’s density or Meadow’s step-by-step guidance.',
          '**Principles only.** Easy to agree, but nothing in them can pass or fail.',
          '**Choose the architecture first.** It settles what to share before anyone knows which controls are equivalent.',
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
      { evidence: 'hypothetical', text: 'The pilot passes requirements R1 to R5 in both products without forking a shared component.' },
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
              text: 'Who uses the products, for which workflows, on which devices. Take an [interface inventory](https://bradfrost.com/blog/post/interface-inventory/): one screenshot of every distinct control, with the versions counted. Ask designers, engineers and product owners where the inconsistencies cost them.',
              output: 'a short system brief',
            },
            {
              title: 'Agree principles',
              text: 'Three to five statements that settle the trade-offs the inventory exposed, such as flexibility against consistency.',
              output: 'principles, each with a worked decision',
            },
            {
              title: 'Write scoped requirements',
              text: 'Turn each principle and constraint into a requirement with an acceptance criterion someone could test. Say what is out of scope.',
              output: 'a requirements table',
            },
            {
              title: 'Define ownership and a pilot',
              text: 'Name who owns the system and who decides exceptions. Choose one real workflow, small enough to finish and real enough to break the abstractions.',
              output: 'a pilot plan',
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
            'The documents below are written for Meadow and Harbor to show the level of detail, not real findings. The requirements are the core of the plan, so they are shown in full, each beside the closest working example in this repository.',
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
              'A test forces a failure and checks that every value survives and focus moves to an error summary.',
              'Should',
              '[Form validation](/patterns/form-validation): values stay, and focus moves to a summary that links to each field.',
            ],
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
                    ['Problem', 'Meadow and Harbor rebuild the same controls with different behavior, and accessibility fixes are made twice.'],
                    ['People', 'Meadow: occasional consumers completing guided tasks, mostly on phones. Harbor: professionals scanning and acting on dense information at desks.'],
                    ['In scope', 'Tokens, buttons, form controls, alerts and dialogs, and their documentation.'],
                    ['Out of scope', 'Product screens, workflows and business logic.'],
                    ['Owner', 'A small core team, with one representative from each product.'],
                    ['First pilot', 'One form both products have, built in each.'],
                  ],
                },
              ],
            },
            {
              summary: 'Pilot plan',
              blocks: [
                {
                  kind: 'table',
                  caption: 'A pilot plan',
                  evidence: 'hypothetical',
                  columns: ['Item', 'Plan'],
                  rows: [
                    ['Workflow', 'Entering and correcting details in a form, with required fields, an error summary and a failed submission. In Meadow it is one step of a guided task; in Harbor, an edit panel beside a dense list.'],
                    ['People', 'One designer and one engineer from each product, with the core team.'],
                    ['Duration', 'Six weeks.'],
                    ['Done when', 'R1 to R5 pass in both products, no shared component was forked, and the findings are written up.'],
                    ['Way back', 'Behind a feature flag; the old screens stay until the pilot passes.'],
                  ],
                },
              ],
            },
            {
              summary: 'Measurement plan',
              blocks: [
                {
                  kind: 'table',
                  caption: 'A measurement plan',
                  evidence: 'proposed',
                  columns: ['Measure', 'Baseline', 'Proposed target', 'Owner'],
                  rows: [
                    ['Duplicate controls', 'Local buttons, inputs and dialogs per product, counted before the pilot', 'Falling every release', 'Core team'],
                    ['Accessibility defects in shared controls', 'Open defects by component and severity', 'None open at high severity', 'Product QA leads'],
                    ['Time for the pilot flow', 'Time to build it the old way', 'Set only after the baseline exists', 'Engineering managers'],
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
          ],
        },
      ],
    },
  ],
  sources: ['inventory', 'atomic', 'criteria'],
};
