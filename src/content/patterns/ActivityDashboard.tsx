import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Alert, Card, EmptyState, Field } from '@/design-system/composites';
import { Grid, Inline, Stack } from '@/design-system/layout';
import { Badge, Button, Heading, Icon, Input, Link, Progress, Select, Skeleton, Text } from '@/design-system/primitives';
import {
  activityKindLabels,
  activityKinds,
  ActivityList,
  catalog,
  catalogBreakdown,
  countActivityByKind,
  findEntry,
  summarizeCatalog,
  type ActivityEvent,
  type ActivityKind,
} from '@/domain/system';
import { useRequest, useScenarioStatus, type DemoScenario } from '@/features/scenarios';
import { fetchActivity, noResultsQuery } from './fixtures';

/** Summary metrics and a filterable change feed, all derived from the catalog and changelog. */
export function ActivityDashboard({ scenario }: { scenario: DemoScenario }) {
  const { state, load } = useRequest(fetchActivity);
  const attempt = useRef(0);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    load({ scenario, attempt: 0 });
  }, [load, scenario]);

  useEffect(() => {
    if (state.status === 'success' && attempt.current > 0) headingRef.current?.focus();
  }, [state.status]);

  const retry = () => {
    attempt.current += 1;
    load({ scenario, attempt: attempt.current });
  };

  const pending = state.status === 'idle' || state.status === 'pending';
  useScenarioStatus(pending ? 'Loading activity…' : state.status === 'success' && state.data.length === 0 ? 'No activity yet.' : '');

  return (
    <section aria-labelledby={headingId} aria-busy={pending}>
      <Stack gap="large">
        <Heading level={3} size="medium" id={headingId} ref={headingRef} tabIndex={-1}>
          System activity
        </Heading>
        {pending && (
          <>
            <Text variant="bodySmall" tone="muted">
              Loading activity…
            </Text>
            <Grid minColumnWidth="extraSmall" gap="medium" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <Card key={index} padding="medium">
                  <Skeleton lines={2} />
                </Card>
              ))}
            </Grid>
            <Skeleton lines={4} />
          </>
        )}
        {state.status === 'error' && (
          <Alert
            tone="danger"
            role="alert"
            title="Activity could not be loaded"
            actions={
              <Button size="small" iconStart={<Icon name="refresh" />} onClick={retry}>
                Retry
              </Button>
            }
          >
            {state.message} The metrics need the feed, so neither is shown.
          </Alert>
        )}
        {state.status === 'success' && state.data.length === 0 && (
          <EmptyState
            headingLevel={4}
            title="No activity yet"
            description="Nothing has changed since the catalog was created. Changes appear here when entries are added, changed or documented."
            action={<Link href="/components">Browse components</Link>}
          />
        )}
        {state.status === 'success' && state.data.length > 0 && (
          <Dashboard events={state.data} initialQuery={scenario === 'noResults' ? noResultsQuery : ''} />
        )}
      </Stack>
    </section>
  );
}

function Metric({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <Card padding="medium">
      <Stack gap="extraSmall">
        <Text variant="label" tone="muted">
          {label}
        </Text>
        <Text variant="lead" as="p">
          <strong>{value}</strong>
        </Text>
        {children}
      </Stack>
    </Card>
  );
}

function Dashboard({ events, initialQuery }: { events: readonly ActivityEvent[]; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<ActivityKind | 'all'>('all');
  const summary = summarizeCatalog(catalog);
  const byKind = countActivityByKind(events);
  const terms = query.trim().toLowerCase();
  const visible = events.filter(
    (event) =>
      (kind === 'all' || event.kind === kind) &&
      (terms === '' || `${event.summary} ${findEntry(event.entryId)?.name ?? ''}`.toLowerCase().includes(terms)),
  );

  return (
    <Stack gap="large">
      <Grid minColumnWidth="extraSmall" gap="medium">
        <Metric label="Catalog entries" value={String(summary.total)}>
          <Text variant="bodySmall" tone="muted">
            {catalogBreakdown(summary)
              .map((part) => part.text)
              .join(' · ')}
          </Text>
        </Metric>
        <Metric label="Stable" value={`${summary.byMaturity.stable} of ${summary.total}`}>
          <Progress label="Share of entries that are stable" value={summary.byMaturity.stable} max={summary.total} />
        </Metric>
        <Metric label="Recorded changes" value={String(events.length)}>
          <Inline gap="extraSmall">
            {activityKinds.map((activityKind) => (
              <Badge key={activityKind} size="small">
                {activityKindLabels[activityKind]} {byKind[activityKind]}
              </Badge>
            ))}
          </Inline>
        </Metric>
      </Grid>

      <Stack gap="medium">
        <Heading level={4} size="small">
          Recent changes
        </Heading>
        <Grid minColumnWidth="small" gap="medium" align="end">
          <Field label="Search changes">
            {(control) => <Input {...control} type="search" value={query} onChange={(event) => setQuery(event.target.value)} />}
          </Field>
          <Field label="Kind of change">
            {(control) => (
              <Select {...control} value={kind} onChange={(event) => setKind(event.target.value as ActivityKind | 'all')}>
                <option value="all">All kinds</option>
                {activityKinds.map((activityKind) => (
                  <option key={activityKind} value={activityKind}>
                    {activityKindLabels[activityKind]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </Grid>
        <Text role="status" variant="bodySmall" tone="muted">
          Showing {visible.length} of {events.length} changes
        </Text>
        {visible.length === 0 ? (
          <EmptyState
            headingLevel={4}
            title={terms ? `No changes match “${query.trim()}”` : 'No changes of this kind'}
            description="The feed has changes, but none fit the current search. Try another term or clear the search."
            action={
              <Button
                onClick={() => {
                  setQuery('');
                  setKind('all');
                }}
              >
                Clear search
              </Button>
            }
          />
        ) : (
          <ActivityList events={visible} entryFor={findEntry} />
        )}
      </Stack>
    </Stack>
  );
}
