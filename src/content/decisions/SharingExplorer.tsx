import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useHref, useLocation, useNavigate } from 'react-router';
import { Disclosure, Field } from '@/design-system/composites';
import { Badge, Button, Heading, Icon, Input, Select, Text, VisuallyHidden } from '@/design-system/primitives';
import {
  approachName,
  assessApproaches,
  assessLayers,
  changedConstraints,
  compareOutcomes,
  constraintIds,
  constraints,
  constraintsToSearch,
  defaultConstraints,
  hasInvalidConstraints,
  isApplicable,
  leaningLabels,
  parseConstraints,
  pilotQuestions,
  presetFor,
  presets,
  recommend,
  sameConstraints,
  type Constraints,
  type Leaning,
  type OutcomeChange,
} from '@/domain/decisions';
import styles from './decisions.module.css';

const leaningTone: Record<Leaning, 'success' | 'info' | 'neutral'> = { share: 'success', partial: 'info', separate: 'neutral' };

type Cause = { kind: 'constraint'; label: string; to: string } | { kind: 'preset'; name: string } | { kind: 'reset' };

/** Constraints live in the URL. Changes replace the history entry and keep the fragment, so a scenario can be shared. */
function useScenarioUrl() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathHref = useHref(location.pathname);
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const values = useMemo(() => parseConstraints(params), [params]);

  const write = useCallback(
    (next: Constraints) => {
      const search = new URLSearchParams(location.search);
      for (const id of constraintIds) search.delete(id);
      if (!sameConstraints(next, defaultConstraints)) for (const [key, value] of constraintsToSearch(next)) search.set(key, value);
      const query = search.toString();
      void navigate({ search: query ? `?${query}` : '', hash: location.hash }, { replace: true, preventScrollReset: true });
    },
    [location.search, location.hash, navigate],
  );

  // A link with an unrecognised value is rewritten to the constraints actually shown.
  useEffect(() => {
    if (hasInvalidConstraints(params)) write(values);
  }, [params, values, write]);

  const link = new URL(`${pathHref}?${constraintsToSearch(values).toString()}#explore`, window.location.origin).href;
  return { values, write, link };
}

function Transition({ change }: { change: OutcomeChange }) {
  if (change.from && change.to)
    return (
      <>
        {change.from} <span aria-hidden="true">→</span> <VisuallyHidden>to</VisuallyHidden> {change.to}
      </>
    );
  return <>{change.to ? `New: ${change.to}` : `No longer shown (was ${change.from ?? ''})`}</>;
}

function announcement(cause: Cause, conclusions: readonly OutcomeChange[]) {
  const what = cause.kind === 'preset' ? `Preset applied: ${cause.name}.` : cause.kind === 'reset' ? 'Reset to the scenario.' : `${cause.label}: ${cause.to}.`;
  if (conclusions.length === 0) return `${what} No conclusions changed.`;
  const named = conclusions.slice(0, 3).map((change) => change.subject).join('; ');
  const more = conclusions.length > 3 ? `; and ${conclusions.length - 3} more` : '';
  return `${what} ${conclusions.length} ${conclusions.length === 1 ? 'conclusion' : 'conclusions'} changed: ${named}${more}.`;
}

/**
 * Change a few constraints, or start from a preset, and see how the case for each layer and
 * approach shifts, what changed and why, and a conditional starting point. Reasons, not scores.
 */
export function SharingExplorer() {
  const { values, write, link } = useScenarioUrl();
  const [last, setLast] = useState<{ before: Constraints; after: Constraints; cause: Cause } | null>(null);
  const [copy, setCopy] = useState<{ status: 'copied' | 'failed'; link: string } | null>(null);
  const manualLinkRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const ids = { presets: `${id}-presets`, linkHelp: `${id}-link-help`, changed: `${id}-changed`, start: `${id}-start` };

  const layers = assessLayers(values);
  const approaches = assessApproaches(values);
  const parts = recommend(values);
  const pilot = pilotQuestions(values);
  const preset = presetFor(values);
  // Feedback describes the last change only while the constraints still match it, so Back or a new link clears it.
  const change = last && sameConstraints(last.after, values) ? last : null;
  const outcome = change ? compareOutcomes(change.before, change.after) : null;
  const changedInputs = change ? changedConstraints(change.before, change.after) : [];
  const changedSubjects = new Set([...(outcome?.conclusions ?? []), ...(outcome?.reasoning ?? [])].map((item) => item.subject));
  const copyFeedback = copy?.link === link ? copy : null;

  useEffect(() => {
    if (copyFeedback?.status !== 'failed') return;
    manualLinkRef.current?.focus();
    manualLinkRef.current?.select();
  }, [copyFeedback?.status]);

  const apply = (next: Constraints, cause: Cause) => {
    setLast({ before: values, after: next, cause });
    write(next);
  };

  const copyLink = () => {
    const url = link;
    if (typeof navigator.clipboard?.writeText !== 'function') {
      setCopy({ status: 'failed', link: url });
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => setCopy({ status: 'copied', link: url }),
      () => setCopy({ status: 'failed', link: url }),
    );
  };

  const changedBadge = (subject: string) =>
    changedSubjects.has(subject) ? (
      <Badge tone="brand" size="small">
        Changed
      </Badge>
    ) : null;

  return (
    <div className={styles.explorer}>
      <div className={styles.presetGroup}>
        <div role="group" aria-labelledby={ids.presets} className={styles.presetButtons}>
          <Text as="span" variant="label" id={ids.presets}>
            Start from a preset
          </Text>
          {presets.map((candidate) => {
            const pressed = preset?.id === candidate.id;
            return (
              <Button
                key={candidate.id}
                size="small"
                className={styles.presetButton}
                aria-pressed={pressed}
                iconStart={pressed ? <Icon name="check" /> : undefined}
                onClick={() => apply(candidate.values, { kind: 'preset', name: candidate.name })}
              >
                {candidate.name}
              </Button>
            );
          })}
        </div>
        <Text variant="bodySmall" tone="muted">
          {preset ? preset.description : 'Custom constraints: they match no preset.'}
        </Text>
      </div>

      <fieldset className={styles.constraints}>
        <legend className={styles.constraintsLegend}>Constraints</legend>
        {constraints.map((constraint) => {
          const applies = isApplicable(constraint.id, values);
          return (
            <Field key={constraint.id} label={constraint.label} description={applies ? undefined : 'Only the provider workspace is on the web.'}>
              {(control) => (
                <Select
                  {...control}
                  disabled={!applies}
                  value={applies ? values[constraint.id] : ''}
                  onChange={(event) => {
                    const to = constraint.options.find((option) => option.value === event.target.value)?.label ?? event.target.value;
                    apply({ ...values, [constraint.id]: event.target.value }, { kind: 'constraint', label: constraint.label, to });
                  }}
                >
                  {applies ? (
                    constraint.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Not applicable</option>
                  )}
                </Select>
              )}
            </Field>
          );
        })}
      </fieldset>

      <div className={styles.explorerActions}>
        <Button size="small" appearance="ghost" iconStart={<Icon name="refresh" />} onClick={() => apply(defaultConstraints, { kind: 'reset' })}>
          Reset to the scenario
        </Button>
        <Button size="small" aria-describedby={ids.linkHelp} onClick={copyLink}>
          Copy scenario link
        </Button>
        <Text as="span" variant="bodySmall" tone="muted" id={ids.linkHelp}>
          The page address keeps these constraints, so a link opens this comparison as you see it.
        </Text>
      </div>
      <Text variant="bodySmall" role="status">
        {copyFeedback?.status === 'copied' ? 'Scenario link copied.' : ''}
        {copyFeedback?.status === 'failed' ? 'The link could not be copied automatically. Select it below and copy it.' : ''}
      </Text>
      {copyFeedback?.status === 'failed' && (
        <Field label="Scenario link">
          {(control) => <Input {...control} ref={manualLinkRef} readOnly value={copyFeedback.link} onFocus={(event) => event.currentTarget.select()} />}
        </Field>
      )}
      <VisuallyHidden role="status">{change && outcome ? announcement(change.cause, outcome.conclusions) : ''}</VisuallyHidden>

      {change && outcome && (
        <section className={styles.explorerPart} aria-labelledby={ids.changed}>
          <Heading level={3} size="small" id={ids.changed}>
            What changed
          </Heading>
          <Text variant="bodySmall">
            {change.cause.kind === 'preset'
              ? `You applied the “${change.cause.name}” preset.`
              : change.cause.kind === 'reset'
                ? 'You reset the constraints to the scenario’s.'
                : 'You changed one constraint.'}{' '}
            {changedInputs.length === 0
              ? 'The constraints were already set that way.'
              : changedInputs.map((input) => `${input.label} changed from ${input.from} to ${input.to}.`).join(' ')}
          </Text>
          {outcome.conclusions.length === 0 ? (
            <Text variant="bodySmall" tone="muted">
              No conclusions changed.
            </Text>
          ) : (
            <ul className={styles.changes}>
              {outcome.conclusions.map((item) => (
                <li key={item.subject}>
                  <span className={styles.layerName}>
                    <Text as="span" variant="label">
                      {item.subject}
                    </Text>
                    <Text as="span" variant="bodySmall">
                      <Transition change={item} />
                    </Text>
                  </span>
                  <Text as="span" variant="bodySmall" tone="muted">
                    Why: {item.why}
                  </Text>
                </li>
              ))}
            </ul>
          )}
          {outcome.reasoning.length > 0 && (
            <Disclosure summary={`Reasoning updated in ${outcome.reasoning.length} ${outcome.reasoning.length === 1 ? 'place' : 'places'}`}>
              <ul className={styles.changes}>
                {outcome.reasoning.map((item) => (
                  <li key={item.subject}>
                    <Text as="span" variant="label">
                      {item.subject}
                    </Text>
                    <Text as="span" variant="bodySmall" tone="muted">
                      {item.why}
                    </Text>
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}
        </section>
      )}

      <section className={styles.explorerPart} aria-labelledby={ids.start}>
        <Heading level={3} size="small" id={ids.start}>
          A starting point for these constraints
        </Heading>
        <Text variant="bodySmall" tone="muted">
          A reasonable place to begin, not a verdict. Each part names the constraints that support it and the evidence that would overturn it.
        </Text>
        <div className={styles.recommendations}>
          {parts.map((part) => {
            const subject = `Starting point: ${part.scope}`;
            return (
              <div key={part.part} className={styles.recommendation}>
                <span className={styles.layerName}>
                  <Heading level={4} size="small">
                    {part.scope}
                  </Heading>
                  {changedBadge(subject)}
                </span>
                <Text variant="body">
                  <strong>{approachName(part.approach)}</strong>
                </Text>
                <dl>
                  <div>
                    <Text as="dt" variant="caption" tone="muted">
                      Supported by
                    </Text>
                    <dd>
                      <ul>
                        {part.because.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <Text as="dt" variant="caption" tone="muted">
                      Would change if
                    </Text>
                    <dd>
                      <ul>
                        {part.overturnedBy.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.explorerPart} aria-labelledby="explorer-layers">
        <Heading level={3} size="small" id="explorer-layers">
          Layer by layer
        </Heading>
        <ul className={styles.layers}>
          {layers.map((layer) => (
            <li key={layer.layer} className={styles.layer}>
              <span className={styles.layerName}>
                <Text as="span" variant="label">
                  {layer.layer}
                </Text>
                <Badge tone={leaningTone[layer.leaning]} size="small">
                  {leaningLabels[layer.leaning]}
                </Badge>
                {changedBadge(layer.layer)}
              </span>
              <Text as="span" variant="bodySmall" tone="muted">
                {layer.because}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.explorerPart} aria-labelledby="explorer-approaches">
        <Heading level={3} size="small" id="explorer-approaches">
          How each approach holds up
        </Heading>
        <ul className={styles.approaches}>
          {approaches.map((approach) => (
            <li key={approach.id} className={styles.approach}>
              <span className={styles.layerName}>
                <Text as="span" variant="label">
                  {approach.name}
                </Text>
                {changedBadge(approach.name)}
              </span>
              <ul className={styles.reasons}>
                {approach.fits.map((reason) => (
                  <li key={reason} data-kind="fits">
                    <Icon name="check" />
                    <span>
                      <VisuallyHidden>Fits: </VisuallyHidden>
                      {reason}
                    </span>
                  </li>
                ))}
                {approach.strains.map((reason) => (
                  <li key={reason} data-kind="strains">
                    <Icon name="warning" />
                    <span>
                      <VisuallyHidden>Strains: </VisuallyHidden>
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.explorerPart} aria-labelledby="explorer-pilot">
        <Heading level={3} size="small" id="explorer-pilot">
          What the pilot must answer
        </Heading>
        <ol className={styles.pilot}>
          {pilot.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
