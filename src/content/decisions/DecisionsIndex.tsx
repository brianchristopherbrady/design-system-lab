import { Card } from '@/design-system/composites';
import { Grid, Stack } from '@/design-system/layout';
import { Heading, Link, Text } from '@/design-system/primitives';
import { findEntry, productProfiles } from '@/domain/system';
import { DocSection, Note, Prose } from '@/features/docs';
import { EvidenceBadge, evidenceLabels } from './Blocks';
import { decisionTopics } from './topics';
import type { Evidence } from './types';
import styles from './decisions.module.css';

export const decisionsIndexSections = [
  { id: 'scenario', label: 'The scenario' },
  { id: 'decisions', label: 'Four decisions' },
  { id: 'labels', label: 'Labels' },
] as const;

const labelOrder: readonly Evidence[] = ['implemented', 'hypothetical', 'proposed', 'conceptual'];

/** The section's landing page: the scenario, one card per decision, and what the labels mean. */
export function DecisionsIndex() {
  const { harbor, meadow } = productProfiles;
  return (
    <Stack gap="extraLarge">
      <DocSection id="scenario" title="The scenario">
        <div className={styles.figure}>
          <EvidenceBadge evidence="hypothetical" />
          <Prose>
            <p>One organization runs two products and wants one design system to serve both. Each decision follows them through one stage.</p>
          </Prose>
          <ul className={styles.products} aria-label="Products in the scenario">
            <li>
              <Text as="span" variant="label">
                Meadow
              </Text>
              <Text as="span" variant="bodySmall">
                Occasional consumers completing guided tasks: a few visits a year, mostly on phones, touch first, one step at a
                time.
              </Text>
            </li>
            <li>
              <Text as="span" variant="label">
                Harbor
              </Text>
              <Text as="span" variant="bodySmall">
                Professionals scanning and acting on dense information: all day at a desk, keyboard first, with tables and bulk
                actions.
              </Text>
            </li>
          </ul>
          <Text variant="bodySmall" tone="muted">
            Both are web apps on the same framework with related brands, and each releases on its own schedule.
          </Text>
        </div>
        <Note title="Not the same as this site’s product modes">
          <p>
            <EvidenceBadge evidence="implemented" /> In this repository, Harbor and Meadow are product modes, not products. The
            Product control in the header switches this same site between them, and each changes only presentation:
          </p>
          <ul>
            <li>
              <strong>Harbor mode:</strong> {harbor.overrides}
            </li>
            <li>
              <strong>Meadow mode:</strong> {meadow.overrides}
            </li>
          </ul>
          <p>
            The modes have no users, workflows or code of their own. They show that presentation can vary without forking
            components; the scenario borrows their names to ask what two real products with these audiences should share.{' '}
            <Link href="/foundations/products">Products and modes</Link>
          </p>
        </Note>
      </DocSection>

      <DocSection id="decisions" title="Four decisions">
        <Grid as="ol" columns={2} minColumnWidth="medium" gap="medium" aria-label="Design decisions">
          {decisionTopics.map((topic, index) => {
            const entry = findEntry(topic.id);
            return (
              <Card as="li" key={topic.id} padding="medium">
                <Stack gap="small">
                  <Text as="span" variant="caption" tone="muted">
                    {index + 1} · {topic.stage}
                  </Text>
                  <Heading level={3} size="small">
                    <Link href={`/decisions/${topic.id}`} variant="standalone">
                      {entry?.name}
                    </Link>
                  </Heading>
                  <dl className={styles.cardFacts}>
                    <div>
                      <Text as="dt" variant="caption" tone="muted">
                        Decision
                      </Text>
                      <Text as="dd" variant="bodySmall">
                        <strong>{topic.choice}</strong>
                      </Text>
                    </div>
                    <div>
                      <Text as="dt" variant="caption" tone="muted">
                        Why it matters
                      </Text>
                      <Text as="dd" variant="bodySmall">
                        {topic.matters}
                      </Text>
                    </div>
                    <div>
                      <Text as="dt" variant="caption" tone="muted">
                        The page shows
                      </Text>
                      <Text as="dd" variant="bodySmall">
                        {entry?.summary}
                      </Text>
                    </div>
                  </dl>
                </Stack>
              </Card>
            );
          })}
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
