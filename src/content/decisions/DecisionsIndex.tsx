import type { ReactNode } from 'react';
import { Card } from '@/design-system/composites';
import { Grid, Stack } from '@/design-system/layout';
import { Heading, Icon, Link, Text } from '@/design-system/primitives';
import { findEntry } from '@/domain/system';
import { productExampleIds, productExamples } from '@/domain/scenario';
import { DocSection, Prose } from '@/features/docs';
import { EvidenceBadge, evidenceLabels, Rich } from './Blocks';
import { decisionTopics, type DecisionTopic } from './topics';
import type { Evidence } from './types';
import styles from './decisions.module.css';

export const decisionsIndexSections = [
  { id: 'decisions', label: 'Decisions in this project' },
  { id: 'team', label: 'Applying the approach to a product team' },
  { id: 'labels', label: 'Labels' },
] as const;

const labelOrder: readonly Evidence[] = ['implemented', 'hypothetical', 'proposed', 'conceptual'];

const firstSentence = (text: string) => text.split(/(?<=\.)\s/)[0] ?? text;

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <Text as="dt" variant="caption" tone="muted">
        {term}
      </Text>
      <Text as="dd" variant="bodySmall">
        {children}
      </Text>
    </div>
  );
}

function DecisionCard({ topic }: { topic: DecisionTopic }) {
  const entry = findEntry(topic.id);
  return (
    <Card as="li" padding="medium">
      <Stack gap="small">
        <Text as="span" variant="caption" tone="muted">
          {decisionTopics.indexOf(topic) + 1} · {topic.stage}
        </Text>
        <Heading level={3} size="small">
          <Link href={`/decisions/${topic.id}`} variant="standalone">
            {entry?.name}
          </Link>
        </Heading>
        <dl className={styles.cardFacts}>
          {topic.project ? (
            <>
              <Fact term="Chosen here">
                <strong>
                  <Rich text={firstSentence(topic.project.choice)} />
                </strong>
              </Fact>
              <Fact term="Try it">
                <span className={styles.tryLinks}>
                  {topic.project.tryIt.links.map((link) => (
                    <Link key={link.href} href={link.href} className={styles.exampleLink}>
                      {link.label} <Icon name="arrowRight" />
                    </Link>
                  ))}
                </span>
              </Fact>
            </>
          ) : (
            <>
              <Fact term="Decision">
                <strong>{topic.choice}</strong>
              </Fact>
              <Fact term="Why it matters">{topic.matters}</Fact>
            </>
          )}
          <Fact term="The page shows">{entry?.summary}</Fact>
        </dl>
      </Stack>
    </Card>
  );
}

/** The section's landing page: this project's decisions, the same approach applied to a product team, and the labels. */
export function DecisionsIndex() {
  const own = decisionTopics.filter((topic) => topic.project);
  const team = decisionTopics.filter((topic) => !topic.project);
  return (
    <Stack gap="extraLarge">
      <DocSection id="decisions" title="Decisions in this project">
        <Prose>
          <p>
            Why this site is built the way it is. Each page opens with the choice, something to try and what the evidence
            shows, then follows the reasoning in depth.
          </p>
        </Prose>
        <Grid as="ol" columns={2} minColumnWidth="medium" gap="medium" aria-label="Decisions in this project">
          {own.map((topic) => (
            <DecisionCard key={topic.id} topic={topic} />
          ))}
        </Grid>
      </DocSection>

      <DocSection id="team" title="Applying the approach to a product team">
        <div id="scenario" className={styles.figure}>
          <EvidenceBadge evidence="hypothetical" />
          <Prose>
            <p>
              These examples follow one fictional healthcare company: a patient app for requesting care and a provider
              workspace for reviewing requests. Both use the same foundations and shared web components, while their
              content, layout and workflows reflect different tasks. The examples are implemented here; the company and
              product context are illustrative.
            </p>
          </Prose>
          <ul className={styles.products} aria-label="Products in the scenario">
            {productExampleIds.map((id) => (
              <li key={id}>
                <Text as="span" variant="label">
                  {productExamples[id].name}
                </Text>
                <Text as="span" variant="bodySmall">
                  {productExamples[id].task} {productExamples[id].setting}
                </Text>
              </li>
            ))}
          </ul>
          <Text variant="bodySmall" tone="muted">
            Both are web apps on the same framework with related branding, and each releases on its own schedule.{' '}
            <EvidenceBadge evidence="implemented" /> <Link href="/decisions/sharing#compositions">Try both examples</Link>
          </Text>
        </div>
        <Prose>
          <p>
            Every page works its decision through this scenario. These pages go further: how the company would plan a
            system, migrate onto it and keep it healthy.
          </p>
        </Prose>
        <Grid as="ol" columns={2} minColumnWidth="medium" gap="medium" aria-label="Applying the approach to a product team">
          {team.map((topic) => (
            <DecisionCard key={topic.id} topic={topic} />
          ))}
        </Grid>
      </DocSection>

      <DocSection id="labels" title="Labels">
        <Prose>
          <p>Examples, tables and decision-record statements carry one of four labels.</p>
        </Prose>
        <dl className={styles.legend}>
          {labelOrder.map((evidence) => (
            <div key={evidence}>
              <dt>
                <EvidenceBadge evidence={evidence} />
              </dt>
              <Text as="dd" variant="bodySmall">
                {evidenceLabels[evidence].meaning}
              </Text>
            </div>
          ))}
        </dl>
      </DocSection>
    </Stack>
  );
}
