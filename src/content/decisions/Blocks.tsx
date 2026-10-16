import { Fragment } from 'react';
import { Disclosure } from '@/design-system/composites';
import { ScrollRegion } from '@/design-system/layout';
import { Badge, Icon, Link, Text } from '@/design-system/primitives';
import { sources, type SourceId } from '@/domain/decisions';
import { Note, Prose } from '@/features/docs';
import type { Block, Evidence, RecordField, Statement } from './types';
import styles from './decisions.module.css';

const inline = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/;

/** Text with `code`, **strong** and Markdown-style links. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(inline).map((part, index) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return <code key={index}>{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**') && part.length > 3) return <strong key={index}>{part.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) return <Link key={index} href={link[2] ?? ''}>{link[1]}</Link>;
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

/** The four labels used throughout Design decisions, with what each one promises. */
export const evidenceLabels: Record<Evidence, { label: string; tone: 'success' | 'warning' | 'info' | 'neutral'; meaning: string }> = {
  implemented: { label: 'Implemented', tone: 'success', meaning: 'Built and checked in this repository. A link leads to the working example.' },
  hypothetical: { label: 'Hypothetical', tone: 'warning', meaning: 'Part of the patient app and provider workspace scenario: invented to illustrate, not findings from real products.' },
  proposed: { label: 'Proposed', tone: 'info', meaning: 'Reasoning, plans or targets I would recommend. Not carried out or measured here.' },
  conceptual: { label: 'Conceptual', tone: 'neutral', meaning: 'A sketch of an approach this repository does not implement.' },
};

export function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  const { label, tone } = evidenceLabels[evidence];
  return (
    <Badge tone={tone} size="small">
      {label}
    </Badge>
  );
}

function EvidenceBadges({ evidence }: { evidence: Evidence | readonly Evidence[] | undefined }) {
  if (!evidence) return null;
  const all: readonly Evidence[] = typeof evidence === 'string' ? [evidence] : evidence;
  return (
    <span className={styles.badges}>
      {all.map((one) => (
        <EvidenceBadge key={one} evidence={one} />
      ))}
    </span>
  );
}

/** One labelled statement, with the working example that supports it beside the claim. */
export function StatementView({ statement, showEvidence = true, showExample = true }: { statement: Statement; showEvidence?: boolean; showExample?: boolean }) {
  return (
    <div className={styles.statement}>
      {(showEvidence || statement.text) && (
        <p>
          {showEvidence && <EvidenceBadge evidence={statement.evidence} />} {statement.text && <Rich text={statement.text} />}
        </p>
      )}
      {statement.items && (
        <ul>
          {statement.items.map((item) => (
            <li key={item}>
              <Rich text={item} />
            </li>
          ))}
        </ul>
      )}
      {showExample && statement.example && (
        <Link href={statement.example.href} className={styles.exampleLink}>
          {statement.example.label} <Icon name="arrowRight" />
        </Link>
      )}
    </div>
  );
}

function mostCommon(all: readonly Evidence[]): Evidence | undefined {
  const counts = new Map<Evidence, number>();
  for (const evidence of all) counts.set(evidence, (counts.get(evidence) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * Labelled fields of a decision record. The record's usual label is stated once; a field or statement
 * carries its own only where it differs, and each working example is linked once.
 */
export function RecordFields({ fields, label }: { fields: readonly RecordField[]; label?: string }) {
  const usual = mostCommon(fields.flatMap((field) => field.statements.map((statement) => statement.evidence)));
  const linked = new Set<string>();
  const rows = fields.map((field) => {
    const kinds = new Set(field.statements.map((statement) => statement.evidence));
    const own = kinds.size === 1 ? field.statements[0]?.evidence : undefined;
    const statements = field.statements.map((statement) => {
      const href = statement.example?.href;
      const showExample = href !== undefined && !linked.has(href);
      if (href) linked.add(href);
      return { statement, showEvidence: own === undefined && statement.evidence !== usual, showExample };
    });
    return { field, badge: own !== undefined && own !== usual ? own : undefined, statements };
  });
  const exceptions = rows.some((row) => row.badge || row.statements.some((item) => item.showEvidence));
  return (
    <div className={styles.recordBody}>
      {usual && (
        <Text variant="bodySmall" tone="muted">
          <EvidenceBadge evidence={usual} />
          {exceptions && ' unless marked otherwise'}
        </Text>
      )}
      <dl className={styles.decisionRecord} aria-label={label}>
        {rows.map(({ field, badge, statements }) => (
          <div key={field.label}>
            <dt>
              {field.label}
              {badge && (
                <>
                  {' '}
                  <EvidenceBadge evidence={badge} />
                </>
              )}
            </dt>
            <dd>
              {statements.map((item, index) => (
                <StatementView key={index} {...item} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Sources({ ids }: { ids: readonly SourceId[] }) {
  return (
    <ul className={styles.sources}>
      {ids.map((id) => {
        const source = sources.find((candidate) => candidate.id === id);
        return source ? (
          <li key={id}>
            {source.author}. <Link href={source.href}>{source.title}</Link>
            {source.year ? `, ${source.year}` : ''}.
          </li>
        ) : null;
      })}
    </ul>
  );
}

export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return (
        <div className={styles.figure}>
          <EvidenceBadges evidence={block.evidence} />
          <Prose>
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
          </Prose>
        </div>
      );
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <Prose>
          <List>
            {block.items.map((item) => (
              <li key={item}>
                <Rich text={item} />
              </li>
            ))}
          </List>
        </Prose>
      );
    }
    case 'steps':
      return (
        <ol className={styles.steps}>
          {block.items.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.stepBody}>
                <Text as="span" variant="label">
                  {step.title}
                </Text>
                <Text as="span" variant="bodySmall">
                  <Rich text={step.text} />
                </Text>
                {step.output && (
                  <Text as="span" variant="bodySmall" tone="muted">
                    Output: {step.output}
                  </Text>
                )}
                {step.note && <StatementView statement={step.note} />}
              </div>
            </li>
          ))}
        </ol>
      );
    case 'table':
      if (block.stacked) {
        const [, ...fields] = block.columns;
        return (
          <figure className={styles.figure}>
            <EvidenceBadges evidence={block.evidence} />
            <figcaption>{block.caption}</figcaption>
            <ul className={styles.records}>
              {block.rows.map(([name = '', ...values]) => (
                <li key={name} className={styles.record}>
                  <Text as="p" variant="body">
                    <strong>
                      <Rich text={name} />
                    </strong>
                  </Text>
                  <dl>
                    {fields.map((field, index) => (
                      <div key={field}>
                        <dt>{field}</dt>
                        <dd>
                          <Rich text={values[index] ?? ''} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </figure>
        );
      }
      return (
        <figure className={styles.figure}>
          <EvidenceBadges evidence={block.evidence} />
          <ScrollRegion axis="inline" aria-label={block.caption}>
            <table className={styles.table} data-wide={block.wide || undefined}>
              <caption>{block.caption}</caption>
              <thead>
                <tr>
                  {block.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={index} scope="row">
                          <Rich text={cell} />
                        </th>
                      ) : (
                        <td key={index}>
                          <Rich text={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </figure>
      );
    case 'note':
      return (
        <Note title={block.title}>
          <p>
            <Rich text={block.text} />
          </p>
        </Note>
      );
    case 'visual':
      return (
        <figure className={styles.figure}>
          <EvidenceBadges evidence={block.evidence} />
          <block.Visual />
          {block.caption && (
            <figcaption>
              <Rich text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case 'code':
      return (
        <figure className={styles.figure}>
          <EvidenceBadge evidence={block.evidence} />
          <ScrollRegion as="pre" axis="inline" className={styles.code} aria-label={block.caption}>
            <code data-language={block.language}>{block.code}</code>
          </ScrollRegion>
          <figcaption>
            <Rich text={block.caption} />
          </figcaption>
        </figure>
      );
    case 'details':
      return (
        <div className={styles.details}>
          {block.items.map((item) => (
            <Disclosure key={item.summary} summary={item.summary}>
              <div className={styles.detailsBody}>
                {item.blocks.map((inner, index) => (
                  <BlockView key={index} block={inner} />
                ))}
              </div>
            </Disclosure>
          ))}
        </div>
      );
    case 'record':
      return (
        <figure className={styles.figure}>
          <figcaption className={styles.recordCaption}>{block.caption}</figcaption>
          <RecordFields fields={block.fields} label={block.caption} />
        </figure>
      );
    case 'evidence':
      return (
        <ul className={styles.evidence} aria-label="Working examples on this site">
          {block.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} variant="standalone" className={styles.evidenceLink}>
                {item.label}
                <Icon name="arrowRight" />
              </Link>
              <Text as="span" variant="bodySmall" tone="muted">
                {item.shows}
              </Text>
            </li>
          ))}
        </ul>
      );
  }
}
