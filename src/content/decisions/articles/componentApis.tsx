import { SourceList } from '@/features/docs';
import { PaddingTrace, RecordSummary } from '../ApiExamples';
import type { Decision } from '../types';

function ApiEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'src/design-system/primitives/Button/Button.tsx', note: 'appearance, size, border, radius, fullWidth, loading and the defaults object' },
        { path: 'src/design-system/composites/Card/Card.tsx', note: 'Five styling props, each falling back to a card.* component token' },
        { path: 'src/design-system/composites/Dialog/Dialog.tsx', note: 'Controlled open state, dismissOnBackdrop and initialFocus' },
        { path: 'src/design-system/tokens/vocabulary.ts', note: 'The shared option names and the token each one resolves to' },
        { path: 'src/content/components/stories.tsx', note: 'Playground controls built from the exported option arrays' },
        { path: 'src/test/playground.test.tsx', note: 'Fails when a control’s options drift from the component API' },
        { path: 'src/content/decisions/ApiExamples.tsx', note: 'The padding trace and the composed record summary on this page' },
      ]}
    />
  );
}

const playground = {
  buttonLoading: '/playground?component=button&v=1&p.appearance=primary&p.loading=true&p.children=Saving',
  buttonDanger: '/playground?component=button&v=1&p.appearance=danger&p.children=Delete%20entry&p.iconStart=trash',
  cardFlat: '/playground?component=card&v=1&p.elevation=none&p.border=default',
  cardCompact: '/playground?component=card&v=1&p.padding=small&p.radius=small',
  dialogBackdrop: '/playground?component=dialog&v=1&p.size=small&p.dismissOnBackdrop=true',
};

export const componentApis: Decision = {
  id: 'component-apis',
  stage: 'Component contracts',
  question: 'Which choices should a shared component expose as props, and which belong in tokens, composition or product code?',
  matters: 'Every prop a shared component accepts becomes a promise to every product that uses it, and props are much easier to add than to remove.',
  project: {
    choice:
      'I use named options for visual choices and composition for content and workflow. Button exposes `appearance`, `size`, `border` and `radius`; Card takes `header` and `footer` content; a confirmation composes Dialog with Buttons instead of adding a prop for each action.',
    constraint:
      'A prop is a promise to every consumer, so the system owns the values. An unset radius follows the component token and the product; an explicit radius picks a step from the shared scale.',
    tryIt: {
      text: 'Change Button’s appearance and loading state in the Playground: it keeps its emphasis while loading, and the usage code follows the same values. Then trace a Card padding value to your browser.',
      links: [
        { label: 'Button in the Playground', href: '/playground?component=button' },
        { label: 'The padding trace', href: '/decisions/component-apis#options' },
      ],
    },
    tradeoff:
      'A smaller vocabulary for one-off styling, and more composition at the call site. A new shared option has to represent a repeated need, not one screen’s layout.',
    evidence:
      'Playground controls use the option arrays the components export, and a test fails if they drift. TypeScript checks each props table against the component’s own props, and tests check that each documented token trace names a token the component reads. Descriptions and displayed type strings are written by hand and still need review.',
  },
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'Meadow and Harbor will build screens from the same Button, Card and Dialog. Each team will ask for options its own screens need, and any option added stays in the shared API for both.',
      },
    ],
    choice: [
      { evidence: 'proposed', text: 'Give each component a small contract of named, token-backed options and content regions, and keep one product’s needs in that product’s components.' },
      {
        evidence: 'implemented',
        text: 'Button, Card and Dialog in this repository follow that rule: props take named values that resolve to tokens, unset styling props fall back to component tokens, and regions such as `header` and `footer` take content instead of more props.',
        example: { label: 'Card in the Playground', href: '/playground?component=card' },
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**Accept raw CSS values** such as `padding="13px"`. Flexible, but products leave the scale and no theme can retune them.',
          '**Add a prop for every request.** Fast the first time; every prop is permanent, and combinations multiply.',
          '**Fork per product.** Each team gets exactly what it asks for, and every fix is made twice.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'Some requests are answered with composition or a product component instead of a new prop, which takes longer to explain than to add. In return, the shared API stays small enough to test every combination.',
      },
    ],
    validation: [
      {
        evidence: 'implemented',
        text: 'Playground controls are built from the same exported option arrays as the components, and a test fails if they drift apart. Documentation tests check that each documented prop traces to a token the component’s own files read.',
        example: { label: 'Button in the Playground', href: '/playground?component=button' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'Several products need the same variation, or a component’s props start mixing visual choices with behavior that belongs to a different task.',
      },
    ],
  },
  sections: [
    {
      id: 'where',
      title: 'Props, tokens, composition or product code',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Before adding a prop, ask who makes the choice and how often it changes. Each kind of choice has a better home.'],
        },
        {
          kind: 'table',
          caption: 'Where each kind of choice belongs, with examples from this repository',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Kind of choice', 'Belongs in', 'In this repository', 'Why'],
          rows: [
            [
              'A design decision each use chooses from a fixed set',
              'A prop with named values, each backed by a token',
              'Button `appearance`; Card `elevation`; Dialog `size`',
              'The consumer picks a meaning; the system owns the values.',
            ],
            [
              'A value every instance shares, tuned per product or theme',
              'A component token, not a prop',
              '`button.radius` follows the product; an unset Card `padding` reads `card.padding`',
              'A product restyles every instance in one place, and consumers never pass it.',
            ],
            [
              'Content or structure that changes with each use',
              'Composition: children and named regions',
              'Card `header` and `footer`; Dialog `footer` for actions',
              'A region accepts anything the system already provides, so a new layout needs no new prop.',
            ],
            [
              'Behavior the platform already defines',
              'Native attributes, passed through',
              'Button passes `type`, `disabled` and `aria-*` to the native button; Card passes `aria-labelledby`',
              'Reimplementing them would drift from the platform and from assistive technology.',
            ],
            [
              'A need of one product’s workflow',
              'A product component composed from shared parts',
              'None here. In the scenario, Harbor’s bulk-action bar ([inventory finding I7](/decisions/planning#inventory)).',
              'One product’s needs stay out of every product’s API.',
            ],
          ],
        },
      ],
    },
    {
      id: 'purpose',
      title: 'Appearance, state and purpose',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Three questions are easy to fold into one prop. Keeping them apart is what lets each one be correct on its own.'],
        },
        {
          kind: 'table',
          caption: 'Three separate questions, answered in Button',
          evidence: 'implemented',
          columns: ['Question', 'Answered by', 'In Button', 'Who sets it'],
          rows: [
            ['How much should it stand out?', 'Appearance', '`appearance`: `primary`, `secondary`, `ghost` or `danger`', 'The consumer, from the design'],
            ['What is happening right now?', 'Interaction state', 'Hover, pressed and focus come from the browser; `disabled` and `loading` mirror real state', 'The browser, or a prop that reflects real state'],
            ['What does activating it do?', 'Purpose', 'A `<button>` for actions, `type="submit"` in forms, and Link for navigation', 'The element and its native attributes'],
          ],
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'Kept apart, they avoid two common faults. A prominent link is still a [Link](/components/link) styled for emphasis, not a Button that navigates. And `loading` keeps the appearance instead of turning grey, so emphasis does not flicker while a save runs. Heading applies the same split: `level` comes from the page outline and `size` from the design ([Heading props](/components/heading#api)).',
          ],
        },
      ],
    },
    {
      id: 'options',
      title: 'Named, token-backed options',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'A named option fits when its values are a scale the system already owns: spacing, radius, elevation, border strength, surface and tone. Each name resolves to one token, so a theme can change what `large` means without any consumer changing code.',
            'Avoid names that describe a product (`harbor`) or a raw value (`16`). The first ties the shared API to one product; the second ties it to one theme.',
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'Choose a value to follow it from the prop to the token and the value your browser computes. The names and tokens come from `vocabulary.ts`.',
          Visual: PaddingTrace,
        },
      ],
    },
    {
      id: 'defaults',
      title: 'Choosing defaults',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['A default is the choice made for everyone who did not choose. Make it the most common use and the hardest to misuse.'],
        },
        {
          kind: 'table',
          caption: 'Defaults in this repository and why',
          evidence: 'implemented',
          stacked: true,
          columns: ['Default', 'Why'],
          rows: [
            ['Button `appearance="secondary"`', 'One `primary` per view region. A primary default would add a second one wherever someone forgot to choose.'],
            ['Button `type="button"`', 'A native button inside a form submits by default. Here a Button only submits when you pass `type="submit"`.'],
            ['Card styling props unset', 'Each falls back to its `card.*` token, so a product can retune every card that has not opted out.'],
            ['Dialog `dismissOnBackdrop={false}`', 'A stray click outside cannot discard what someone typed. Escape and the close button still work.'],
            ['Dialog focuses its first focusable element', 'That is the close button, which is always safe. For confirmations, pass the Cancel button to `initialFocus`.'],
          ],
        },
      ],
    },
    {
      id: 'booleans',
      title: 'When booleans collide',
      blocks: [
        {
          kind: 'text',
          paragraphs: [
            'Each boolean doubles the number of combinations. When several booleans describe one choice, most combinations mean nothing, and the API cannot say which one wins.',
          ],
        },
        {
          kind: 'code',
          evidence: 'conceptual',
          language: 'tsx',
          caption: 'Rejected: one boolean per appearance. Three booleans give eight combinations, and only four of them mean anything.',
          code: '<Button primary danger ghost>Delete entry</Button>\n// Primary or danger? Ghost with a fill? The API allows it, so someone will write it.',
        },
        {
          kind: 'table',
          caption: 'How Button keeps every combination valid',
          evidence: 'implemented',
          columns: ['Prop', 'Kind', 'Why'],
          rows: [
            ['`appearance`', 'One value from four', 'The options exclude each other, so they are one prop.'],
            ['`fullWidth`', 'Boolean', 'Independent of everything else.'],
            ['`loading`', 'Boolean', 'Independent: it keeps the appearance and replaces `iconStart` with the spinner.'],
            ['`disabled`', 'Native attribute', 'When both apply, the documented rule wins: `disabled` overrides every appearance.'],
          ],
        },
        {
          kind: 'text',
          paragraphs: [
            'Button’s documentation states that no props conflict, and says which rule wins where two apply ([Button props](/components/button#api)). Try [Delete entry](' + playground.buttonDanger + ') with `loading` on in the Playground.',
          ],
        },
      ],
    },
    {
      id: 'responsibility',
      title: 'When a prop is a new responsibility',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Some requests are not options at all. They ask a component to do a different job.'],
        },
        {
          kind: 'table',
          caption: 'Requests that would change what a component is for',
          evidence: 'conceptual',
          stacked: true,
          columns: ['Rejected prop', 'What it really asks for', 'Instead'],
          rows: [
            [
              'Card `href` or `onClick`',
              'Turns a surface into a control. Buttons inside it would become nested interactive content.',
              'Put a Link in the title and Buttons in the footer, as Card’s [guidance](/components/card#guidance) says.',
            ],
            [
              'Dialog `confirmLabel` and `onConfirm`',
              'A confirmation workflow: which action is safe, what happens on failure, where focus goes.',
              'Compose Buttons in `footer` and pass Cancel to `initialFocus`, or write a product confirmation component.',
            ],
            [
              'Button `tooltip`',
              'Hover and focus behavior, positioning and dismissal: a separate component.',
              'Make the label say what the button does. Add a tooltip component only when several products need one.',
            ],
          ],
        },
        {
          kind: 'list',
          items: [
            'The prop needs its own state or events.',
            'It only makes sense together with another prop.',
            'It changes the element’s role, such as from surface to link.',
            'Only one product has asked for it.',
          ],
        },
      ],
    },
    {
      id: 'evolving',
      title: 'Changing an API without breaking consumers',
      blocks: [
        {
          kind: 'table',
          caption: 'Kinds of change, whether they break consumers, and how to ship them',
          evidence: 'proposed',
          stacked: true,
          columns: ['Change', 'Breaks consumers?', 'How to ship it'],
          rows: [
            ['Add an optional prop whose default keeps today’s behavior', 'No', 'A minor release.'],
            ['Add a value to an option list', 'Rarely: code that handles every value exhaustively may need a new case', 'A minor release, noted in the changelog.'],
            ['Change a default', 'Yes: every instance that leaves the prop unset changes', 'A major release, or a new prop that carries the new default.'],
            ['Rename a prop or value', 'Yes', 'Accept both, warn on the old name, remove it in a major release ([release note](/decisions/operating#releases)).'],
            ['Change the token values behind an option', 'Not the API, but the look', 'A release note with before-and-after examples, so products can review screens.'],
          ],
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'This repository versions one contract of its own: Playground links carry `v=1`, and a link written for a different version keeps only its component instead of misreading the props ([Playground](/playground?component=button)).',
          ],
        },
      ],
    },
    {
      id: 'worked',
      title: 'Worked decisions',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Three decisions behind APIs this repository implements. Requirements come from the scenario; contracts and checks are real.'],
        },
        {
          kind: 'record',
          caption: 'Button: a save that takes time',
          fields: [
            { label: 'Requirement', statements: [{ evidence: 'hypothetical', text: 'Harbor’s Save sends a request that can take seconds. People must not submit twice, and keyboard users must not lose their place.' }] },
            {
              label: 'Options considered',
              statements: [{ evidence: 'proposed', items: ['Set `disabled` while saving.', 'A `loading` prop that keeps focus and ignores activation.', 'Let each product build its own spinner button.'] }],
            },
            {
              label: 'Chosen contract',
              statements: [
                {
                  evidence: 'implemented',
                  text: '`loading` sets `aria-disabled`, ignores clicks, shows a spinner in place of `iconStart`, and keeps the appearance and the accessible name.',
                  example: { label: 'Loading button in the Playground', href: playground.buttonLoading },
                },
              ],
            },
            {
              label: 'Rejected alternative',
              statements: [{ evidence: 'conceptual', text: '`disabled` while saving. The button stops being focusable mid-action, so keyboard focus drops to the page.' }],
            },
            {
              label: 'Consequences',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'The spinner says nothing to a screen reader, so the consumer announces the outcome with a status message, as the Button guidance says.',
                  example: { label: 'Button behavior and accessibility', href: '/components/button#behavior' },
                },
              ],
            },
            {
              label: 'Validation',
              statements: [
                {
                  evidence: 'implemented',
                  text: '`Button.test.tsx` checks that a loading button keeps focus and its accessible name and ignores activation.',
                  example: { label: 'Button props', href: '/components/button#api' },
                },
              ],
            },
          ],
        },
        {
          kind: 'record',
          caption: 'Card: one component, two densities',
          fields: [
            { label: 'Requirement', statements: [{ evidence: 'hypothetical', text: 'Harbor wants flat, compact cards in its record lists; Meadow wants roomy, raised cards for its guided steps.' }] },
            {
              label: 'Options considered',
              statements: [{ evidence: 'proposed', items: ['A `variant` per product.', 'Raw `padding` and `boxShadow` values.', 'Named styling props, each falling back to a component token.'] }],
            },
            {
              label: 'Chosen contract',
              statements: [
                {
                  evidence: 'implemented',
                  text: '`surface`, `padding`, `radius`, `border` and `elevation` take names from the shared vocabularies. Unset, each reads its `card.*` token, which a product retunes once; set, it overrides exactly one decision.',
                  example: { label: 'Flat card in the Playground', href: playground.cardFlat },
                },
              ],
            },
            {
              label: 'Rejected alternative',
              statements: [{ evidence: 'conceptual', text: '`variant="harbor"`. It puts one product’s choices in the shared API, and a third product would need a third variant.' }],
            },
            {
              label: 'Consequences',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'Every combination is valid, including rarely useful ones such as an invisible card on the canvas surface. The documentation says so instead of forbidding it.',
                  example: { label: 'Compact card in the Playground', href: playground.cardCompact },
                },
              ],
            },
            {
              label: 'Validation',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'Documentation tests check that each prop’s token trace names a token Card’s own files read, and the Playground’s Card controls use the exported vocabularies.',
                  example: { label: 'Card tokens', href: '/components/card#tokens' },
                },
              ],
            },
          ],
        },
        {
          kind: 'record',
          caption: 'Dialog: closing without losing work',
          fields: [
            {
              label: 'Requirement',
              statements: [
                {
                  evidence: 'hypothetical',
                  text: 'Meadow’s dialogs hold short forms, where a stray tap outside must not throw away input. Harbor’s keyboard-shortcut list should close with a click outside.',
                },
              ],
            },
            {
              label: 'Options considered',
              statements: [{ evidence: 'proposed', items: ['Always close on a backdrop click.', 'Never close on a backdrop click.', 'Off by default, with a prop to opt in; Escape and the close button always work.'] }],
            },
            {
              label: 'Chosen contract',
              statements: [
                {
                  evidence: 'implemented',
                  text: '`dismissOnBackdrop` defaults to `false`. When on, a click must start and end on the backdrop, so a drag that ends outside does not close. Escape and the close button call `onClose` either way, and `open` stays controlled.',
                  example: { label: 'Backdrop dismissal in the Playground', href: playground.dialogBackdrop },
                },
              ],
            },
            {
              label: 'Rejected alternative',
              statements: [{ evidence: 'conceptual', text: 'Closing on any outside click by default. Losing input becomes the default, and the safe behavior has to be remembered.' }],
            },
            {
              label: 'Consequences',
              statements: [{ evidence: 'proposed', text: 'Harbor’s shortcut list opts in with one prop; dialogs that hold input need nothing. Every consumer still sets `open` to false in `onClose`.' }],
            },
            {
              label: 'Validation',
              statements: [
                {
                  evidence: 'implemented',
                  text: 'A browser test checks that the dialog stays open on a backdrop click by default and closes when `dismissOnBackdrop` is on. Others check Tab wrapping, Escape and focus returning to the opener.',
                  example: { label: 'Dialog behavior and accessibility', href: '/components/dialog#behavior' },
                },
              ],
            },
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The components, vocabularies and tests behind these records, and the examples on this page. Each file opens in place.',
          Visual: ApiEvidence,
        },
      ],
    },
    {
      id: 'composition',
      title: 'Composition before another prop',
      blocks: [
        {
          kind: 'text',
          evidence: 'hypothetical',
          paragraphs: ['Harbor needs a record summary that shows the record’s status next to its title, with Approve and Return actions at the end.'],
        },
        {
          kind: 'code',
          evidence: 'conceptual',
          language: 'tsx',
          caption: 'Rejected: status and actions as Card props. Card would need a tone mapping, an action model and a layout rule that only Harbor uses.',
          code: '<Card status="in-review" statusTone="warning" actions={[{ label: \'Approve\', onClick: approve }]} />',
        },
        {
          kind: 'visual',
          evidence: ['implemented', 'hypothetical'],
          caption: 'Built from Card’s `header` and `footer` regions with Heading, Badge, Inline and Button. Card gains no prop. The record is invented; the components are real. Its source is listed under Worked decisions.',
          Visual: RecordSummary,
        },
        {
          kind: 'text',
          paragraphs: [
            'If Meadow needed the same summary, the composition would become a candidate for a shared pattern, not a set of Card props. Until then it is Harbor’s component. See [what the system lacks](/decisions/operating#ownership).',
          ],
        },
      ],
    },
  ],
  sources: ['apg'],
};
