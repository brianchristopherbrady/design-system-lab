import { useState, type CSSProperties } from 'react';
import { Field } from '@/design-system/composites';
import { ThemeScope } from '@/design-system/layout';
import { Badge, Button, Icon, Input, Link, Text } from '@/design-system/primitives';
import { closeDistance, formatDistance, shapeNames, shapes } from './brand';
import { ChoiceGroup } from './ChoiceGroup';
import { CopyButton } from './CopyButton';
import styles from './ThemeStudio.module.css';
import { previewProduct, studioPresets, type ThemeStudioState } from './useThemeStudio';

const swatch = (color: string) => ({ '--_swatch': color }) as CSSProperties;

/**
 * The generated theme at a glance, beside the controls that make it: the ramp, and the brand roles
 * and shape on real components in both themes. The sections below give the detail.
 */
function StudioResult({ studio }: { studio: ThemeStudioState }) {
  return (
    <figure className={styles.result}>
      <figcaption className={styles.resultCaption}>
        <span className={styles.caption}>Live result</span>
        <span className={`${styles.muted} ${styles.resultExtra}`}>
          {studio.name}, {shapes[studio.shape].label.toLowerCase()} shape, light and dark. Details below.
        </span>
      </figcaption>
      <div className={styles.resultRamp} aria-hidden="true">
        {studio.analysis.map((step) => (
          <span key={step.step} style={swatch(step.hex)} />
        ))}
      </div>
      {/* A picture of the result: not focusable and not announced, since the caption and the sections below say it in full. */}
      <div className={styles.resultScopes} inert>
        {(['light', 'dark'] as const).map((theme) => (
          <ThemeScope key={theme} theme={theme} product={previewProduct} className={styles.resultScope} style={studio.previewStyle(theme)}>
            <Button appearance="primary" size="small">
              Save
            </Button>
            <Badge tone="brand" appearance="filled">
              New
            </Badge>
            <span className={styles.resultExtra}>
              <Badge tone="brand">Draft</Badge>
              <Link href="#preview">Details</Link>
            </span>
          </ThemeScope>
        ))}
      </div>
    </figure>
  );
}

/** Presets, brand color, product id and shape, with the result they produce. */
export function StudioControls({ studio }: { studio: ThemeStudioState }) {
  const [brandTouched, setBrandTouched] = useState(false);
  const showBrandProblem = (brandTouched || studio.brandDraft.length >= 7) && studio.brandProblem;
  return (
    <div className={styles.console}>
      <div className={styles.controls}>
        <div className={styles.presetRow}>
          <div className={styles.presets} role="group" aria-labelledby="studio-presets-label" aria-describedby="studio-presets-hint">
            <span id="studio-presets-label" className={styles.caption}>
              Start from a preset
            </span>
            {studioPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles.preset}
                aria-pressed={studio.brand === preset.brand && studio.id === preset.id}
                onClick={() => studio.applyPreset(preset)}
              >
                <span className={styles.presetSwatch} style={swatch(preset.brand)} aria-hidden="true" />
                {preset.id.charAt(0).toUpperCase() + preset.id.slice(1)}
              </button>
            ))}
          </div>
          <Text id="studio-presets-hint" variant="bodySmall" tone="muted">
            A preset sets the brand color and product id. The shape stays as you choose it.
          </Text>
        </div>

        <div className={styles.identity}>
          <Field
            className={styles.alignedField}
            label="Brand color"
            description="Any sRGB color as hex. Hue and chroma are kept; lightness is rebuilt."
            error={showBrandProblem || undefined}
          >
            {(control) => (
              <div className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.picker}
                  value={studio.brand}
                  aria-label="Brand color picker"
                  onChange={(event) => studio.setBrandInput(event.target.value)}
                />
                <Input
                  {...control}
                  className={styles.hexInput}
                  value={studio.brandDraft}
                  spellCheck={false}
                  autoComplete="off"
                  onBlur={() => setBrandTouched(true)}
                  onChange={(event) => studio.setBrandInput(event.target.value)}
                />
              </div>
            )}
          </Field>
          <Field className={styles.alignedField} label="Product id" description="Becomes the data-product value and the token names." error={studio.idProblem}>
            {(control) => (
              <Input
                {...control}
                className={styles.hexInput}
                value={studio.idDraft}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => studio.setIdInput(event.target.value)}
              />
            )}
          </Field>
        </div>

        <div className={styles.shapeField}>
          <ChoiceGroup
            legend="Shape"
            value={studio.shape}
            options={shapeNames.map((name) => ({ value: name, label: shapes[name].label }))}
            onChange={studio.setShape}
          />
          <Text variant="bodySmall" tone="muted">
            Corners of the generated product’s controls, badges, cards and dialogs. {shapes[studio.shape].description}
          </Text>
        </div>
      </div>

      <StudioResult studio={studio} />

      <div className={styles.consoleFooter}>
        <div className={styles.actions}>
          <CopyButton text={() => window.location.href} label="Copy link" />
          <Button size="small" appearance="ghost" iconStart={<Icon name="refresh" />} onClick={studio.reset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** The studio's verdict at a glance, as instrument readouts. */
export function StudioReadouts({ studio }: { studio: ThemeStudioState }) {
  const { summary } = studio;
  const peak = studio.analysis.reduce((best, step) => (step.c > best.c ? step : best));
  const readouts = [
    { label: 'Hue', value: `${Math.round(studio.oklch.h)}°`, detail: studio.hue },
    { label: 'Peak chroma', value: peak.c.toFixed(3), detail: `step ${peak.step}, L ${percent(peak.l)}` },
    {
      label: 'WCAG 2 AA',
      value: `${summary.passed}/${summary.total}`,
      detail: summary.passed === summary.total ? 'every pair passes' : `${summary.total - summary.passed} failing`,
      state: summary.passed === summary.total ? 'pass' : 'fail',
    },
    {
      label: 'Nearest status',
      value: formatDistance(summary.closest.distance),
      detail: `ΔEOK to ${summary.closest.tone}, ${summary.closest.close ? 'close' : 'distinct'}`,
      state: summary.closest.distance < closeDistance ? 'warn' : 'pass',
    },
  ];
  return (
    <dl className={styles.readouts}>
      {readouts.map((readout) => (
        <div key={readout.label} className={styles.readout} data-state={readout.state}>
          <dt className={styles.caption}>{readout.label}</dt>
          <dd className={styles.readoutValue}>{readout.value}</dd>
          <dd className={styles.readoutDetail}>{readout.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
