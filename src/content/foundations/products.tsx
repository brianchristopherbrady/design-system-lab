import { Fragment, useMemo, useState } from 'react';
import { Card, Field } from '@/design-system/composites';
import { Grid, Inline, ScrollRegion, Stack, ThemeScope, useThemeScope } from '@/design-system/layout';
import { Badge, Button, Checkbox, Heading, Input, Link, Select, Switch, Text } from '@/design-system/primitives';
import {
  densityNames,
  modifierDefaults,
  modifierNames,
  productNames,
  themeNames,
  type ModifierInput,
  type ModifierName,
  type ThemeName,
  type TokenPath,
} from '@/design-system/tokens';
import { tokenManifest } from '@/design-system/tokens/manifest';
import { densityLabels, productProfiles } from '@/domain/system';
import { DocSection, LiveExample, Note, Prose, SourceList, TokenSwatch } from '@/features/docs';
import { ChoiceGroup, CopyButton } from '@/features/theming';
import { densityTokens, permutationCount, permutationIndex, primaryFamily, productTokens, recordOf, resolveFor, selectorFor } from './modes';
import styles from './products.module.css';

const contextsOf = { theme: themeNames, product: productNames, density: densityNames } as const;
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function dependencyGroups() {
  const counts = new Map<string, number>();
  for (const record of tokenManifest) {
    const key = record.dependsOn.length ? record.dependsOn.join(' × ') : 'none';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

const selectorsFor = (dependsOn: readonly string[]) => {
  if (dependsOn.length === 0) return [':root'];
  let combos: Record<string, string>[] = [{}];
  for (const name of dependsOn) {
    const contexts = contextsOf[name as keyof typeof contextsOf];
    combos = combos.flatMap((combo) => contexts.map((context) => ({ ...combo, [name]: context })));
  }
  return combos.map((combo) =>
    Object.entries(combo)
      .map(([name, context]) => `[data-${name}='${context}']`)
      .join(''),
  );
};

const inspectable: TokenPath[] = ['button.primary.background', 'action.primary.background', 'card.radius', 'control.height.medium', 'surface.canvas', 'space.md'];

function TokenInspector() {
  const [path, setPath] = useState<TokenPath>('button.primary.background');
  const record = tokenManifest.find((candidate) => candidate.path === path);
  if (!record) return null;
  const variants = record.variants ?? themeNames.map((theme) => ({ input: { theme }, ...record.values[theme] }));
  return (
    <LiveExample
      title="Where a token is declared"
      kind="recommended"
      showHtml={false}
      description="Pick a token to see which modifiers it depends on, the selectors it is emitted under, and its value in each combination."
      controls={
        <Field label="Token">
          {(control) => (
            <Select {...control} value={path} onChange={(event) => setPath(event.target.value as TokenPath)}>
              {inspectable.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
      }
    >
      <Stack gap="small">
        <Inline gap="extraSmall">
          <Text as="span" variant="label">
            Depends on:
          </Text>
          {record.dependsOn.length === 0 ? (
            <Badge>nothing (declared once on :root)</Badge>
          ) : (
            record.dependsOn.map((name) => (
              <Badge key={name} tone="brand">
                {name}
              </Badge>
            ))
          )}
        </Inline>
        <ScrollRegion aria-label={`${path} by modifier combination`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Selector</th>
                <th scope="col">Authored</th>
                <th scope="col">Resolves to</th>
              </tr>
            </thead>
            <tbody>
              {(record.dependsOn.length === 0 ? [{ input: {}, ...record.values.light }] : variants).map((variant, index) => (
                <tr key={index}>
                  <th scope="row">
                    <code>{selectorsFor(record.dependsOn)[index] ?? ':root'}</code>
                  </th>
                  <td>
                    <code>{variant.authored}</code>
                  </td>
                  <td>
                    <span className={styles.value}>
                      <TokenSwatch type={record.type} value={variant.resolved} />
                      <code>{variant.resolved}</code>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Stack>
    </LiveExample>
  );
}

function Specimen({ heading }: { heading: string }) {
  return (
    <Card
      header={
        <Inline gap="extraSmall" justify="between">
          <Heading level={3} size="small">
            {heading}
          </Heading>
          <Badge tone="brand">New</Badge>
        </Inline>
      }
      footer={
        <Inline gap="small">
          <Button appearance="primary" size="small">
            Approve
          </Button>
          <Button size="small">Later</Button>
        </Inline>
      }
    >
      <Stack gap="small">
        <Text variant="bodySmall">
          Two appointment requests need review. <Link href="#matrix">Open queue</Link>
        </Text>
        <Switch label="Notify the team" defaultChecked />
      </Stack>
    </Card>
  );
}

function ProductCards() {
  return (
    <Grid minColumnWidth="medium" gap="medium">
      {productNames.map((name) => (
        <ThemeScope key={name} product={name} className={styles.productCard}>
          <div className={styles.productBand} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <Stack gap="small" className={styles.productBody}>
            <Inline gap="small" justify="between">
              <Heading level={3} size="small">
                {productProfiles[name].name}
              </Heading>
              <code className={styles.productId}>{name}</code>
            </Inline>
            <Text variant="bodySmall">{productProfiles[name].audience}</Text>
            <Text variant="bodySmall" tone="muted">
              {productProfiles[name].overrides}
            </Text>
            <Inline gap="small">
              <Button appearance="primary" size="small">
                Primary
              </Button>
              <Badge tone="brand">Brand</Badge>
              <Link href="#overrides">Link</Link>
            </Inline>
          </Stack>
        </ThemeScope>
      ))}
    </Grid>
  );
}

const composerTokens: TokenPath[] = [
  'action.primary.background',
  'action.primary.foreground',
  'text.link',
  'focus.ring',
  'surface.canvas',
  'control.radius',
  'card.radius',
  'control.height.medium',
  'spacing.medium',
];

function ComposerSpecimen() {
  return (
    <Card
      header={
        <Inline gap="extraSmall" justify="between">
          <Heading level={3} size="small">
            Appointment request R-2041
          </Heading>
          <Badge tone="brand">Requested</Badge>
        </Inline>
      }
      footer={
        <Inline gap="small">
          <Button appearance="primary">Approve</Button>
          <Button>Later</Button>
        </Inline>
      }
    >
      <Stack gap="medium">
        <Text variant="bodySmall">
          Sam K., annual check-up, weekday mornings. <Link href="#composer">View history</Link>
        </Text>
        <Field label="Provider note">{(control) => <Input {...control} defaultValue="Prefers early slots" />}</Field>
        <Checkbox label="Notify the patient" defaultChecked />
      </Stack>
    </Card>
  );
}

function ModeComposer() {
  const site = useThemeScope();
  const [input, setInput] = useState<ModifierInput>(site);
  const attributes = (prefix: string) => modifierNames.map((name) => `  ${prefix}${name}="${input[name]}"`);
  const jsx = ['<ThemeScope', ...attributes(''), '>', '  {children}', '</ThemeScope>'].join('\n');
  const snippet = [jsx, '', '<!-- renders -->', '<div', ...attributes('data-'), '>'].join('\n');

  return (
    <div className={styles.composer}>
      <div className={styles.composerControls}>
        <ChoiceGroup
          legend="Theme"
          value={input.theme}
          options={themeNames.map((name) => ({ value: name, label: capitalize(name) }))}
          onChange={(theme) => setInput({ ...input, theme })}
        />
        <ChoiceGroup
          legend="Product"
          value={input.product}
          options={productNames.map((name) => ({ value: name, label: productProfiles[name].name }))}
          onChange={(product) => setInput({ ...input, product })}
        />
        <ChoiceGroup
          legend="Density"
          value={input.density}
          options={densityNames.map((name) => ({ value: name, label: densityLabels[name] }))}
          onChange={(density) => setInput({ ...input, density })}
        />
        <p className={styles.permutation}>
          <span className={styles.caption}>Permutation</span>
          <span className={styles.permutationValue}>
            {String(permutationIndex(input)).padStart(2, '0')}
            <span className={styles.muted}> / {permutationCount}</span>
          </span>
        </p>
      </div>
      <div className={styles.composerBody}>
        <ThemeScope {...input} className={styles.composerStage} data-testid="composer-preview">
          <ComposerSpecimen />
        </ThemeScope>
        <div className={styles.snippet}>
          <div className={styles.snippetHeader}>
            <span className={styles.caption} id="composer-snippet">
              Markup
            </span>
            <CopyButton text={jsx} label="Copy JSX" />
          </div>
          <ScrollRegion as="pre" className={styles.code} data-theme="dark" aria-labelledby="composer-snippet">
            <code>{snippet}</code>
          </ScrollRegion>
        </div>
        <ScrollRegion className={styles.composerTable} aria-labelledby="composer-caption">
          <table className={styles.table}>
            <caption id="composer-caption" className={styles.tableCaption}>
              Resolved in this mode
            </caption>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Value</th>
                <th scope="col">Declared under</th>
              </tr>
            </thead>
            <tbody>
              {composerTokens.map((path) => {
                const record = recordOf(path);
                if (!record) return null;
                const value = resolveFor(record, input);
                return (
                  <tr key={path}>
                    <th scope="row">
                      <code>{path}</code>
                    </th>
                    <td>
                      <span className={styles.value}>
                        <TokenSwatch type={record.type} value={value.resolved} />
                        <code>{value.resolved}</code>
                      </span>
                    </td>
                    <td>
                      <code className={styles.selector}>
                        {selectorFor(record, input)
                          .split('][')
                          .map((part, index, parts) => (
                            <Fragment key={part}>
                              {index > 0 && <wbr />}
                              {`${index > 0 ? '[' : ''}${part}${index < parts.length - 1 ? ']' : ''}`}
                            </Fragment>
                          ))}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    </div>
  );
}

function ProductDiff() {
  const site = useThemeScope();
  const [theme, setTheme] = useState<ThemeName>(site.theme);
  const { direct, aliases, shared } = useMemo(() => productTokens(theme), [theme]);
  return (
    <Stack gap="medium">
      <ChoiceGroup
        legend="Theme"
        value={theme}
        options={themeNames.map((name) => ({ value: name, label: capitalize(name) }))}
        onChange={setTheme}
      />
      <div className={styles.tableBlock}>
        <p id="diff-caption" className={styles.tableCaption}>
          Product overrides, {theme} theme
        </p>
        <ScrollRegion aria-labelledby="diff-caption">
          <table className={`${styles.table} ${styles.diff}`} aria-labelledby="diff-caption">
            <thead>
              <tr>
                <th scope="col">Token</th>
                {productNames.map((name) => (
                  <th key={name} scope="col">
                    {productProfiles[name].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {direct.map(({ record, values }) => (
                <tr key={record.path}>
                  <th scope="row">
                    <code>{record.path}</code>
                  </th>
                  {values.map((value, index) => (
                    <td key={productNames[index]}>
                      <span className={styles.value}>
                        {record.type === 'color' ? (
                          <TokenSwatch type="color" value={value.resolved} />
                        ) : record.type === 'fontFamily' ? (
                          <span className={styles.typeSample} style={{ fontFamily: value.resolved }} aria-hidden="true">
                            Ag
                          </span>
                        ) : (
                          <span className={styles.radiusSample} style={{ borderStartEndRadius: value.resolved }} aria-hidden="true" />
                        )}
                        <code>{record.type === 'fontFamily' ? primaryFamily(value.resolved) : value.resolved}</code>
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
      <Text variant="bodySmall" tone="muted">
        {direct.length} tokens are overridden directly. {aliases.length} more follow through aliases, such as{' '}
        <code>{aliases[0]?.path ?? 'button.primary.background'}</code>. The other {shared} tokens are identical in every product.
      </Text>
    </Stack>
  );
}

function ScopeReport({ set }: { set: readonly ModifierName[] }) {
  const scope = useThemeScope();
  return (
    <ul className={styles.scopeTags}>
      {modifierNames.map((name) => (
        <li key={name} className={styles.scopeTag} data-set={set.includes(name) || undefined}>
          <span className={styles.muted}>{name}</span> <strong>{scope[name]}</strong>{' '}
          <span className={styles.scopeSource}>{set.includes(name) ? 'set here' : 'inherited'}</span>
        </li>
      ))}
    </ul>
  );
}

function NestSample() {
  return (
    <Inline gap="small">
      <Button appearance="primary" size="small">
        Approve
      </Button>
      <Button size="small">Later</Button>
      <Badge tone="brand">Brand</Badge>
    </Inline>
  );
}

const nestingSnippet = `<ThemeScope theme="dark" product="provider">
  <ThemeScope theme="light">
    <ThemeScope density="compact">`;

function NestedScopes() {
  return (
    <div className={styles.nesting}>
      <ScrollRegion as="pre" className={styles.code} data-theme="dark" aria-label="Nested scope markup">
        <code>{nestingSnippet}</code>
      </ScrollRegion>
      <ThemeScope theme="dark" product="provider" className={styles.nest}>
        <ScopeReport set={['theme', 'product']} />
        <NestSample />
        <ThemeScope theme="light" className={styles.nest}>
          <ScopeReport set={['theme']} />
          <NestSample />
          <ThemeScope density="compact" className={styles.nest}>
            <ScopeReport set={['density']} />
            <NestSample />
          </ThemeScope>
        </ThemeScope>
      </ThemeScope>
    </div>
  );
}

function DensityTable() {
  const rows = densityTokens();
  return (
    <div className={styles.tableBlock}>
      <p id="density-caption" className={styles.tableCaption}>
        What compact density changes
      </p>
      <ScrollRegion aria-labelledby="density-caption">
        <table className={`${styles.table} ${styles.densityTable}`} aria-labelledby="density-caption">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Comfortable</th>
              <th scope="col">Compact</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const change = row.comfortablePx && row.compactPx !== undefined ? (row.compactPx - row.comfortablePx) / row.comfortablePx : 0;
              return (
                <tr key={row.record.path}>
                  <th scope="row">
                    <code>{row.record.path}</code>
                  </th>
                  <td className={styles.number}>{row.comfortablePx === undefined ? row.comfortable : `${row.comfortablePx}px`}</td>
                  <td className={styles.number}>{row.compactPx === undefined ? row.compact : `${row.compactPx}px`}</td>
                  <td>
                    <span className={styles.change}>
                      <span className={styles.meter} aria-hidden="true">
                        <span style={{ inlineSize: '100%' }} />
                        <span style={{ inlineSize: `${Math.round((1 + change) * 100)}%` }} />
                      </span>
                      <span className={styles.number}>{`${change < 0 ? '−' : ''}${Math.abs(Math.round(change * 100))}%`}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollRegion>
      <Text variant="bodySmall" tone="muted">
        Pixels at the default 16px text size. Every value is in rem, so all of them scale with the reader’s text setting.
      </Text>
    </div>
  );
}

function ProductsContent() {
  return (
    <Stack gap="extraExtraLarge">
      <DocSection id="modifiers" title="Three independent modifiers">
        <Prose>
          <p>
            The DTCG resolver describes conditional values with <em>modifiers</em>: named axes whose contexts add or
            replace tokens. Design System Lab has three. Their product, {permutationCount} permutations, is resolved at build time
            from one set of source files.
          </p>
          <ScrollRegion aria-labelledby="modifiers-caption">
            <table>
              <caption id="modifiers-caption">Modifiers, contexts and what each changes</caption>
              <thead>
                <tr>
                  <th scope="col">Modifier</th>
                  <th scope="col">Contexts</th>
                  <th scope="col">Changes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <code>theme</code>
                  </th>
                  <td>{themeNames.join(', ')}</td>
                  <td>Every color role. Contexts must define the same tokens, so a theme can never be incomplete.</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code>product</code>
                  </th>
                  <td>{productNames.map((name) => productProfiles[name].name).join(', ')}</td>
                  <td>Brand roles, typefaces and shape only. Contexts may only override existing tokens, so a typo fails the build.</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code>density</code>
                  </th>
                  <td>{densityNames.map((name) => densityLabels[name]).join(', ')}</td>
                  <td>Control heights, control padding and the spacing scale.</td>
                </tr>
              </tbody>
            </table>
          </ScrollRegion>
        </Prose>
        <ProductCards />
      </DocSection>

      <DocSection id="composer" title="Compose a mode">
        <Prose>
          <p>
            Pick one context per modifier to land on one of the {permutationCount} permutations. The preview is a single
            ThemeScope; the table lists what a few tokens resolve to here and the selector each one was declared under.
            It starts from this site’s own settings: the Design System Lab profile, comfortable density and the theme in
            effect.
          </p>
        </Prose>
        <ModeComposer />
      </DocSection>

      <DocSection id="overrides" title="What a product changes">
        <Prose>
          <p>
            A product file may only re-point tokens that already exist, so the full difference between products fits in
            one table. It is computed from the token manifest, not maintained by hand.
          </p>
        </Prose>
        <ProductDiff />
      </DocSection>

      <DocSection id="inheritance" title="Nested scopes">
        <Prose>
          <p>
            A scope sets what it changes and inherits the rest from the nearest scope above it, not from the page. Each
            level below reports the context it received and where each value came from.
          </p>
        </Prose>
        <NestedScopes />
      </DocSection>

      <DocSection id="emission" title="Dependency-minimal CSS">
        <Prose>
          <p>
            A custom property’s <code>var()</code> is substituted on the element where it is declared, and descendants
            inherit the result. So a component token that aliases a themed role must be declared again wherever the theme
            changes, or it keeps the old color. The pipeline compares every token’s resolved value across all{' '}
            {permutationCount} permutations and declares it under exactly the modifiers it depends on, directly or through
            aliases:
          </p>
        </Prose>
        <ScrollRegion aria-label="Tokens by dependency">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Depends on</th>
                <th scope="col">Tokens</th>
                <th scope="col">Emitted under</th>
              </tr>
            </thead>
            <tbody>
              {dependencyGroups().map(([key, count]) => (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td>{count}</td>
                  <td>
                    <code>{key === 'none' ? ':root' : key.split(' × ').map((name) => `[data-${name}]`).join('')}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <TokenInspector />
        <Note title="Why scopes set every attribute">
          <p>
            A token that depends on theme and product is declared under <code>[data-theme][data-product]</code>. A region
            that sets only <code>data-theme</code> would not match, and would show the page’s brand in the wrong theme.{' '}
            <Link href="/components/theme-scope">ThemeScope</Link> always writes all {modifierNames.length} attributes,
            filling the ones you omit from the nearest parent scope.
          </p>
        </Note>
      </DocSection>

      <DocSection id="matrix" title="Products × themes">
        <Prose>
          <p>The same component tree in all six product and theme combinations. Nothing here is styled per product.</p>
        </Prose>
        <Grid minColumnWidth="medium" gap="medium">
          {productNames.flatMap((product) =>
            themeNames.map((theme) => (
              <ThemeScope
                key={`${product}-${theme}`}
                as="section"
                theme={theme}
                product={product}
                density={modifierDefaults.density}
                className={styles.cell}
                aria-label={`${productProfiles[product].name}, ${theme} theme`}
              >
                <Stack gap="small">
                  <Text variant="caption" tone="muted">
                    {productProfiles[product].name} · {theme}
                  </Text>
                  <Specimen heading="Pending approvals" />
                </Stack>
              </ThemeScope>
            )),
          )}
        </Grid>
      </DocSection>

      <DocSection id="density" title="Density">
        <Prose>
          <p>
            Compact density shortens controls and steps the spacing scale down by one. Layout components read the
            semantic spacing tokens, so every Stack, Grid and Card tightens without a prop change. The compact small control
            is 28px, above the 24px minimum target size in WCAG 2.2.
          </p>
        </Prose>
        <Grid minColumnWidth="medium" gap="medium">
          {densityNames.map((density) => (
            <ThemeScope key={density} as="section" density={density} className={styles.cell} aria-label={`${densityLabels[density]} density`}>
              <Stack gap="medium">
                <Text variant="caption" tone="muted">
                  {densityLabels[density]}
                </Text>
                <Field label="Request number">{(control) => <Input {...control} defaultValue="R-2041" />}</Field>
                <Checkbox label="Mark as reviewed" />
                <Inline gap="small">
                  <Button appearance="primary">Save</Button>
                  <Button>Cancel</Button>
                </Inline>
              </Stack>
            </ThemeScope>
          ))}
        </Grid>
        <DensityTable />
      </DocSection>

      <DocSection id="adding" title="Adding a product">
        <Prose>
          <p>
            A product is a reviewed file drop. Nothing in a component changes, and the tests that already exist cover the
            new product as soon as it is registered.
          </p>
        </Prose>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepTitle}>Generate the theme</span>
            <Text variant="bodySmall" tone="muted">
              In the <Link href="/foundations/theme-studio">theme studio</Link>, choose a brand color, an id and a shape.
              Every brand pair must pass WCAG 2 AA in both themes before you continue.
            </Text>
          </li>
          <li className={styles.step}>
            <span className={styles.stepTitle}>Add the token sources</span>
            <Text variant="bodySmall" tone="muted">
              Merge the ramp into <code>reference.modes.tokens.json</code>, the roles into <code>brands.light.tokens.json</code>{' '}
              and <code>brands.dark.tokens.json</code>, and add <code>product.&lt;id&gt;.tokens.json</code>. The product
              inherits the system’s typefaces. To change them, add the families to <code>reference.modes.tokens.json</code>,
              import their font files in <code>styles/index.css</code> and set <code>typeface.display</code> and{' '}
              <code>typeface.text</code> in the product file.
            </Text>
          </li>
          <li className={styles.step}>
            <span className={styles.stepTitle}>Register the context</span>
            <Text variant="bodySmall" tone="muted">
              Add the id to the product modifier’s contexts in <code>system-lab.resolver.json</code>. The modifier is marked{' '}
              <code>overrides</code>, so a misspelled token path fails the build.
            </Text>
          </li>
          <li className={styles.step}>
            <span className={styles.stepTitle}>Describe the product</span>
            <Text variant="bodySmall" tone="muted">
              Add its profile to <code>src/domain/system/products.ts</code>. The record is keyed by the generated{' '}
              <code>ProductName</code> type, so type checking fails until it exists.
            </Text>
          </li>
          <li className={styles.step}>
            <span className={styles.stepTitle}>Build and verify</span>
            <Text variant="bodySmall" tone="muted">
              <code>npm run tokens</code> regenerates CSS, types and the manifest. <code>npm test</code> runs the contrast
              suite for the new product in both themes, and the product cards and mode composer on this page offer it
              immediately.
            </Text>
          </li>
        </ol>
      </DocSection>

      <DocSection id="source" title="Source">
        <SourceList
          sources={[
            { path: 'src/design-system/tokens/source/system-lab.resolver.json', note: 'Modifiers and resolution order' },
            { path: 'src/design-system/tokens/source/product.provider.tokens.json', note: 'A whole product in about 50 lines' },
            { path: 'src/design-system/tokens/source/brands.light.tokens.json', note: 'Brand roles per theme' },
            { path: 'src/design-system/tokens/source/density.compact.tokens.json', note: 'Compact density' },
            { path: 'scripts/tokens/pipeline.mjs', note: 'Permutations and dependency-minimal emission' },
            { path: 'src/design-system/layout/ThemeScope.tsx', note: 'Complete scopes with inheritance' },
            { path: 'src/content/foundations/modes.ts', note: 'Resolving and comparing permutations from the manifest' },
          ]}
        />
      </DocSection>
    </Stack>
  );
}

export const productsTopic = {
  id: 'products',
  sections: [
    { id: 'modifiers', label: 'Modifiers' },
    { id: 'composer', label: 'Compose a mode' },
    { id: 'overrides', label: 'What a product changes' },
    { id: 'inheritance', label: 'Nested scopes' },
    { id: 'emission', label: 'Dependency-minimal CSS' },
    { id: 'matrix', label: 'Products × themes' },
    { id: 'density', label: 'Density' },
    { id: 'adding', label: 'Adding a product' },
    { id: 'source', label: 'Source' },
  ],
  Content: ProductsContent,
} as const;
