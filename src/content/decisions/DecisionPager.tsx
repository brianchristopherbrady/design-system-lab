import { Icon, Link, Text } from '@/design-system/primitives';
import { findEntry } from '@/domain/system';
import { decisionTopics } from './topics';
import styles from './decisions.module.css';

/** Previous and next decision in reading order, with the overview between them. */
export function DecisionPager({ id }: { id: string }) {
  const index = decisionTopics.findIndex((topic) => topic.id === id);
  const previous = decisionTopics[index - 1];
  const next = decisionTopics[index + 1];
  return (
    <nav aria-label="Previous and next decisions" className={styles.pager}>
      <ul>
        {previous && (
          <li>
            <Link href={`/decisions/${previous.id}`} variant="standalone" className={styles.pagerLink}>
              <Text as="span" variant="caption" tone="muted">
                <Icon name="arrowLeft" /> Previous
              </Text>{' '}
              <span>{findEntry(previous.id)?.name}</span>
            </Link>
          </li>
        )}
        <li className={styles.pagerOverview}>
          <Link href="/decisions" variant="standalone" className={styles.pagerLink}>
            <Text as="span" variant="caption" tone="muted">
              Back to
            </Text>{' '}
            <span>Decisions overview</span>
          </Link>
        </li>
        {next && (
          <li className={styles.pagerNext}>
            <Link href={`/decisions/${next.id}`} variant="standalone" className={styles.pagerLink}>
              <Text as="span" variant="caption" tone="muted">
                Next <Icon name="arrowRight" />
              </Text>{' '}
              <span>{findEntry(next.id)?.name}</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
