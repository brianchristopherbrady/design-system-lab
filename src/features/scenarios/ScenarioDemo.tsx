import { useId, useState, type ReactNode } from 'react';
import { Field } from '@/design-system/composites';
import { Button, Icon, Select, Text } from '@/design-system/primitives';
import { defaultScenarioOptions, type DemoScenario, type ScenarioOption } from './scenarios';
import styles from './ScenarioDemo.module.css';

export interface ScenarioDemoProps {
  /** Scenarios that apply to this demo, in menu order, with this demo's labels and descriptions. */
  scenarios?: readonly ScenarioOption[];
  defaultScenario?: DemoScenario;
  /** Renders the demo for a scenario. Remounted on every scenario change and reset. */
  children: (scenario: DemoScenario) => ReactNode;
}

/**
 * Chooses a demo scenario and renders the demo for it. Changing the scenario or pressing
 * Reset remounts the demo through `key`, so every run starts from the same state.
 */
export function ScenarioDemo({ scenarios = defaultScenarioOptions, defaultScenario, children }: ScenarioDemoProps) {
  const [scenario, setScenario] = useState<DemoScenario>(defaultScenario ?? scenarios[0]?.scenario ?? 'success');
  const [run, setRun] = useState(0);
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
        <div key={`${scenario}:${run}`}>{children(scenario)}</div>
      </div>
    </div>
  );
}
