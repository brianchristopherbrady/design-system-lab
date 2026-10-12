import { useEffect, useId, useRef, useState } from 'react';
import { Alert, Card, Dialog, EmptyState, Tabs } from '@/design-system/composites';
import { Grid, Inline, Stack } from '@/design-system/layout';
import { Badge, Button, Heading, Icon, Link, Skeleton, Text } from '@/design-system/primitives';
import { ActivityList, classificationOf, findEntry, formatDate, MaturityBadge } from '@/domain/system';
import { useRequest, useScenarioStatus, type DemoScenario } from '@/features/scenarios';
import { archiveEntry, fetchEntryDetail, type ScenarioRequest } from './fixtures';

const entryId = 'button';
const requestDetail = (args: ScenarioRequest, signal: AbortSignal) => fetchEntryDetail(entryId, args, signal);

export type DetailTab = 'overview' | 'history' | 'docs';

/**
 * A detail view for one catalog entry: metadata, tabs and a confirmed destructive action.
 * Archiving fails on the first attempt so the in-dialog error and retry can always be tested.
 */
export function ResourceDetail({ scenario, initialTab = 'overview' }: { scenario: DemoScenario; initialTab?: DetailTab }) {
  const { state, load } = useRequest(requestDetail);
  const attempt = useRef(0);
  const headingId = useId();
  const pendingHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    load({ scenario, attempt: 0 });
  }, [load, scenario]);

  // The Retry button disappears while loading; keep focus inside the demo.
  useEffect(() => {
    if (state.status === 'pending' && attempt.current > 0) pendingHeadingRef.current?.focus();
  }, [state.status]);

  const retry = () => {
    attempt.current += 1;
    load({ scenario, attempt: attempt.current });
  };

  const pending = state.status === 'idle' || state.status === 'pending';
  useScenarioStatus(
    pending
      ? 'Loading the Button entry…'
      : state.status === 'success'
        ? `${state.data.entry.name} entry loaded.${state.data.history.length === 0 ? ' No recorded changes.' : ''}`
        : '',
  );

  return (
    <section aria-labelledby={headingId} aria-busy={pending}>
      <Stack gap="medium">
        <Text variant="bodySmall" tone="muted">
          <Link href="/patterns/resource-directory">Directory</Link> / {findEntry(entryId)?.name}
        </Text>
        {pending && (
          <>
            <Heading level={3} size="medium" id={headingId} ref={pendingHeadingRef} tabIndex={-1}>
              Loading entry
            </Heading>
            <Text variant="bodySmall" tone="muted">
              Loading the Button entry…
            </Text>
            <Skeleton lines={2} />
            <Skeleton shape="block" size="medium" />
          </>
        )}
        {state.status === 'error' && (
          <>
            <Heading level={3} size="medium" id={headingId}>
              Entry unavailable
            </Heading>
            <Alert
              tone="danger"
              role="alert"
              title="The entry could not be loaded"
              actions={
                <Button size="small" iconStart={<Icon name="refresh" />} onClick={retry}>
                  Retry
                </Button>
              }
            >
              {state.message}
            </Alert>
          </>
        )}
        {state.status === 'success' && (
          <Detail headingId={headingId} detail={state.data} focusOnMount={attempt.current > 0} initialTab={initialTab} />
        )}
      </Stack>
    </section>
  );
}

function Detail({
  headingId,
  detail: { entry, history },
  focusOnMount,
  initialTab,
}: {
  headingId: string;
  detail: Awaited<ReturnType<typeof requestDetail>>;
  focusOnMount: boolean;
  initialTab: DetailTab;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const archiveAttempt = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);
  useEffect(() => () => controller.current?.abort(), []);

  const closeDialog = () => {
    controller.current?.abort();
    setArchiving(false);
    setArchiveError(null);
    setDialogOpen(false);
  };

  const confirmArchive = () => {
    const abort = new AbortController();
    controller.current = abort;
    setArchiving(true);
    setArchiveError(null);
    archiveEntry(archiveAttempt.current++, abort.signal).then(
      () => {
        setArchiving(false);
        setDialogOpen(false);
        setArchived(true);
      },
      (error: unknown) => {
        if (abort.signal.aborted) return;
        setArchiving(false);
        setArchiveError(error instanceof Error ? error.message : String(error));
      },
    );
  };

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Inline justify="between" gap="small" align="start">
          <Heading level={3} size="large" id={headingId} ref={headingRef} tabIndex={-1}>
            {entry.name}
          </Heading>
          <Inline gap="small">
            <Button size="small" aria-pressed={pinned} iconStart={<Icon name="star" />} onClick={() => setPinned(!pinned)}>
              Pin
            </Button>
            <Button
              size="small"
              appearance={archived ? 'secondary' : 'danger'}
              iconStart={<Icon name={archived ? 'refresh' : 'archive'} />}
              onClick={() => (archived ? setArchived(false) : setDialogOpen(true))}
            >
              {archived ? 'Restore' : 'Archive'}
            </Button>
          </Inline>
        </Inline>
        <Inline gap="extraSmall">
          <Badge appearance="outlined">{classificationOf(entry)}</Badge>
          <MaturityBadge maturity={entry.maturity} />
          {archived && (
            <Badge tone="neutral" appearance="filled" icon={<Icon name="archive" />}>
              Archived
            </Badge>
          )}
        </Inline>
        <Text>{entry.summary}</Text>
        <Text role="status" variant="bodySmall" tone="muted">
          {archived ? `${entry.name} was archived. Use Restore to undo.` : ''}
        </Text>
      </Stack>

      <Tabs
        label={`${entry.name} details`}
        defaultSelectedId={initialTab}
        items={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <Grid minColumnWidth="small" gap="medium">
                <Card padding="medium" header={<Heading level={4} size="small">Updated</Heading>}>
                  <Text>
                    <time dateTime={entry.updatedAt}>{formatDate(entry.updatedAt)}</time>
                  </Text>
                </Card>
                <Card padding="medium" header={<Heading level={4} size="small">Tags</Heading>}>
                  <Inline gap="extraSmall">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} size="small">
                        {tag}
                      </Badge>
                    ))}
                  </Inline>
                </Card>
                <Card padding="medium" header={<Heading level={4} size="small">Source</Heading>}>
                  <Text variant="bodySmall">
                    <code>{entry.sourcePath}</code>
                  </Text>
                </Card>
              </Grid>
            ),
          },
          {
            id: 'history',
            label: `History (${history.length})`,
            content:
              history.length === 0 ? (
                <EmptyState
                  headingLevel={4}
                  title="No recorded changes"
                  description="This entry has no changelog events yet. Changes appear here when a release note references the entry."
                  action={<Link href="/patterns/activity-dashboard">See all recent activity</Link>}
                />
              ) : (
                <ActivityList events={history} entryFor={findEntry} showEntry={false} />
              ),
          },
          {
            id: 'docs',
            label: 'Documentation',
            content: (
              <Text>
                Read the full <Link href={`/components/${entry.id}`}>{entry.name} reference</Link> or try it in the{' '}
                <Link href={`/playground?component=${entry.id}`}>playground</Link>.
              </Text>
            ),
          },
        ]}
      />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={`Archive ${entry.name}?`}
        description="Archived entries are hidden from the directory. You can restore them later."
        size="small"
        initialFocus={cancelRef}
        footer={
          <>
            <Button ref={cancelRef} onClick={closeDialog}>
              Cancel
            </Button>
            <Button appearance="danger" loading={archiving} onClick={confirmArchive}>
              {archiveError ? 'Try again' : 'Archive'}
            </Button>
          </>
        }
      >
        {archiveError && (
          <Alert tone="danger" role="alert" title={`${entry.name} was not archived`}>
            {archiveError} Nothing was changed.
          </Alert>
        )}
      </Dialog>
    </Stack>
  );
}
