import { Grid } from '@/design-system/layout';
import { EntryCard, entriesOfKind } from '@/domain/system';
import { paths } from '../paths';
import { DocPage } from './DocPage';

export function FoundationsIndexPage() {
  return (
    <DocPage
      title="Foundations"
      eyebrow="Design system"
      description="The decisions every component is built from: tokens and their tiers, color, typography, spacing, shape, elevation, motion, themes and responsive rules."
    >
      <Grid as="ul" minColumnWidth="medium" gap="medium">
        {entriesOfKind('foundation').map((entry) => (
          <li key={entry.id}>
            <EntryCard entry={entry} href={paths.foundation(entry.id)} headingLevel={2} showClassification={false} />
          </li>
        ))}
      </Grid>
    </DocPage>
  );
}
