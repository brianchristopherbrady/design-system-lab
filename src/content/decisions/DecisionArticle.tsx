import { Disclosure } from '@/design-system/composites';
import { Stack } from '@/design-system/layout';
import { Icon, Link, Text } from '@/design-system/primitives';
import { DocSection, Prose } from '@/features/docs';
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

type Part = { kind: 'project'; project: ProjectOpening } | { kind: 'record'; record: DecisionRecord } | { kind: 'section'; section: DecisionSection };

/** Reading order: this repository's choice, then its lead sections; or the scenario's record. Other sections follow. */
function partsOf(decision: Decision): Part[] {
  const section = (item: DecisionSection): Part => ({ kind: 'section', section: item });
  if (!decision.project) return [{ kind: 'record', record: decision.record }, ...decision.sections.map(section)];
  const { project } = decision;
  const lead = project.lead ?? [];
  return [
    { kind: 'project', project },
    ...lead.flatMap((id) => decision.sections.filter((item) => item.id === id)).map(section),
    ...decision.sections.filter((item) => !lead.includes(item.id)).map(section),
  ];
}

export const decisionSections = (decision: Decision) =>
  partsOf(decision).map((part) => {
    if (part.kind === 'project') return { id: 'project', label: 'In this project' };
    if (part.kind === 'record') return { id: 'record', label: 'Decision record' };
    return { id: part.section.id, label: part.section.title };
  });

function RunIn({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <strong>{label}.</strong> <Rich text={text} />
    </p>
  );
}

/** What this repository chose and something to try, then why, before any scenario material. */
function ProjectView({ project }: { project: ProjectOpening }) {
  return (
    <DocSection id="project" title="In this project">
      <div className={styles.opening}>
        <EvidenceBadge evidence="implemented" />
        <Text variant="lead">
          <Rich text={project.choice} />
        </Text>
        <div className={styles.tryIt}>
          <Text>
            <strong>Try it.</strong> <Rich text={project.tryIt.text} />
          </Text>
          <ul className={styles.tryLinks}>
            {project.tryIt.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.exampleLink}>
                  {link.label} <Icon name="arrowRight" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Prose>
          <RunIn label="Constraint" text={project.constraint} />
          <RunIn label="Trade-off" text={project.tradeoff} />
          <RunIn label="Evidence" text={project.evidence} />
        </Prose>
      </div>
    </DocSection>
  );
}

/** The scenario's decision in six labelled parts, before the reasoning that supports it. */
function RecordView({ record }: { record: DecisionRecord }) {
  return (
    <DocSection id="record" title="Decision record">
      <RecordFields fields={recordFields.map(({ key, label }) => ({ label, statements: record[key] }))} />
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
          if (part.kind === 'record') return <RecordView key="record" record={part.record} />;
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
