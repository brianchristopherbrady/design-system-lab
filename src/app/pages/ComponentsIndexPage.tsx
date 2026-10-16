import { EmptyState } from '@/design-system/composites';
import { Grid, Stack } from '@/design-system/layout';
import { Button, Heading, Link, Text } from '@/design-system/primitives';
import { componentLayers, EntryCard, entriesOfKind, type ComponentLayer } from '@/domain/system';
import { DirectoryFilters, filterEntries, useClearDirectoryFilters, useUrlDirectoryFilters } from '@/features/directory';
import { paths } from '../paths';
import { DocPage } from './DocPage';

const components = entriesOfKind('component');
const layerDescriptions: Record<ComponentLayer, string> = {
  Layout: 'Space and structure. They read spacing and size tokens and never draw content.',
  Primitive: 'Single-purpose elements built on native HTML.',
  Composite: 'Compositions of primitives with structure and behavior of their own.',
};

export function ComponentsIndexPage() {
  const [urlFilters, setFilters] = useUrlDirectoryFilters();
  // Every entry here is a component, so a resource type from the URL has no control and must not hide results.
  const filters = { ...urlFilters, type: 'all' as const };
  const results = filterEntries(components, filters);
  const { searchRef, clear } = useClearDirectoryFilters(setFilters);

  return (
    <DocPage
      title="Components"
      eyebrow="Design system"
      description="Every component with its props, defaults, token traces, live examples, accessibility notes and source. Filters are stored in the URL so a filtered view can be shared."
    >
      <Stack gap="extraLarge">
        <Text variant="bodySmall" tone="muted">
          Every component here is used by this site and covered by unit tests, browser tests in Chromium and automated
          accessibility scans. Screen-reader evaluation has not been performed. A component page lists any known gaps, and{' '}
          <Link href="/decisions/operating#checked">What this project checks</Link> lists every check.
        </Text>
        <DirectoryFilters
          filters={filters}
          onChange={setFilters}
          layers={componentLayers}
          resultCount={results.length}
          totalCount={components.length}
          label="Filter components"
          searchRef={searchRef}
        />
        {results.length === 0 ? (
          <EmptyState
            title="No components match these filters"
            description="Try a broader search term, or clear the filters to see all components."
            action={<Button onClick={clear}>Clear filters</Button>}
          />
        ) : (
          componentLayers.map((layer) => {
            const group = results.filter((entry) => entry.layer === layer);
            if (group.length === 0) return null;
            return (
              <section key={layer} aria-labelledby={`layer-${layer}`}>
                <Stack gap="medium">
                  <Stack gap="extraSmall">
                    <Heading level={2} size="medium" id={`layer-${layer}`}>
                      {layer} ({group.length})
                    </Heading>
                    <Text tone="muted">{layerDescriptions[layer]}</Text>
                  </Stack>
                  <Grid as="ul" minColumnWidth="medium" gap="medium">
                    {group.map((entry) => (
                      <li key={entry.id}>
                        <EntryCard entry={entry} href={paths.component(entry.id)} headingLevel={3} showClassification={false} />
                      </li>
                    ))}
                  </Grid>
                </Stack>
              </section>
            );
          })
        )}
      </Stack>
    </DocPage>
  );
}
