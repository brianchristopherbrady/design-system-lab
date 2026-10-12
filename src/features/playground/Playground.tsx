import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Disclosure, Field } from '@/design-system/composites';
import { ScrollRegion, ThemeScope, useThemeScope } from '@/design-system/layout';
import { Button, Heading, Input, Select, Switch, Text } from '@/design-system/primitives';
import { densityNames, productNames, themeNames, type ModifierInput, type ThemeName } from '@/design-system/tokens';
import { densityLabels, productProfiles } from '@/domain/system';
import { inherit, previewWidth, withCapturedAppearance, type Inheritable, type PlaygroundConfig, type PreviewSettings } from './config';
import { ControlsTable } from './ControlsTable';
import { acceptedValues, buildProps, buildSnippet, initialValues, presetOf, presetValues } from './engine';
import { ContainerInspector } from './ContainerOverlay';
import type { AnyStory, ControlValue, ControlValues, PropApi } from './types';
import styles from './Playground.module.css';

type Modifier = keyof ModifierInput;

const modifiers: readonly Modifier[] = ['product', 'theme', 'density'];
const themeLabels: Record<ThemeName, string> = { light: 'Light', dark: 'Dark' };
const modifierLabel = (modifier: Modifier, input: ModifierInput) =>
  modifier === 'product' ? productProfiles[input.product].name : modifier === 'theme' ? themeLabels[input.theme] : densityLabels[input.density];

const widthPresets = [
  { label: 'Narrow', px: 320 },
  { label: 'Medium', px: 600 },
  { label: 'Wide', px: 960 },
] as const;

export interface PlaygroundProps {
  stories: readonly AnyStory[];
  /** The example to show: component, props and preview settings. */
  config: PlaygroundConfig;
  /** An edit to the example. */
  onConfigChange: (config: PlaygroundConfig) => void;
  /** A different component, whose own draft the owner restores. */
  onStoryChange: (id: string) => void;
  /** An absolute URL that reproduces an example. */
  linkFor: (config: PlaygroundConfig) => string;
  /** Links for the selected story, such as its documentation and source. */
  renderLinks: (story: AnyStory) => ReactNode;
  /** Documented facts about a story's props, shown quietly in the Controls table. */
  apiFor?: (story: AnyStory) => readonly PropApi[] | undefined;
}

/** The preset select's value when the props match no preset and are not the starting values. */
const customPreset = '__custom__';

/**
 * Storybook-style workbench. Its state is the configuration it receives, kept outside the
 * components it renders: the components only ever receive ordinary props.
 */
export function Playground({ stories, config, onConfigChange, onStoryChange, linkFor, renderLinks, apiFor }: PlaygroundProps) {
  const story = stories.find((candidate) => candidate.id === config.component) ?? stories[0];
  if (!story) return null;
  const preset = presetOf(story, config.props);
  const setValues = (props: ControlValues) => onConfigChange({ ...config, props });
  return (
    <div className={styles.playground}>
      <div className={styles.bar}>
        <Field label="Component" className={styles.barField}>
          {(control) => (
            <Select {...control} value={story.id} onChange={(event) => onStoryChange(event.target.value)}>
              {stories.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.component}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {story.presets.length > 0 && (
          <Field label="Preset" className={styles.barField}>
            {(control) => (
              <Select
                {...control}
                value={preset ?? customPreset}
                onChange={(event) => setValues(event.target.value ? presetValues(story, event.target.value) : initialValues(story))}
              >
                <option value="">Starting values</option>
                {story.presets.map((candidate) => (
                  <option key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
                {preset === undefined && (
                  <option value={customPreset} disabled>
                    Custom
                  </option>
                )}
              </Select>
            )}
          </Field>
        )}
        <Button onClick={() => setValues(initialValues(story))}>Reset component props</Button>
        <div className={styles.barLinks}>{renderLinks(story)}</div>
      </div>
      <Text variant="bodySmall" tone="muted">
        {story.summary}
      </Text>
      <Workbench key={story.id} story={story} config={config} onConfigChange={onConfigChange} linkFor={linkFor} api={apiFor?.(story)} />
    </div>
  );
}

type Share = { status: 'copied' | 'failed'; url: string } | null;

function Workbench({
  story,
  config,
  onConfigChange,
  linkFor,
  api,
}: {
  story: AnyStory;
  config: PlaygroundConfig;
  onConfigChange: (config: PlaygroundConfig) => void;
  linkFor: (config: PlaygroundConfig) => string;
  api: readonly PropApi[] | undefined;
}) {
  const site = useThemeScope();
  const values = config.props;
  const overrides = config.preview;
  const { width } = overrides;
  const [measured, setMeasured] = useState<number | null>(null);
  const [previewSize, setPreviewSize] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [share, setShare] = useState<Share>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const manualLinkRef = useRef<HTMLInputElement>(null);
  const ids = { preview: useId(), controls: useId(), usage: useId(), shareHelp: useId() };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setMeasured(Math.round(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Where the preview stays in view, controls scrolled into view by focus stop below it, not under it.
  useEffect(() => {
    const panel = previewRef.current;
    if (!panel || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setPreviewSize(Math.ceil(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height));
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const preview: ModifierInput = {
    theme: overrides.theme === inherit ? site.theme : overrides.theme,
    product: overrides.product === inherit ? site.product : overrides.product,
    density: overrides.density === inherit ? site.density : overrides.density,
  };
  const overridden = modifiers.filter((modifier) => overrides[modifier] !== inherit);
  const context = [...modifiers.map((modifier) => modifierLabel(modifier, preview)), measured === null ? null : `${measured}px`]
    .filter(Boolean)
    .join(' · ');

  const exampleLink = linkFor(withCapturedAppearance(config, site));
  // Feedback belongs to the link it was about; any later change makes it stale.
  const shareFeedback = share?.url === exampleLink ? share : null;

  useEffect(() => {
    if (shareFeedback?.status !== 'failed') return;
    manualLinkRef.current?.focus();
    manualLinkRef.current?.select();
  }, [shareFeedback?.status]);

  const copyLink = () => {
    const url = exampleLink;
    if (typeof navigator.clipboard?.writeText !== 'function') {
      setShare({ status: 'failed', url });
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => setShare({ status: 'copied', url }),
      () => setShare({ status: 'failed', url }),
    );
  };

  const setPreview = (changes: Partial<PreviewSettings>) => onConfigChange({ ...config, preview: { ...config.preview, ...changes } });
  const props = buildProps(story, values);
  const snippet = buildSnippet(story, values);
  const setValue = (prop: string, value: ControlValue) => onConfigChange({ ...config, props: { ...values, [prop]: value } });

  return (
    <div className={styles.workbench}>
      <div className={styles.editor} style={{ '--_preview-size': `${previewSize}px` } as CSSProperties}>
        <section aria-labelledby={ids.preview} className={styles.previewPanel} ref={previewRef} data-testid="preview-panel">
          <div className={styles.previewHeader}>
            <Heading level={2} size="small" id={ids.preview}>
              Preview
            </Heading>
            <Text variant="bodySmall" tone="muted" id={ids.shareHelp} className={styles.shareHelp}>
              Copies this example’s props and current preview appearance.
            </Text>
            <Button size="small" aria-describedby={ids.shareHelp} onClick={copyLink}>
              Copy example link
            </Button>
          </div>
          <Text variant="bodySmall" role="status">
            {shareFeedback?.status === 'copied' ? 'Example link copied.' : ''}
            {shareFeedback?.status === 'failed' ? 'The link could not be copied automatically. Select it below and copy it.' : ''}
          </Text>
          {shareFeedback?.status === 'failed' && (
            <Field label="Example link">
              {(control) => (
                <Input {...control} ref={manualLinkRef} readOnly value={shareFeedback.url} onFocus={(event) => event.currentTarget.select()} />
              )}
            </Field>
          )}
          <ScrollRegion axis="both" className={styles.stage} aria-label={`${story.component} preview`}>
            <ContainerInspector enabled={overrides.outlines}>
              <ThemeScope
                ref={frameRef}
                className={styles.frame}
                theme={overrides.theme === inherit ? undefined : overrides.theme}
                product={overrides.product === inherit ? undefined : overrides.product}
                density={overrides.density === inherit ? undefined : overrides.density}
                data-testid="playground-preview"
                // A fixed width never exceeds the stage, so a wide request cannot overflow a narrow screen.
                style={{ inlineSize: width === null ? '100%' : `min(${width}px, 100%)` }}
              >
                {story.render(props)}
              </ThemeScope>
            </ContainerInspector>
          </ScrollRegion>
        </section>

        <div className={styles.previewOptions}>
          {story.previewNote && (
            <Text variant="bodySmall" tone="muted">
              {story.previewNote}
            </Text>
          )}

          <Disclosure
            className={styles.settings}
            summary={
              <span className={styles.settingsSummary}>
                <span>Preview settings</span>
                <span className={styles.context} data-testid="preview-context">
                  {context}
                  <span className={styles.contextSource}>
                    {overridden.length === 0 ? 'Same as site' : `Overrides ${overridden.join(', ')}`}
                  </span>
                </span>
              </span>
            }
          >
            <div className={styles.toolbar}>
              <div className={styles.scopeGroup}>
                <ScopeSelect
                  label="Preview product"
                  value={overrides.product}
                  options={productNames.map((name) => [name, productProfiles[name].name] as const)}
                  onChange={(product) => setPreview({ product })}
                />
                <ScopeSelect
                  label="Preview theme"
                  value={overrides.theme}
                  options={themeNames.map((name) => [name, themeLabels[name]] as const)}
                  onChange={(theme) => setPreview({ theme })}
                />
                <ScopeSelect
                  label="Preview density"
                  value={overrides.density}
                  options={densityNames.map((name) => [name, densityLabels[name]] as const)}
                  onChange={(density) => setPreview({ density })}
                />
                <Field
                  label="Preview width"
                  description={measured === null ? undefined : `${measured}px`}
                  className={styles.widthField}
                >
                  {(control) => (
                    <input
                      {...control}
                      type="range"
                      className={styles.range}
                      min={previewWidth.min}
                      max={previewWidth.max}
                      step={8}
                      value={width ?? previewWidth.max}
                      aria-valuetext={width === null ? 'Fill available width' : `${width} pixels`}
                      onChange={(event) => setPreview({ width: Number(event.target.value) })}
                    />
                  )}
                </Field>
              </div>
              <div className={styles.segmented} role="group" aria-label="Preview width presets">
                {widthPresets.map((preset) => (
                  <Button key={preset.label} size="small" aria-pressed={width === preset.px} onClick={() => setPreview({ width: preset.px })}>
                    {preset.label} ({preset.px}px)
                  </Button>
                ))}
                <Button size="small" aria-pressed={width === null} onClick={() => setPreview({ width: null })}>
                  Fill
                </Button>
              </div>
              <Switch
                label="Show query containers"
                description="Outline every container the preview's components query, with its live width."
                checked={overrides.outlines}
                onChange={(event) => setPreview({ outlines: event.target.checked })}
              />
            </div>
          </Disclosure>

          {story.inheritsScope && <ScopeChain story={story} site={site} preview={preview} overrides={overrides} values={values} />}
        </div>

        <section aria-labelledby={ids.controls} className={styles.controlsPanel}>
          <Heading level={2} size="small" id={ids.controls}>
            Component props
          </Heading>
          <ControlsTable story={story} values={values} api={api} onChange={setValue} labelledBy={ids.controls} />
        </section>
      </div>

      <section aria-labelledby={ids.usage} className={styles.usagePanel}>
        <div className={styles.usageHeader}>
          <Heading level={2} size="small" id={ids.usage}>
            Usage
          </Heading>
          <Button
            size="small"
            onClick={() => {
              void navigator.clipboard?.writeText(snippet).then(() => setCopiedSnippet(snippet));
            }}
          >
            Copy code
          </Button>
          <span role="status" className={styles.copied}>
            {copiedSnippet === snippet ? 'Copied' : ''}
          </span>
        </div>
        <ScrollRegion as="pre" className={styles.code} data-theme="dark" aria-label="Usage code">
          <code data-testid="playground-snippet">{snippet}</code>
        </ScrollRegion>
      </section>

      <div className={styles.propsPanel}>
        <Disclosure summary={`Props reference (${story.controls.length} props)`}>
          <ScrollRegion aria-label={`${story.component} controlled props`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Accepted values</th>
                  <th scope="col">Initial</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {story.controls.map((control) => (
                  <tr key={control.prop}>
                    <th scope="row">
                      <code>{control.prop}</code>
                    </th>
                    <td>
                      <code>{acceptedValues(control)}</code>
                    </td>
                    <td>
                      <code>{control.defaultValue === undefined ? (control.kind === 'select' && control.unsetLabel) || 'unset' : String(control.defaultValue)}</code>
                    </td>
                    <td>{control.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Disclosure>
      </div>
    </div>
  );
}

/** Where each modifier comes from for a component that inherits its scope: site, then preview, then its own props. */
function ScopeChain({
  story,
  site,
  preview,
  overrides,
  values,
}: {
  story: AnyStory;
  site: ModifierInput;
  preview: ModifierInput;
  overrides: Record<Modifier, string>;
  values: ControlValues;
}) {
  const own = (modifier: Modifier) => values[modifier] as ModifierInput[Modifier] | undefined;
  const result = (modifier: Modifier): ModifierInput => ({ ...preview, [modifier]: own(modifier) ?? preview[modifier] });
  return (
    <div className={styles.chain}>
      <ScrollRegion axis="inline" aria-label={`Where ${story.component} gets each setting`}>
        <table className={styles.table}>
          <caption className={styles.chainCaption}>Where {story.component} gets each setting</caption>
          <thead>
            <tr>
              <th scope="col">Setting</th>
              <th scope="col">Site</th>
              <th scope="col">Preview</th>
              <th scope="col">{story.component}</th>
            </tr>
          </thead>
          <tbody>
            {modifiers.map((modifier) => (
              <tr key={modifier}>
                <th scope="row">
                  <code>{modifier}</code>
                </th>
                <td>{modifierLabel(modifier, site)}</td>
                <td>
                  {modifierLabel(modifier, preview)}{' '}
                  <span className={styles.source}>{overrides[modifier] === inherit ? 'from site' : 'preview setting'}</span>
                </td>
                <td>
                  {modifierLabel(modifier, result(modifier))}{' '}
                  <span className={styles.source}>{own(modifier) === undefined ? 'from preview' : 'prop'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <Text variant="bodySmall" tone="muted">
        An unset {story.component} prop inherits from the scope around it, here the preview, which follows the site unless a
        preview setting overrides it. That is different from an unset Button <code>radius</code>, which uses the{' '}
        <code>button.radius</code> component token.
      </Text>
    </div>
  );
}

function ScopeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Inheritable<T>;
  options: readonly (readonly [T, string])[];
  onChange: (value: Inheritable<T>) => void;
}) {
  return (
    <Field label={label}>
      {(control) => (
        <Select {...control} value={value} onChange={(event) => onChange(event.target.value as Inheritable<T>)}>
          <option value={inherit}>Same as site</option>
          {options.map(([option, text]) => (
            <option key={option} value={option}>
              {text}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
