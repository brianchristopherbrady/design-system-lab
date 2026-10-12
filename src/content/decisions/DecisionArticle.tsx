import { Disclosure } from '@/design-system/composites';
import { Stack } from '@/design-system/layout';
import { Link, Text } from '@/design-system/primitives';
import { DocSection } from '@/features/docs';
import { BlockView, Sources, StatementView } from './Blocks';
import type { Decision, DecisionRecord } from './types';
import styles from './decisions.module.css';

const recordFields: readonly { key: keyof DecisionRecord; label: string }[] = [
  { key: 'context', label: 'Context' },
  { key: 'choice', label: 'Choice' },
  { key: 'alternatives', label: 'Alternatives considered' },
  { key: 'consequences', label: 'Consequences' },
  { key: 'validation', label: 'Validation' },
  { key: 'reconsider', label: 'Reconsider when' },
];

export const decisionSections = (decision: Decision) => [
  { id: 'record', label: 'Decision record' },
  ...decision.sections.map((section) => ({ id: section.id, label: section.title })),
];

/** The decision in six labelled parts, before the reasoning that supports it. */
function RecordView({ decision }: { decision: Decision }) {
  return (
    <DocSection id="record" title="Decision record">
      <dl className={styles.decisionRecord}>
        {recordFields.map(({ key, label }) => (
          <div key={key}>
            <Text as="dt" variant="caption" tone="muted">
              {label}
            </Text>
            <dd>
              {decision.record[key].map((statement, index) => (
                <StatementView key={index} statement={statement} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <Text variant="bodySmall" tone="muted">
        <Link href="/decisions#labels">What the labels mean</Link>
      </Text>
    </DocSection>
  );
}

export function DecisionArticle({ decision }: { decision: Decision }) {
  return (
    <div className={styles.article}>
      <Stack gap="extraLarge">
        <RecordView decision={decision} />
        {decision.sections.map((section) => (
          <DocSection key={section.id} id={section.id} title={section.title}>
            {section.blocks.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}
          </DocSection>
        ))}
        {decision.sources?.length ? (
          <Disclosure summary="Sources">
            <Sources ids={decision.sources} />
          </Disclosure>
        ) : null}
      </Stack>
    </div>
  );
}

export function decisionContent(decision: Decision) {
  return function DecisionContent() {
    return <DecisionArticle decision={decision} />;
  };
}
