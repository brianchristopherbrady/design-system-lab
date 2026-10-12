import { useId, useRef, useState, type FormEvent } from 'react';
import { Field, RadioGroup } from '@/design-system/composites';
import { Grid, Stack, ThemeScope } from '@/design-system/layout';
import { Badge, Button, Checkbox, Heading, Input, Text } from '@/design-system/primitives';
import styles from './decisions.module.css';

// One rule in both compositions, so the same input gets the same message in either product.
const emailProblem = (value: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Enter an email address, like name@example.com.');

const contactOptions = [
  { value: 'email', label: 'Email', description: 'Every update, with a copy of your answers.' },
  { value: 'text', label: 'Text message', description: 'Short updates only. The copy still goes by email.' },
] as const;

type Contact = (typeof contactOptions)[number]['value'];

/** A guided consumer step: one question, large targets, one full-width action. */
function MeadowStep() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [contact, setContact] = useState<Contact>('email');
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
    <ThemeScope as="section" product="meadow" density="comfortable" className={styles.composition} aria-labelledby={`${id}-title`}>
      <Stack gap="medium">
        <Stack gap="extraSmall">
          <Text as="span" variant="caption" tone="muted">
            Demonstration · Meadow · Step 2 of 3
          </Text>
          <Heading level={3} size="medium" id={`${id}-title`}>
            How should we keep you updated?
          </Heading>
        </Stack>
        <form noValidate onSubmit={submit}>
          <Stack gap="large">
            <RadioGroup legend="Send updates by" appearance="cards" value={contact} onChange={setContact} options={contactOptions} />
            <Field label="Email address" description="Used only for this request." error={error}>
              {(control) => <Input {...control} ref={inputRef} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
            </Field>
            <Button type="submit" appearance="primary" fullWidth>
              Continue
            </Button>
          </Stack>
        </form>
        <Text variant="bodySmall" role="status">
          {done ? 'Step complete. In a real flow, step 3 would open. Nothing was sent.' : ''}
        </Text>
      </Stack>
    </ThemeScope>
  );
}

const records = [
  { id: 'A-1042', title: 'Address change', status: 'Waiting', tone: 'warning' },
  { id: 'A-1043', title: 'Access request', status: 'In review', tone: 'info' },
  { id: 'A-1047', title: 'Name correction', status: 'Waiting', tone: 'warning' },
  { id: 'A-1050', title: 'Document check', status: 'Approved', tone: 'success' },
  { id: 'A-1051', title: 'Access request', status: 'Returned', tone: 'danger' },
] as const;

/** A dense professional panel: a live filter, compact rows, selection and a bulk action. */
function HarborQueue() {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const terms = filter.trim().toLowerCase();
  const shown = records.filter((record) => `${record.id} ${record.title} ${record.status}`.toLowerCase().includes(terms));

  const toggle = (recordId: string, checked: boolean) => setSelected((current) => (checked ? [...current, recordId] : current.filter((item) => item !== recordId)));
  const markReviewed = () =>
    setMessage(selected.length ? `${selected.length} ${selected.length === 1 ? 'record' : 'records'} marked reviewed. Nothing was saved.` : 'Select at least one record first.');
  const save = (event: FormEvent) => {
    event.preventDefault();
    const problem = emailProblem(email);
    setError(problem);
    setMessage(problem ? '' : 'Notification email accepted. Nothing was saved.');
    if (problem) emailRef.current?.focus();
  };

  return (
    <ThemeScope as="section" product="harbor" density="compact" className={styles.composition} aria-labelledby={`${id}-title`}>
      <Stack gap="medium">
        <Stack gap="extraSmall">
          <Text as="span" variant="caption" tone="muted">
            Demonstration · Harbor · Review queue
          </Text>
          <Heading level={3} size="medium" id={`${id}-title`}>
            Records to review
          </Heading>
        </Stack>
        <Field label="Filter records" description="Narrows the list as you type.">
          {(control) => <Input {...control} autoComplete="off" value={filter} onChange={(event) => setFilter(event.target.value)} />}
        </Field>
        <Text variant="bodySmall" tone="muted" role="status">
          Showing {shown.length} of {records.length} records
        </Text>
        {shown.length > 0 && (
          <ul className={styles.queue} aria-label="Records">
            {shown.map((record) => (
              <li key={record.id}>
                <Checkbox
                  label={`${record.id} · ${record.title}`}
                  checked={selected.includes(record.id)}
                  onChange={(event) => toggle(record.id, event.target.checked)}
                />
                <Badge tone={record.tone} size="small">
                  {record.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button size="small" appearance="primary" onClick={markReviewed}>
            Mark reviewed
          </Button>
        </div>
        <form noValidate onSubmit={save} className={styles.inlineForm}>
          <Field label="Notify by email" description="Who hears when a record changes." error={error}>
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

/** Two demonstrations built from the same components, each inside its product's scope. */
export function ProductCompositions() {
  return (
    <Grid minColumnWidth="medium" gap="large" align="start">
      <MeadowStep />
      <HarborQueue />
    </Grid>
  );
}
