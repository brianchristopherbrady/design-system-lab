import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Alert, Card, EmptyState } from '@/design-system/composites';
import { Grid, Inline, Stack } from '@/design-system/layout';
import { Button, Heading, Icon, Link, Skeleton, Text } from '@/design-system/primitives';
import { componentLayers, EntryCard, type CatalogEntry, type EntryKind } from '@/domain/system';
import { defaultFilters, DirectoryFilters, filterEntries, useClearDirectoryFilters, type DirectoryFilterValues } from '@/features/directory';
import { useRequest, useScenarioStatus, type DemoScenario } from '@/features/scenarios';
import { fetchEntries, noResultsQuery } from './fixtures';
import { entryHref } from './hrefs';

const resourceTypes: readonly EntryKind[] = ['component', 'foundation', 'pattern', 'decision'];

/** Entries listed before Show more, so the demo stays short enough to read beside its documentation. */
export const directoryPageSize = 12;

/**
 * A searchable directory of the system's own catalog. The scenario only changes what the
 * simulated request returns (and the initial search for No results); everything else is
 * the same code path.
 */
export function ResourceDirectory({ scenario }: { scenario: DemoScenario }) {
  const { state, load } = useRequest(fetchEntries);
  const attempt = useRef(0);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [filters, setFilters] = useState<DirectoryFilterValues>(() =>
    scenario === 'noResults' ? { ...defaultFilters, query: noResultsQuery } : defaultFilters,
  );
  const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    load({ scenario, attempt: 0 });
  }, [load, scenario]);

  // After a successful retry the Retry button is gone; move focus to the heading so it is not lost.
  useEffect(() => {
    if (state.status === 'success' && attempt.current > 0) headingRef.current?.focus();
  }, [state.status]);

  const retry = () => {
    // The Retry button disappears while loading; keep focus inside the demo.
    headingRef.current?.focus();
    attempt.current += 1;
    load({ scenario, attempt: attempt.current });
  };

  const togglePin = (id: string) =>
    setPinned((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const pending = state.status === 'idle' || state.status === 'pending';
  useScenarioStatus(pending ? 'Loading entries…' : state.status === 'success' && state.data.length === 0 ? 'No entries yet.' : '');
  const entries = useMemo(
    () => (state.status === 'success' ? [...state.data].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [state],
  );

  return (
    <section aria-labelledby={headingId} aria-busy={pending}>
      <Stack gap="medium">
        <Inline justify="between" gap="small">
          <Heading level={3} size="medium" id={headingId} ref={headingRef} tabIndex={-1}>
            System directory
          </Heading>
          {state.status === 'success' && state.data.length > 0 && (
            <Text variant="bodySmall" tone="muted">
              {pinned.size} pinned
            </Text>
          )}
        </Inline>

        {pending && <LoadingEntries />}

        {state.status === 'error' && (
          <Alert
            tone="danger"
            role="alert"
            title="Entries could not be loaded"
            actions={
              <Button size="small" iconStart={<Icon name="refresh" />} onClick={retry}>
                Retry
              </Button>
            }
          >
            {state.message} Retrying is safe: nothing was changed.
          </Alert>
        )}

        {state.status === 'success' && state.data.length === 0 && (
          <EmptyState
            headingLevel={4}
            title="No entries yet"
            description="The catalog has nothing published yet. Entries appear here as soon as a component, foundation, pattern or design decision is added to the catalog."
            action={<Link href="/#contributing">Read how entries are added</Link>}
          />
        )}

        {state.status === 'success' && state.data.length > 0 && (
          <Results entries={entries} filters={filters} onFiltersChange={setFilters} pinned={pinned} onTogglePin={togglePin} />
        )}
      </Stack>
    </section>
  );
}

function LoadingEntries() {
  return (
    <>
      <Text variant="bodySmall" tone="muted">
        Loading entries…
      </Text>
      <Grid minColumnWidth="medium" gap="medium" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <Card key={index} padding="medium">
            <Stack gap="small">
              <Skeleton lines={1} />
              <Skeleton lines={2} />
            </Stack>
          </Card>
        ))}
      </Grid>
    </>
  );
}

function Results({
  entries,
  filters,
  onFiltersChange,
  pinned,
  onTogglePin,
}: {
  entries: readonly CatalogEntry[];
  filters: DirectoryFilterValues;
  onFiltersChange: (filters: DirectoryFilterValues) => void;
  pinned: ReadonlySet<string>;
  onTogglePin: (id: string) => void;
}) {
  const results = filterEntries(entries, filters);
  const [shown, setShown] = useState(directoryPageSize);
  const [revealFrom, setRevealFrom] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const visible = results.slice(0, shown);
  const remaining = results.length - visible.length;

  // Show more moves focus to the first entry it revealed, so keyboard users continue from there.
  useEffect(() => {
    if (revealFrom !== null) listRef.current?.children[revealFrom]?.querySelector('a')?.focus();
  }, [revealFrom]);

  // New search or filters start again from the first page.
  const changeFilters = (next: DirectoryFilterValues) => {
    setShown(directoryPageSize);
    setRevealFrom(null);
    onFiltersChange(next);
  };
  const { searchRef, clear } = useClearDirectoryFilters(changeFilters);

  return (
    <Stack gap="medium">
      <DirectoryFilters
        filters={filters}
        onChange={changeFilters}
        types={resourceTypes}
        layers={componentLayers}
        resultCount={results.length}
        shownCount={visible.length}
        totalCount={entries.length}
        label="Filter the directory"
        searchRef={searchRef}
      />
      {results.length === 0 ? (
        <EmptyState
          headingLevel={4}
          title={filters.query ? `No entries match “${filters.query}”` : 'No entries match these filters'}
          description="The directory has entries, but none fit the current search and filters. Check the spelling, try a broader term, or clear the filters."
          action={<Button onClick={clear}>Clear filters</Button>}
        />
      ) : (
        <>
          <Grid as="ul" ref={listRef} minColumnWidth="medium" gap="medium">
            {visible.map((entry) => (
              <li key={entry.id}>
                <EntryCard
                  entry={entry}
                  href={entryHref(entry)}
                  headingLevel={4}
                  pinned={pinned.has(entry.id)}
                  onTogglePin={() => onTogglePin(entry.id)}
                />
              </li>
            ))}
          </Grid>
          {remaining > 0 && (
            <div>
              <Button
                onClick={() => {
                  setRevealFrom(shown);
                  setShown(shown + directoryPageSize);
                }}
              >
                Show {Math.min(directoryPageSize, remaining)} more
              </Button>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
