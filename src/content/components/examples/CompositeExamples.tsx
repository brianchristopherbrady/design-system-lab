import { useEffect, useRef, useState } from 'react';
import { Alert, alertTones, Card, Dialog, Disclosure, EmptyState, Field, RadioGroup, Tabs } from '@/design-system/composites';
import { Grid, Inline, Stack, useThemeScope } from '@/design-system/layout';
import { Badge, Button, Heading, Icon, Input, Link, Text, type TextOwnProps } from '@/design-system/primitives';
import { elevationScale, tokenValueIn } from '@/design-system/tokens';
import { tokenManifest } from '@/design-system/tokens/manifest';
import { contextLabel, LiveExample } from '@/features/docs';
import { outcomeFor, simulateRequest } from '@/features/scenarios';
import { NarrowAndWide } from './frames';
import styles from './examples.module.css';

const source = 'src/content/components/examples/CompositeExamples.tsx';

function MediaArt() {
  return (
    <div className={styles.media}>
      <svg className={styles.mediaArt} viewBox="0 0 64 64" role="img" aria-label="Stacked layers illustration">
        <path d="M32 8 58 22 32 36 6 22z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M6 32l26 14 26-14M6 42l26 14 26-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function CardExample() {
  const [pinned, setPinned] = useState(false);
  return (
    <>
      <LiveExample
        title="Header, body and footer with real actions"
        kind="recommended"
        sourcePath={source}
        description="The card itself is not clickable. The title is a link and the footer holds a Pin toggle button, so each target has one clear purpose and keyboard users reach each one."
      >
        <NarrowAndWide>
          <Card
            as="article"
            header={
              <Stack gap="extraSmall">
                <div>
                  <Badge tone="info" size="small" appearance="outlined">
                    Foundation
                  </Badge>
                </div>
                <Heading level={3} size="small">
                  <Link href="/foundations/tokens" variant="standalone">
                    Token architecture
                  </Link>
                </Heading>
              </Stack>
            }
            footer={
              <Inline gap="small" justify="between">
                <Text variant="bodySmall" tone="muted">
                  Updated 5 Oct 2026
                </Text>
                <Button size="small" aria-pressed={pinned} iconStart={<Icon name="star" />} onClick={() => setPinned(!pinned)}>
                  Pin
                </Button>
              </Inline>
            }
          >
            <Stack gap="small">
              <MediaArt />
              <Text variant="bodySmall">Reference, semantic and component tiers, and how a value travels from source to CSS.</Text>
            </Stack>
          </Card>
        </NarrowAndWide>
      </LiveExample>
      <LiveExample
        title="Elevation, surface and padding"
        kind="recommended"
        sourcePath={source}
        description="Unset props use the card tokens. The first card sets nothing; the others override one decision each."
      >
        <Grid minColumnWidth="extraSmall" gap="large">
          <Card>
            <Text variant="bodySmall">All defaults (card.* tokens)</Text>
          </Card>
          {elevationScale.map((elevation) => (
            <Card key={elevation} elevation={elevation}>
              <Text variant="bodySmall">elevation="{elevation}"</Text>
            </Card>
          ))}
          <Card surface="sunken" elevation="none" border="none">
            <Text variant="bodySmall">surface="sunken", no border or shadow</Text>
          </Card>
          <Card padding="small" radius="small" border="strong">
            <Text variant="bodySmall">padding="small", radius="small", border="strong"</Text>
          </Card>
        </Grid>
      </LiveExample>
    </>
  );
}

export function DialogExample() {
  return (
    <>
      <OpenCloseDialog />
      <ConfirmDialog />
      <FailingDialog />
    </>
  );
}

function OpenCloseDialog() {
  const [open, setOpen] = useState(false);
  return (
    <LiveExample
      title="Open and close"
      kind="recommended"
      sourcePath={source}
      description="Opening moves focus into the dialog; Escape, the close button or Done close it and return focus to the button that opened it."
    >
      <Button onClick={() => setOpen(true)}>Show keyboard shortcuts</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Keyboard shortcuts"
        size="small"
        footer={
          <Button appearance="primary" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <Stack as="ul" gap="extraSmall">
          <li>
            <kbd>Tab</kbd> moves to the next control
          </li>
          <li>
            <kbd>Escape</kbd> closes this dialog
          </li>
          <li>
            <kbd>Arrow keys</kbd> move between tabs
          </li>
        </Stack>
      </Dialog>
    </LiveExample>
  );
}

function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <LiveExample
      title="Confirm an action"
      kind="recommended"
      sourcePath={source}
      description="Initial focus goes to Cancel, the least destructive choice. The result is announced in a status message after the dialog closes."
    >
      <Stack gap="small" align="start">
        <Button
          iconStart={<Icon name={archived ? 'refresh' : 'archive'} />}
          onClick={() => (archived ? setArchived(false) : setOpen(true))}
        >
          {archived ? 'Restore Button entry' : 'Archive Button entry'}
        </Button>
        <Text role="status" variant="bodySmall" tone="muted">
          {archived ? 'Button entry archived.' : ''}
        </Text>
      </Stack>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Archive the Button entry?"
        description="It disappears from the directory until it is restored."
        size="small"
        initialFocus={cancelRef}
        footer={
          <>
            <Button ref={cancelRef} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={() => {
                setArchived(true);
                setOpen(false);
              }}
            >
              Archive
            </Button>
          </>
        }
      />
    </LiveExample>
  );
}

function FailingDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const attempt = useRef(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const close = () => {
    controller.current?.abort();
    setPending(false);
    setError(null);
    setOpen(false);
  };

  const confirm = () => {
    const abort = new AbortController();
    controller.current = abort;
    setPending(true);
    setError(null);
    simulateRequest(() => true, { outcome: outcomeFor('error', attempt.current++), signal: abort.signal }).then(
      () => {
        setPending(false);
        setDone(true);
        setOpen(false);
      },
      (reason: unknown) => {
        if (abort.signal.aborted) return;
        setPending(false);
        setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
  };

  return (
    <LiveExample
      title="Operation error and recovery"
      kind="recommended"
      sourcePath={source}
      description="The first attempt always fails and the second succeeds, so the error path can be tested every time. The error is announced inside the dialog and the action becomes Try again."
    >
      <Stack gap="small" align="start">
        <Button
          appearance={done ? 'secondary' : 'danger'}
          iconStart={<Icon name={done ? 'refresh' : 'trash'} />}
          onClick={() => {
            if (done) {
              setDone(false);
              return;
            }
            attempt.current = 0;
            setOpen(true);
          }}
        >
          {done ? 'Reset example' : 'Delete the legacy token set'}
        </Button>
        <Text role="status" variant="bodySmall" tone="muted">
          {done ? 'Legacy token set deleted.' : ''}
        </Text>
      </Stack>
      <Dialog
        open={open}
        onClose={close}
        title="Delete the legacy token set?"
        description="Components that still read these tokens will fall back to their defaults."
        size="medium"
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button appearance="danger" loading={pending} onClick={confirm}>
              {error ? 'Try again' : 'Delete'}
            </Button>
          </>
        }
      >
        {error && (
          <Alert tone="danger" title="The token set was not deleted" role="alert">
            {error} Nothing was changed. Try again.
          </Alert>
        )}
      </Dialog>
    </LiveExample>
  );
}

export function AlertExample() {
  return (
    <>
      <LiveExample
        title="Tones with titles that state the meaning"
        kind="recommended"
        sourcePath={source}
        description="These alerts are static, so they have no live role. Add role=&quot;alert&quot; or role=&quot;status&quot; only for messages that appear in response to an action."
      >
        <Stack gap="small">
          {alertTones.map((tone) => (
            <Alert key={tone} tone={tone} title={`${tone[0]?.toUpperCase()}${tone.slice(1)}: tone="${tone}"`}>
              Surface, border, icon and title color all come from the {tone} tone tokens.
            </Alert>
          ))}
        </Stack>
      </LiveExample>
      <RecoveringAlert />
    </>
  );
}

function RecoveringAlert() {
  const [recovered, setRecovered] = useState(false);
  return (
    <LiveExample
      title="An error with a way to recover"
      kind="recommended"
      sourcePath={source}
      description="Retry always succeeds here, so recovery can be tried every time. The action stays the same button, so focus stays on it while the alert changes tone, and a status message reports the result."
    >
      <Stack gap="small">
        <Alert
          tone={recovered ? 'success' : 'danger'}
          title={recovered ? 'Changes loaded' : 'Changes could not be loaded'}
          actions={
            <Button size="small" iconStart={<Icon name="refresh" />} onClick={() => setRecovered(!recovered)}>
              {recovered ? 'Reset example' : 'Retry'}
            </Button>
          }
        >
          {recovered ? 'The second attempt succeeded.' : 'The request failed and nothing was changed. Try again.'}
        </Alert>
        <Text role="status" variant="bodySmall" tone="muted">
          {recovered ? 'Changes loaded on the second attempt.' : ''}
        </Text>
      </Stack>
    </LiveExample>
  );
}

/** button.primary.background's alias chain for the product and theme in effect where it renders. */
function PrimaryBackgroundChain({ variant }: { variant?: TextOwnProps['variant'] }) {
  const scope = useThemeScope();
  const record = tokenManifest.find((candidate) => candidate.path === 'button.primary.background');
  if (!record) return null;
  return (
    <Text variant={variant}>
      {tokenValueIn(record, scope).chain.join(' → ')} ({contextLabel(scope)})
    </Text>
  );
}

export function TabsExample() {
  return (
    <LiveExample
      title="Related views of one entry"
      kind="recommended"
      sourcePath={source}
      description="Tab once to reach the tab list, use the arrow keys (or Home and End) to switch, and Tab again to reach the panel."
    >
      <Tabs
        label="Button details"
        items={[
          { id: 'usage', label: 'Usage', content: <Text>Use one primary button per view region.</Text> },
          { id: 'tokens', label: 'Tokens', content: <PrimaryBackgroundChain /> },
          { id: 'changes', label: 'Changes', content: <Text>Renamed variant to appearance on 7 Oct 2026.</Text> },
        ]}
      />
    </LiveExample>
  );
}

export function DisclosureExample() {
  return (
    <LiveExample
      title="Secondary detail, on request"
      kind="recommended"
      sourcePath={source}
      description="Each row is a native summary: Tab to it, then Enter or Space toggles it. lazy renders the content only while it is open."
    >
      <Stack gap="extraSmall">
        <Disclosure summary="Why is the primary button solid?">
          <Text variant="bodySmall">The monolith: one solid action per region, so the next step is never ambiguous.</Text>
        </Disclosure>
        <Disclosure summary="Which tokens does it read?" lazy>
          <PrimaryBackgroundChain variant="bodySmall" />
        </Disclosure>
        <Disclosure summary="A summary with a much longer label that wraps onto a second line in narrow containers" defaultOpen>
          <Text variant="bodySmall">Open on first render with defaultOpen; the marker turns to show the state.</Text>
        </Disclosure>
      </Stack>
    </LiveExample>
  );
}

export function FieldExample() {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && value.trim() === '' ? 'Enter a name for the token.' : undefined;
  return (
    <LiveExample
      title="Label, description and error"
      kind="recommended"
      sourcePath={source}
      description="Submit while empty to see the error. The description and error are both announced with the input."
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <Stack gap="small" align="start">
          <Field label="Token name" description="Lowercase, dot-separated, like action.primary.background." error={error} required>
            {(control) => <Input {...control} value={value} onChange={(event) => setValue(event.target.value)} />}
          </Field>
          <Button type="submit" appearance="primary">
            Add token
          </Button>
        </Stack>
      </form>
    </LiveExample>
  );
}

export function PageHeaderExample() {
  return (
    <LiveExample
      title="This page's own header"
      kind="illustrative"
      sourcePath="src/app/pages/ComponentPage.tsx"
      showHtml={false}
      description="PageHeader renders the page's only h1, so it is not repeated here. The header at the top of this page is a PageHeader: eyebrow, title, description and a metadata row."
    >
      <Text>
        Scroll to the top of this page to inspect it, or open the source below to see the props the component page passes.
      </Text>
    </LiveExample>
  );
}

export function EmptyStateExample() {
  return (
    <LiveExample title="Explain and offer a next step" kind="recommended" sourcePath={source}>
      <EmptyState
        headingLevel={3}
        title="No pinned entries yet"
        description="Pin the components you use most and they will appear here."
        action={<Link href="/components">Browse components</Link>}
      />
    </LiveExample>
  );
}

const contactMethods = [
  { value: 'email', label: 'Email', description: 'Updates and receipts in your inbox.' },
  { value: 'text', label: 'Text message', description: 'Short alerts on your phone.' },
  { value: 'call', label: 'Phone call', description: 'Only when something needs your answer today.' },
] as const;

export function RadioGroupExample() {
  const [method, setMethod] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  return (
    <Stack gap="large">
      <LiveExample
        title="Cards for options that need explaining"
        kind="recommended"
        sourcePath={source}
        description="Required, controlled, with an error after an empty submit. Tab into the group, then use the arrow keys."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <Stack gap="medium">
            <RadioGroup
              legend="How should we contact you?"
              appearance="cards"
              required
              options={contactMethods}
              value={method}
              onChange={setMethod}
              error={submitted && !method ? 'Choose how we should contact you.' : undefined}
            />
            <Inline gap="small">
              <Button type="submit" appearance="primary">
                Continue
              </Button>
              {submitted && method && (
                <Text role="status" tone="success">
                  We will contact you by {contactMethods.find((option) => option.value === method)?.label.toLowerCase()}.
                </Text>
              )}
            </Inline>
          </Stack>
        </form>
      </LiveExample>
      <LiveExample title="A plain list for short labels" kind="recommended" sourcePath={source}>
        <RadioGroup
          legend="Delivery window"
          description="Times are in your local time zone."
          defaultValue="morning"
          options={[
            { value: 'morning', label: '8:00 to 12:00' },
            { value: 'afternoon', label: '12:00 to 17:00' },
            { value: 'evening', label: '17:00 to 20:00', disabled: true, description: 'Fully booked this week.' },
          ]}
        />
      </LiveExample>
    </Stack>
  );
}
