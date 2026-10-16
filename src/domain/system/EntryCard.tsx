import { Card } from '@/design-system/composites';
import { Badge, Button, Icon, Link, Text, VisuallyHidden } from '@/design-system/primitives';
import { formatDate } from './activity';
import { classificationOf, type CatalogEntry } from './catalog';
import styles from './EntryCard.module.css';

export interface EntryCardProps {
  entry: CatalogEntry;
  /** Where the title links. The domain does not know the app's routes. */
  href: string;
  /** Show the pin toggle when provided. */
  pinned?: boolean;
  onTogglePin?: () => void;
  headingLevel?: 2 | 3 | 4;
}

/**
 * One catalog entry as a card. Adapts to its own width with a container query:
 * narrow cards stack the pin button under the text, wide cards place it beside.
 */
export function EntryCard({ entry, href, pinned, onTogglePin, headingLevel = 3 }: EntryCardProps) {
  const Title = `h${headingLevel}` as const;
  return (
    <Card as="article" padding="medium" className={styles.card}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div>
            <Badge appearance="outlined" size="small">
              {classificationOf(entry)}
            </Badge>
          </div>
          <Title className={styles.title}>
            <Link href={href} variant="standalone">
              {entry.name}
            </Link>
          </Title>
          <Text variant="bodySmall" tone="muted">
            {entry.summary}
          </Text>
          <Text variant="bodySmall" tone="muted" className={styles.meta}>
            Updated <time dateTime={entry.updatedAt}>{formatDate(entry.updatedAt)}</time>
            {entry.tags.length > 0 && <> · {entry.tags.join(', ')}</>}
          </Text>
        </div>
        {onTogglePin && (
          <div className={styles.actions}>
            <Button
              size="small"
              appearance={pinned ? 'primary' : 'secondary'}
              aria-pressed={pinned}
              iconStart={<Icon name="star" />}
              onClick={onTogglePin}
            >
              Pin<VisuallyHidden> {entry.name}</VisuallyHidden>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
