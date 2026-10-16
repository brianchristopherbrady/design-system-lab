import { useParams } from 'react-router';
import { Link, Text } from '@/design-system/primitives';
import { findComponentDoc, findStory } from '@/content/components';
import { findEntry, type CatalogEntry } from '@/domain/system';
import { ComponentReference, componentSections, type ComponentDoc } from '@/features/docs';
import { paths } from '../paths';
import { DocPage } from './DocPage';
import { NotFoundPage } from './NotFoundPage';

function ComponentView({ entry, doc }: { entry: CatalogEntry; doc: ComponentDoc }) {
  const story = findStory(entry.id);
  return (
    <DocPage
      title={entry.name}
      eyebrow={`Components · ${entry.layer}`}
      description={entry.summary}
      sections={componentSections}
      meta={
        <Text as="span" variant="bodySmall" tone="muted">
          <Link href={paths.components}>All components</Link>
        </Text>
      }
    >
      <ComponentReference entry={entry} doc={doc} playgroundHref={story ? paths.playgroundFor(entry.id) : undefined} />
    </DocPage>
  );
}

export function ComponentPage() {
  const { componentId = '' } = useParams();
  const entry = findEntry(componentId);
  const doc = findComponentDoc(componentId);
  return entry?.kind === 'component' && doc ? (
    <ComponentView key={entry.id} entry={entry} doc={doc} />
  ) : (
    <NotFoundPage kind="component" />
  );
}
