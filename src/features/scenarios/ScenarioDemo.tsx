import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { Field } from '@/design-system/composites';
import { Button, Icon, Select, Text, VisuallyHidden } from '@/design-system/primitives';
import { defaultScenarioOptions, type DemoScenario, type ScenarioOption } from './scenarios';
import styles from './ScenarioDemo.module.css';

export interface ScenarioDemoProps {
  /** Scenarios that apply to this demo, in menu order, with this demo's labels and descriptions. */
  scenarios?: readonly ScenarioOption[];
  defaultScenario?: DemoScenario;
  /** Renders the demo for a scenario. Remounted on every scenario change and reset. */
  children: (scenario: DemoScenario) => ReactNode;
}

const StatusContext = createContext<((message: string) => void) | null>(null);

/**
 * Reports the demo's request state through ScenarioDemo's status message. That message stays mounted
 * across scenario changes and resets, so the end of a wait is announced as well as its start
 * (WCAG 4.1.3). Pass an empty string when another status or an alert already reports the outcome.
 */
export function useScenarioStatus(message: string) {
  const setMessage = useContext(StatusContext);
  useEffect(() => {
    setMessage?.(message);
  }, [setMessage, message]);
}

/**
 * Chooses a demo scenario and renders the demo for it. Changing the scenario or pressing
 * Reset remounts the demo through `key`, so every run starts from the same state. The demo's request
 * status is announced through one persistent status message (see useScenarioStatus).
 */
export function ScenarioDemo({ scenarios = defaultScenarioOptions, defaultScenario, children }: ScenarioDemoProps) {
  const [scenario, setScenario] = useState<DemoScenario>(defaultScenario ?? scenarios[0]?.scenario ?? 'success');
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState('');
  const descriptionId = useId();
  const current = scenarios.find((option) => option.scenario === scenario);

  return (
    <div className={styles.demo}>
      <div className={styles.toolbar}>
        <Field label="Demo scenario">
          {(control) => (
            <Select
              {...control}
              aria-describedby={descriptionId}
              value={scenario}
              onChange={(event) => setScenario(event.target.value as DemoScenario)}
            >
              {scenarios.map((option) => (
                <option key={option.scenario} value={option.scenario}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button size="small" iconStart={<Icon name="refresh" />} onClick={() => setRun((count) => count + 1)}>
          Reset demo
        </Button>
        <Text id={descriptionId} variant="bodySmall" tone="muted" className={styles.description}>
          {current?.description}
        </Text>
      </div>
      <div className={styles.stage} data-scenario={scenario}>
        <StatusContext value={setStatus}>
          <div key={`${scenario}:${run}`}>{children(scenario)}</div>
        </StatusContext>
      </div>
      {/* Outside the keyed demo and its aria-busy section, so it persists across remounts. */}
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </div>
  );
}
