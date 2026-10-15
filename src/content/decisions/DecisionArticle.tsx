import { Disclosure } from '@/design-system/composites';
import { Stack } from '@/design-system/layout';
import { Icon, Link, Text } from '@/design-system/primitives';
import { DocSection } from '@/features/docs';
import { BlockView, EvidenceBadge, RecordFields, Rich, Sources } from './Blocks';
import type { Decision, DecisionRecord, DecisionSection, ProjectOpening } from './types';
import styles from './decisions.module.css';

const recordFields: readonly { key: keyof DecisionRecord; label: string }[] = [
  { key: 'context', label: 'Context' },
  { key: 'choice', label: 'Choice' },
  { key: 'alternatives', label: 'Alternatives considered' },
  { key: 'consequences', label: 'Consequences' },
  { key: 'validation', label: 'Validation' },
  { key: 'reconsider', label: 'Reconsider when' },
];

type Part = { kind: 'project'; project: ProjectOpening } | { kind: 'record' } | { kind: 'section'; section: DecisionSection };

/** Reading order. A page about this repository's own choice opens with them; the scenario's record follows. */
function partsOf(decision: Decision): Part[] {
  const { project } = decision;
  const lead = project?.lead ?? [];
  const section = (item: DecisionSection): Part => ({ kind: 'section', section: item });
  return [
    ...(project ? [{ kind: 'project', project } as const] : []),
    ...lead.flatMap((id) => decision.sections.filter((item) => item.id === id)).map(section),
    { kind: 'record' },
    ...decision.sections.filter((item) => !lead.includes(item.id)).map(section),
  ];
}

export const decisionSections = (decision: Decision) =>
  partsOf(decision).map((part) => {
    if (part.kind === 'project') return { id: 'project', label: 'In this project' };
    if (part.kind === 'record') return { id: 'record', label: 'Decision record' };
    return { id: part.section.id, label: part.section.title };
  });

function OpeningField({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <Text as="dt" variant="caption" tone="muted">
        {label}
      </Text>
      <dd className={styles.statement}>
        <p>
          <Rich text={text} />
        </p>
      </dd>
    </div>
  );
}

/** What this repository chose, why, and something to try, before any scenario material. */
function ProjectView({ project }: { project: ProjectOpening }) {
  return (
    <DocSection id="project" title="In this project">
      <div className={styles.figure}>
        <EvidenceBadge evidence="implemented" />
        <dl className={styles.decisionRecord}>
          <OpeningField label="Chosen here" text={project.choice} />
          <OpeningField label="Constraint" text={project.constraint} />
          <div>
            <Text as="dt" variant="caption" tone="muted">
              Try it
            </Text>
            <dd className={styles.statement}>
              <p>
                <Rich text={project.tryIt.text} />
              </p>
              <ul className={styles.tryLinks}>
                {project.tryIt.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.exampleLink}>
                      {link.label} <Icon name="arrowRight" />
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <OpeningField label="Trade-off" text={project.tradeoff} />
          <OpeningField label="Evidence" text={project.evidence} />
        </dl>
      </div>
    </DocSection>
  );
}

/** The decision in six labelled parts, before the reasoning that supports it. */
function RecordView({ decision }: { decision: Decision }) {
  return (
    <DocSection id="record" title="Decision record">
      {decision.project && (
        <Text variant="bodySmall" tone="muted">
          The same decision for the hypothetical Meadow and Harbor scenario. Statements about this repository are marked
          Implemented.
        </Text>
      )}
      <RecordFields fields={recordFields.map(({ key, label }) => ({ label, statements: decision.record[key] }))} />
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
        {partsOf(decision).map((part) => {
          if (part.kind === 'project') return <ProjectView key="project" project={part.project} />;
          if (part.kind === 'record') return <RecordView key="record" decision={decision} />;
          return (
            <DocSection key={part.section.id} id={part.section.id} title={part.section.title}>
              {part.section.blocks.map((block, index) => (
                <BlockView key={index} block={block} />
              ))}
            </DocSection>
          );
        })}
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
