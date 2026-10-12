import { Grid } from '@/design-system/layout';
import { EntryCard, entriesOfKind } from '@/domain/system';
import { paths } from '../paths';
import { DocPage } from './DocPage';

export function PatternsIndexPage() {
  return (
    <DocPage
      title="Patterns"
      eyebrow="Design system"
      description="Complete interfaces composed from the components, with every state they can be in. Each request-driven demo has a Demo scenario selector listing the loading, empty, success, error and no-results states that apply to it."
    >
      <Grid as="ul" minColumnWidth="medium" gap="medium">
        {entriesOfKind('pattern').map((entry) => (
          <li key={entry.id}>
            <EntryCard entry={entry} href={paths.pattern(entry.id)} headingLevel={2} />
          </li>
        ))}
      </Grid>
    </DocPage>
  );
}
