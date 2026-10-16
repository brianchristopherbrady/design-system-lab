import { useId, useRef, useState, type FormEvent } from 'react';
import { Field, RadioGroup } from '@/design-system/composites';
import { Grid, Stack, ThemeScope } from '@/design-system/layout';
import { Badge, Button, Checkbox, Heading, Input, Text } from '@/design-system/primitives';
import {
  appointmentRequests,
  appointmentStatusLabels,
  appointmentStatusTones,
  productExamples,
  type AppointmentRequest,
  type AppointmentStatus,
} from '@/domain/scenario';
import styles from './decisions.module.css';

// One rule in both compositions, so the same input gets the same message in either product.
const emailProblem = (value: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Enter an email address, like name@example.com.');

const confirmOptions = [
  { value: 'email', label: 'Email', description: 'A confirmation now and a reminder the day before.' },
  { value: 'text', label: 'Text message', description: 'A short confirmation. The details still go by email.' },
] as const;

type Confirm = (typeof confirmOptions)[number]['value'];

const { patient, provider } = productExamples;
const draft = appointmentRequests.find((request) => request.status === 'requested');

/** The patient app's request step: one question, large targets, one full-width action. */
function PatientRequest() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<Confirm>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = emailProblem(email);
    setError(problem);
    setDone(!problem);
    if (problem) inputRef.current?.focus();
  };

  return (
    <ThemeScope as="section" product={patient.profile} density={patient.density} className={styles.composition} aria-labelledby={`${id}-title`}>
      <Stack gap="medium">
        <Stack gap="extraSmall">
          <Text as="span" variant="caption" tone="muted">
            Demonstration · {patient.name} · Step 2 of 3
          </Text>
          <Heading level={3} size="medium" id={`${id}-title`}>
            How should we confirm your appointment?
          </Heading>
          <Text variant="bodySmall" tone="muted">
            {patient.task}
          </Text>
        </Stack>
        <form noValidate onSubmit={submit}>
          <Stack gap="large">
            {draft && (
              <Text variant="bodySmall">
                Your request: {draft.reason.toLowerCase()}, {draft.preferredTime.toLowerCase()}.
              </Text>
            )}
            <RadioGroup legend="Confirm by" appearance="cards" value={confirm} onChange={setConfirm} options={confirmOptions} />
            <Field label="Email address" description="Used only for this request." error={error}>
              {(control) => <Input {...control} ref={inputRef} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
            </Field>
            <Button type="submit" appearance="primary" fullWidth>
              Continue
            </Button>
          </Stack>
        </form>
        <Text variant="bodySmall" role="status">
          {done ? 'Step complete. In a real flow, step 3 would review the request. Nothing was sent.' : ''}
        </Text>
      </Stack>
    </ThemeScope>
  );
}

const searchText = (request: AppointmentRequest, status: AppointmentStatus) =>
  `${request.id} ${request.patient} ${request.reason} ${appointmentStatusLabels[status]}`;

/** The provider workspace's queue: a live filter, compact rows, selection and an action on the selection. */
function ProviderQueue() {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [statuses, setStatuses] = useState<Readonly<Record<string, AppointmentStatus>>>(() =>
    Object.fromEntries(appointmentRequests.map((request) => [request.id, request.status])),
  );
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const statusOf = (request: AppointmentRequest) => statuses[request.id] ?? request.status;
  const terms = filter.trim().toLowerCase();
  const shown = appointmentRequests.filter((request) => searchText(request, statusOf(request)).toLowerCase().includes(terms));

  const toggle = (requestId: string, checked: boolean) => setSelected((current) => (checked ? [...current, requestId] : current.filter((item) => item !== requestId)));
  const confirmSelected = () => {
    if (selected.length === 0) {
      setMessage('Select at least one request first.');
      return;
    }
    setStatuses((current) => ({ ...current, ...Object.fromEntries(selected.map((requestId) => [requestId, 'confirmed' as const])) }));
    setMessage(`${selected.length} ${selected.length === 1 ? 'request' : 'requests'} confirmed. Nothing was saved.`);
    setSelected([]);
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    const problem = emailProblem(email);
    setError(problem);
    setMessage(problem ? '' : 'Notification email accepted. Nothing was saved.');
    if (problem) emailRef.current?.focus();
  };

  return (
    <ThemeScope as="section" product={provider.profile} density={provider.density} className={styles.composition} aria-labelledby={`${id}-title`}>
      <Stack gap="medium">
        <Stack gap="extraSmall">
          <Text as="span" variant="caption" tone="muted">
            Demonstration · {provider.name} · Request queue
          </Text>
          <Heading level={3} size="medium" id={`${id}-title`}>
            Appointment requests
          </Heading>
          <Text variant="bodySmall" tone="muted">
            {provider.task}
          </Text>
        </Stack>
        <Field label="Filter requests" description="Narrows the list as you type.">
          {(control) => <Input {...control} autoComplete="off" value={filter} onChange={(event) => setFilter(event.target.value)} />}
        </Field>
        <Text variant="bodySmall" tone="muted" role="status">
          Showing {shown.length} of {appointmentRequests.length} requests
        </Text>
        {shown.length > 0 && (
          <ul className={styles.queue} aria-label="Requests">
            {shown.map((request) => {
              const status = statusOf(request);
              return (
                <li key={request.id}>
                  <Checkbox
                    label={`${request.id} · ${request.patient} · ${request.reason}`}
                    checked={selected.includes(request.id)}
                    onChange={(event) => toggle(request.id, event.target.checked)}
                  />
                  <Badge tone={appointmentStatusTones[status]} size="small">
                    {appointmentStatusLabels[status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Button size="small" appearance="primary" onClick={confirmSelected}>
            Confirm selected
          </Button>
        </div>
        <form noValidate onSubmit={save} className={styles.inlineForm}>
          <Field label="Notify by email" description="Who hears when a request changes." error={error}>
            {(control) => <Input {...control} ref={emailRef} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
          </Field>
          <Button type="submit" size="small">
            Save
          </Button>
        </form>
        <Text variant="bodySmall" role="status">
          {message}
        </Text>
      </Stack>
    </ThemeScope>
  );
}

/** The two product examples, built from the same components, each inside its product's scope. */
export function ProductCompositions() {
  return (
    <Grid minColumnWidth="medium" gap="large" align="start">
      <PatientRequest />
      <ProviderQueue />
    </Grid>
  );
}
