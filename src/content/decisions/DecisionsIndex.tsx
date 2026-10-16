import { Grid, Stack } from '@/design-system/layout';
import { Link, Text } from '@/design-system/primitives';
import { EntryCard, findEntry } from '@/domain/system';
import { productExampleIds, productExamples } from '@/domain/scenario';
import { DocSection, Prose } from '@/features/docs';
import { EvidenceBadge, evidenceLabels } from './Blocks';
import { decisionTopics, type DecisionTopic } from './topics';
import type { Evidence } from './types';
import styles from './decisions.module.css';

export const decisionsIndexSections = [
  { id: 'decisions', label: 'Decisions in this project' },
  { id: 'team', label: 'Applying the approach to a product team' },
  { id: 'labels', label: 'Labels' },
] as const;

const labelOrder: readonly Evidence[] = ['implemented', 'hypothetical', 'proposed', 'conceptual'];

/** The decisions in reading order, as the same cards the other section landing pages use. */
function DecisionList({ topics, label }: { topics: readonly DecisionTopic[]; label: string }) {
  return (
    <Grid as="ol" minColumnWidth="medium" gap="medium" aria-label={label}>
      {topics.map((topic) => {
        const entry = findEntry(topic.id);
        return entry ? (
          <li key={topic.id}>
            <EntryCard entry={entry} href={`/decisions/${topic.id}`} headingLevel={3} showClassification={false} />
          </li>
        ) : null;
      })}
    </Grid>
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
        <DecisionList topics={own} label="Decisions in this project" />
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
        <DecisionList topics={team} label="Applying the approach to a product team" />
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
