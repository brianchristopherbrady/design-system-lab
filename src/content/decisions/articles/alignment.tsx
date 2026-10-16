import { SourceList } from '@/features/docs';
import { BadgeMapping } from '../AlignmentExamples';
import type { Decision } from '../types';

function AlignmentEvidence() {
  return (
    <SourceList
      sources={[
        { path: 'docs/decisions/0004-docs-from-source.md', note: 'Why documentation reads the code, and what the compiler still cannot check' },
        { path: 'src/design-system/primitives/Badge/Badge.tsx', note: 'The props, option arrays and defaults the mapping uses' },
        { path: 'src/test/playground.test.tsx', note: 'Playground controls must use the exported option arrays' },
        { path: 'src/test/documentation.test.ts', note: 'Prop-to-token traces, source paths, links and anchors' },
        { path: 'src/design-system/tokens/policy.ts', note: 'The modifier-lanes rule the sample change runs into' },
        { path: 'src/content/decisions/AlignmentExamples.tsx', note: 'The mapping table on this page' },
      ]}
    />
  );
}

const tokens = { label: 'Token pipeline', href: '/foundations/tokens#pipeline' };

export const alignment: Decision = {
  id: 'alignment',
  stage: 'Design and code alignment',
  question: 'How do design assets, tokens, component APIs and documentation stay in step as the shared core changes?',
  matters: 'When the design file, the code and the documentation disagree, each team builds from a different answer and every review starts by finding out which one is right.',
  project: {
    choice:
      'The code owns each component’s contract and the token files own every value; the documentation reads both instead of restating them. There is no design-tool library here.',
    constraint:
      'A reviewer has to be able to trust that a props table, a Playground control and a token trace describe the component as built, without anyone remembering to update them.',
    tryIt: {
      text: 'Change Badge’s tone in the Playground: the controls offer exactly the values the component exports. Then open its props table, which the compiler checks against the component’s props.',
      links: [
        { label: 'Badge in the Playground', href: '/playground?component=badge' },
        { label: 'Badge props', href: '/components/badge#api' },
      ],
    },
    tradeoff:
      'The compiler checks names and types, not meaning. Descriptions and displayed type strings are prose that still need review, and nothing here checks a design file.',
    evidence:
      'Props tables are typed against each component (ADR 0004), Playground controls must use the exported option arrays, each prop-to-token trace must name a token the component’s files read, and lint fails if generated token output is stale. The design-tool practices later on this page are proposed.',
    lead: ['today'],
  },
  record: {
    context: [
      {
        evidence: 'hypothetical',
        text: 'The patient app’s and the provider workspace’s designers work from a design-tool library of the shared components, engineers work from the code, and both read the documentation site. Until now, whoever changed one of them last decided what it said.',
      },
    ],
    choice: [
      {
        evidence: 'proposed',
        text: 'Give each kind of information one owning artifact, name design-tool properties and values exactly as the props in code, and review a change to any of them together before it ships.',
      },
      {
        evidence: 'implemented',
        text: 'This repository has no design-tool library and no synchronization. What it automates runs between token files, component code and this documentation.',
        example: tokens,
      },
    ],
    alternatives: [
      {
        evidence: 'proposed',
        items: [
          '**The design file as the source of truth.** Designers change things directly, but behavior, types and accessibility cannot live in a drawing.',
          '**Code as the only truth.** No drift by definition, but designers redraw from screenshots and lose their own library.',
          '**Two-way synchronization tooling.** Appealing, but it copies mismatched names as faithfully as matching ones, and still needs someone to decide which side is right.',
        ],
      },
    ],
    consequences: [
      {
        evidence: 'proposed',
        text: 'Renaming design-tool properties to match code is one-off work for designers, and every component change needs a short joint review. Afterwards, a prop name in a design hand-off can be pasted into code unchanged.',
      },
    ],
    validation: [
      {
        evidence: 'implemented',
        text: 'Playground controls, props tables and prop-to-token traces fail tests when they drift from the component code, so the code-to-documentation side is checked on every run.',
        example: { label: 'Badge in the Playground', href: '/playground?component=badge' },
      },
    ],
    reconsider: [
      {
        evidence: 'proposed',
        text: 'The design tool can export its component properties in a form a test can read, or mismatches keep reaching products despite the review.',
      },
    ],
  },
  sections: [
    {
      id: 'today',
      title: 'What exists in this repository',
      blocks: [
        {
          kind: 'table',
          caption: 'Links between artifacts, and whether anything checks them',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Link', 'In this repository', 'How'],
          rows: [
            ['Token files to CSS and TypeScript', 'Automated', 'The generator writes both from the DTCG files, and lint fails if the committed output is stale.'],
            ['Component types to props tables', 'Checked by the compiler', 'Each props table is typed against the component’s own props, so a new or renamed prop is a type error (ADR 0004). Descriptions are prose.'],
            ['Option arrays to Playground controls', 'Tested', 'Controls must use the arrays the component exports, so a new value appears in the Playground automatically.'],
            ['Props to tokens', 'Tested', 'Each documented prop-to-token trace must name a token the component’s own files read.'],
            ['Code to source views', 'Automated', 'Documentation pages show the real files, read at build time.'],
            ['Design-tool library to anything', 'Does not exist', 'There is no design-tool library, plugin, export or synchronization here. Everything about one on this page is proposed.'],
          ],
        },
      ],
    },
    {
      id: 'ownership',
      title: 'Which artifact owns what',
      blocks: [
        {
          kind: 'text',
          paragraphs: ['Each kind of information has one owner. Other artifacts show it, but a change starts in the owner.'],
        },
        {
          kind: 'table',
          caption: 'Owners of each kind of information',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Information', 'Owned by', 'Shown in', 'Never'],
          rows: [
            ['Token values', 'The DTCG token files', 'Generated CSS, the token explorer, and design-tool styles imported from the build output.', 'Retyped by hand in the design tool or in a stylesheet.'],
            ['Component contract: props, values, defaults, behavior', 'The component’s code and types', 'Props tables, the Playground, and design-tool properties named to match.', 'Decided in the design tool first and discovered by engineers later.'],
            ['How shipped components look', 'Live examples rendered from the code', 'Component pages and the Playground.', 'Screenshots that outlive the code they show.'],
            ['Proposed and unbuilt designs', 'The design-tool library, on a page marked as proposed', 'Review discussions and contribution requests.', 'Mixed with shipped components, where a proposal looks finished.'],
            ['Usage guidance: when to use, mistakes, accessibility notes', 'The documentation site', 'Linked from the design-tool component description.', 'Written twice, once in each tool.'],
          ],
        },
      ],
    },
    {
      id: 'mapping',
      title: 'Mapping design properties to props',
      blocks: [
        {
          kind: 'list',
          items: [
            'A design-tool property has the same name as the prop, and its values are the code values, exactly.',
            'The default variant in the design tool is the default in code.',
            'Values that a token sets, such as a product’s corner radius, are not variants: the design tool reads them from the token styles.',
            'Slots in code, such as an icon or the label, are slots or text in the design tool, not booleans that hide layers.',
            'Anything the design tool shows that code does not support is marked proposed, or removed.',
          ],
        },
        {
          kind: 'visual',
          evidence: ['hypothetical', 'implemented'],
          caption: 'The design-tool column is invented. The props, values and defaults are read from Badge’s exported option arrays, so this table changes when the component does.',
          Visual: BadgeMapping,
        },
        {
          kind: 'text',
          evidence: 'implemented',
          paragraphs: [
            'After alignment, a hand-off that says tone danger, appearance outlined, size small is already the code: [that badge in the Playground](/playground?component=badge&v=1&p.tone=danger&p.appearance=outlined&p.size=small). Badge’s reference page shows [every tone and appearance](/components/badge#examples) rendered from the component.',
          ],
        },
      ],
    },
    {
      id: 'review',
      title: 'Reviewing a change together',
      blocks: [
        {
          kind: 'table',
          caption: 'A joint review of one component change',
          evidence: 'proposed',
          stacked: true,
          columns: ['Who', 'Brings', 'Checks'],
          rows: [
            ['Designer', 'The proposed design-tool change, on a page marked proposed.', 'The intent: what problem it solves, in which product.'],
            ['Engineer', 'The prop and token changes, as a short list.', 'Names and values match the design-tool properties exactly; defaults match; nothing needs a raw value.'],
            ['Accessibility reviewer', 'The contract rows the change touches.', 'States, contrast and keyboard behavior are covered for every new value.'],
            ['Documentation owner', 'The guidance that changes.', 'Usage notes, examples and the release note say the same thing.'],
            ['Product representatives', 'Screens that use the component.', 'The change works in each product, or the difference is recorded.'],
          ],
        },
      ],
    },
    {
      id: 'mismatches',
      title: 'Finding and resolving mismatches',
      blocks: [
        {
          kind: 'table',
          caption: 'How a mismatch is found, recorded and settled',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Stage', 'Practice'],
          rows: [
            ['Found', 'Between code and documentation, by the tests on every run. Between the design tool and code, by the review above and by comparing property lists each release, by hand until the design tool can export them.'],
            ['Recorded', 'One entry per mismatch: component, property, what each side says, who found it, and the owner from the table above.'],
            ['Settled', 'The owning artifact wins. If the owner is the one that is wrong, the fix goes through the contribution path like any other change.'],
            ['Closed', 'When every artifact shows the owner’s answer and the entry links the change that fixed it.'],
          ],
        },
      ],
    },
    {
      id: 'change',
      title: 'A change from proposal to consumers',
      blocks: [
        {
          kind: 'text',
          evidence: 'hypothetical',
          paragraphs: ['The patient app’s designer finds small badges hard to read on phones. The steps are invented; the files, token names and policy they run into are real.'],
        },
        {
          kind: 'steps',
          items: [
            {
              title: 'Proposal',
              text: 'The patient app proposes larger text for `size="small"` badges in the patient app only, with screenshots and the design-tool variant change.',
              output: 'a proposal naming the token it would change: `badge.font-size.small`',
            },
            {
              title: 'Review',
              text: 'The engineer points out that products may only change brand roles, typefaces and shape, so a patient-app-only size breaks the token policy. The group weighs three options: raise it for every product, have the patient app use `size="medium"`, or widen the policy. The provider workspace checks its densest table with larger small badges, and it still fits.',
              output: 'a decision: raise `badge.font-size.small` for every product',
              note: {
                evidence: 'implemented',
                text: 'The `modifier-lanes` policy is real and tested: `badge.font-size.small` is outside the product lane, so a product file that overrides it fails the policy tests.',
                example: { label: 'Dependency policy', href: '/foundations/tokens#policy' },
              },
            },
            {
              title: 'Implementation',
              text: 'One line in `component.tokens.json`: `badge.font-size.small` points to `font.size.sm` instead of `font.size.xs`. The generator rewrites the CSS and types; no prop changes.',
              output: 'a token change, and no API change',
            },
            {
              title: 'Documentation',
              text: 'Badge’s page and the token explorer read the new chain from the code. The release note says this is a visual change. The design-tool library imports the new value from the build output.',
              output: 'docs, release note and design-tool styles that agree',
            },
            {
              title: 'Verification',
              text: 'Tests confirm the policy, contrast and prop-to-token traces still pass. Designers compare the design-tool variant with the rendered example; both products review screenshots in each theme.',
              output: 'a closed review, with the mismatch log unchanged',
            },
            {
              title: 'Consumers',
              text: 'A minor release. Products see larger small badges when they upgrade, with no code change, as the [API change rules](/decisions/component-apis#evolving) describe for token values.',
            },
          ],
        },
      ],
    },
    {
      id: 'automation',
      title: 'What to automate, and what needs judgment',
      blocks: [
        {
          kind: 'table',
          caption: 'Automation and judgment',
          evidence: ['implemented', 'proposed'],
          stacked: true,
          columns: ['Task', 'Automate?', 'Why'],
          rows: [
            ['Token values reaching CSS, types and documentation', 'Yes, done here', 'Mechanical, and one source keeps them identical.'],
            ['Props tables, Playground controls and token traces matching the code', 'Yes, done here', 'The code is the owner, so drift can be detected without judgment.'],
            ['Design-tool styles matching token values', 'Yes, proposed', 'Importing values from the build output removes retyping.'],
            ['Design-tool property names and values matching props', 'Detect, not fix', 'A test can list differences; deciding which side is right needs the owner.'],
            ['Whether a new prop or value should exist', 'No', 'A design decision, made in review.'],
            ['Whether usage guidance is right', 'No', 'Depends on products and people, not on code.'],
            ['Whether a visual change is acceptable in each product', 'Partly', 'Screenshots can show the difference; people decide if it is intended.'],
          ],
        },
        {
          kind: 'visual',
          evidence: 'implemented',
          caption: 'The checks and files behind this page. Each file opens in place.',
          Visual: AlignmentEvidence,
        },
      ],
    },
  ],
  sources: ['dtcg', 'tokens'],
};
