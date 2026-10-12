import { useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Field } from '@/design-system/composites';
import { Grid, Stack } from '@/design-system/layout';
import { Button, Checkbox, Input, Select, Text } from '@/design-system/primitives';
import { catalog, componentLayers, type ComponentLayer } from '@/domain/system';

export interface Proposal {
  name: string;
  layer: string;
  summary: string;
  email: string;
  searched: boolean;
}

type Errors = Partial<Record<keyof Proposal, string>>;

const empty: Proposal = { name: '', layer: '', summary: '', email: '', searched: false };
const labels: Record<keyof Proposal, string> = {
  name: 'Component name',
  layer: 'Component layer',
  summary: 'Summary',
  email: 'Contact email',
  searched: 'Existing components',
};

const isComponentLayer = (value: string): value is ComponentLayer => componentLayers.includes(value as ComponentLayer);
const layerList = `${componentLayers.slice(0, -1).join(', ')} or ${componentLayers.at(-1)}`;

/** Pure validation, so the rules are testable without rendering. */
export function validateProposal(values: Proposal): Errors {
  const errors: Errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Enter a component name.';
  else if (!/^[A-Z][A-Za-z]+$/.test(name)) errors.name = 'Use PascalCase letters only, like DatePicker.';
  else if (catalog.some((entry) => entry.kind === 'component' && entry.name.toLowerCase() === name.toLowerCase()))
    errors.name = `${name} already exists. Propose a change to it instead.`;
  if (!values.layer) errors.layer = 'Choose a component layer.';
  else if (!isComponentLayer(values.layer)) errors.layer = `Choose a component layer: ${layerList}.`;
  if (values.summary.trim().length < 20) errors.summary = 'Describe the component in at least 20 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter an email address, like team@example.com.';
  if (!values.searched) errors.searched = 'Confirm that you searched the directory first.';
  return errors;
}

/**
 * Submit-time validation: errors appear only after submitting, an error summary receives
 * focus and links to each field, and fields are re-validated as they change after that.
 * A demonstration: a valid submission only resets the form. Nothing is sent or stored.
 */
export function FormValidation() {
  const [values, setValues] = useState<Proposal>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const ids = { name: useId(), layer: useId(), summary: useId(), email: useId(), searched: useId() };
  const errors = submitted ? validateProposal(values) : {};
  const errorKeys = Object.keys(errors) as (keyof Proposal)[];

  const set = <K extends keyof Proposal>(key: K, value: Proposal[K]) => setValues((current) => ({ ...current, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateProposal(values);
    setSubmitted(true);
    if (Object.keys(found).length > 0) {
      setComplete(false);
      // Wait for the summary to render, then move focus to it.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setComplete(true);
    setValues(empty);
    setSubmitted(false);
  };

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Propose a component (demonstration)">
      <Stack gap="large">
        <Alert tone="info" title="Demonstration form">
          Submissions are simulated. Submitting checks the fields and resets the form; nothing is sent or stored.
        </Alert>
        {errorKeys.length > 0 && (
          <div ref={summaryRef} tabIndex={-1}>
            <Alert tone="danger" title={`Fix ${errorKeys.length} ${errorKeys.length === 1 ? 'problem' : 'problems'} to continue`}>
              <ul>
                {errorKeys.map((key) => (
                  <li key={key}>
                    <a
                      href={`#${ids[key]}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(ids[key])?.focus();
                      }}
                    >
                      {labels[key]}: {errors[key]}
                    </a>
                  </li>
                ))}
              </ul>
            </Alert>
          </div>
        )}
        <Text role="status">{complete ? 'Demo submission complete. Nothing was sent.' : ''}</Text>
        <Grid minColumnWidth="medium" gap="large" align="start">
          <Field id={ids.name} label={labels.name} description="PascalCase, as it would be imported." error={errors.name} required>
            {(control) => <Input {...control} value={values.name} autoComplete="off" onChange={(event) => set('name', event.target.value)} />}
          </Field>
          <Field id={ids.layer} label={labels.layer} error={errors.layer} required>
            {(control) => (
              <Select {...control} value={values.layer} onChange={(event) => set('layer', event.target.value)}>
                <option value="">Choose a component layer</option>
                {componentLayers.map((layer) => (
                  <option key={layer} value={layer}>
                    {layer}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </Grid>
        <Field id={ids.summary} label={labels.summary} description="What problem does it solve that existing components do not?" error={errors.summary} required>
          {(control) => <Input {...control} value={values.summary} onChange={(event) => set('summary', event.target.value)} />}
        </Field>
        <Field id={ids.email} label={labels.email} description="Checked for format only; it is not sent anywhere." error={errors.email} required>
          {(control) => (
            <Input {...control} type="email" autoComplete="email" value={values.email} onChange={(event) => set('email', event.target.value)} />
          )}
        </Field>
        <Stack gap="extraSmall">
          <Checkbox
            id={ids.searched}
            label="I searched the directory and nothing existing fits"
            checked={values.searched}
            required
            aria-invalid={errors.searched ? true : undefined}
            aria-describedby={errors.searched ? `${ids.searched}-error` : undefined}
            onChange={(event) => set('searched', event.target.checked)}
          />
          {errors.searched && (
            <Text id={`${ids.searched}-error`} tone="danger" variant="bodySmall">
              Error: {errors.searched}
            </Text>
          )}
        </Stack>
        <div>
          <Button type="submit" appearance="primary">
            Submit proposal
          </Button>
        </div>
      </Stack>
    </form>
  );
}
