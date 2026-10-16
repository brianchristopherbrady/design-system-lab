import { useEffect, useId, useRef, useState } from 'react';
import { Card, Field } from '@/design-system/composites';
import { Inline, Stack } from '@/design-system/layout';
import { Badge, Button, Heading, Select, Text, VisuallyHidden } from '@/design-system/primitives';
import { cssVar, spaceScale, spaceTokenPaths, type Space } from '@/design-system/tokens';
import { appointmentRequests, appointmentStatusLabels, appointmentStatusTones, type AppointmentStatus } from '@/domain/scenario';

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

const request = appointmentRequests.find((candidate) => candidate.id === 'R-2045');

/**
 * A provider's request summary composed from Card's header and footer regions. The status badge and
 * the actions are content, so Card needs no status or actions prop.
 */
export function RequestSummary() {
  const [status, setStatus] = useState<AppointmentStatus>(request?.status ?? 'requested');
  const [announcement, setAnnouncement] = useState('');
  const titleId = useId();
  if (!request) return null;
  const change = (next: AppointmentStatus) => {
    setStatus(next);
    setAnnouncement(`Status changed to ${appointmentStatusLabels[next]}.`);
  };

  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      header={
        <Inline gap="small" justify="between">
          <Heading level={3} size="small" id={titleId}>
            {`${request.id} · ${request.patient}`}
          </Heading>
          <Badge tone={appointmentStatusTones[status]}>{appointmentStatusLabels[status]}</Badge>
        </Inline>
      }
      footer={
        <Inline gap="small" justify="end">
          <Button onClick={() => change('needs-details')}>Ask for details</Button>
          <Button appearance="primary" onClick={() => change('confirmed')}>
            Confirm
          </Button>
        </Inline>
      }
    >
      <Text variant="bodySmall">{`${request.reason}. Preferred: ${request.preferredTime}.`}</Text>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Card>
  );
}
