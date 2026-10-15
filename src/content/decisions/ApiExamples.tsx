import { useEffect, useId, useRef, useState } from 'react';
import { Card, Field } from '@/design-system/composites';
import { Inline, Stack } from '@/design-system/layout';
import { Badge, Button, Heading, Select, Text, VisuallyHidden } from '@/design-system/primitives';
import { cssVar, spaceScale, spaceTokenPaths, type Space, type Tone } from '@/design-system/tokens';

/** One named Card padding value, traced to its token, its custom property and the value the browser computes. */
export function PaddingTrace() {
  const [padding, setPadding] = useState<Space>('large');
  const [computed, setComputed] = useState('');
  const card = useRef<HTMLElement>(null);
  const path = spaceTokenPaths[padding];

  useEffect(() => {
    setComputed(card.current ? getComputedStyle(card.current).paddingTop : '');
  }, [padding]);

  return (
    <Stack gap="medium">
      <Field label="Card padding" description="Every value is a name from the shared spacing vocabulary.">
        {(control) => (
          <Select {...control} value={padding} onChange={(event) => setPadding(event.target.value as Space)}>
            {spaceScale.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Text variant="bodySmall" aria-live="polite">
        <code>padding="{padding}"</code> → {path ? <code>{path}</code> : 'no token'} → <code>{path ? cssVar(path) : '0'}</code>
        {computed && <> → {computed} in your browser</>}
      </Text>
      <Card ref={card} padding={padding}>
        <Text variant="bodySmall">A Card with padding="{padding}".</Text>
      </Card>
    </Stack>
  );
}

const statuses = {
  review: { label: 'In review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  returned: { label: 'Returned', tone: 'info' },
} as const satisfies Record<string, { label: string; tone: Tone }>;

type Status = keyof typeof statuses;

/**
 * A record summary composed from Card's header and footer regions. The status badge and the actions
 * are content, so Card needs no status or actions prop.
 */
export function RecordSummary() {
  const [status, setStatus] = useState<Status>('review');
  const [announcement, setAnnouncement] = useState('');
  const titleId = useId();
  const change = (next: Status) => {
    setStatus(next);
    setAnnouncement(`Status changed to ${statuses[next].label}.`);
  };
  const { label, tone } = statuses[status];

  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      header={
        <Inline gap="small" justify="between">
          <Heading level={3} size="small" id={titleId}>
            Access request R-1042
          </Heading>
          <Badge tone={tone}>{label}</Badge>
        </Inline>
      }
      footer={
        <Inline gap="small" justify="end">
          <Button onClick={() => change('returned')}>Return for changes</Button>
          <Button appearance="primary" onClick={() => change('approved')}>
            Approve
          </Button>
        </Inline>
      }
    >
      <Text variant="bodySmall">Read access to the finance records folder, requested for a quarterly audit.</Text>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Card>
  );
}
