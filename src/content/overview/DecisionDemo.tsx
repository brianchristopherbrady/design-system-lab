import { Fragment, useState, type ReactNode } from 'react';
import { Card, Disclosure, Field } from '@/design-system/composites';
import { Stack, ThemeScope, useThemeScope } from '@/design-system/layout';
import { Button, Heading, Select, Text, VisuallyHidden } from '@/design-system/primitives';
import { productNames, tokenValueIn, type ProductName, type TokenPath } from '@/design-system/tokens';
import { tokenManifest, type TokenRecord } from '@/design-system/tokens/manifest';
import { productProfiles } from '@/domain/system';
import { Prose, TokenChain, TokenSwatch, contextLabel } from '@/features/docs';
import styles from './Overview.module.css';
import { PageLink } from './PageLink';

function record(path: TokenPath): TokenRecord {
  const found = tokenManifest.find((candidate) => candidate.path === path);
  if (!found) throw new Error(`The token manifest has no ${path}.`);
  return found;
}

const decision = record('action.primary.background');
const buttonBackground = record('button.primary.background');
const buttonHeight = record('button.height.medium');

/** An alias chain read aloud as "a, which points to b, …". */
function Chain({ steps }: { steps: readonly string[] }) {
  return (
    <span>
      {steps.map((step, index) => (
        <Fragment key={step}>
          {index > 0 && (
            <>
              <span aria-hidden="true"> → </span>
              <VisuallyHidden>, which points to </VisuallyHidden>
            </>
          )}
          <code>{step}</code>
        </Fragment>
      ))}
    </span>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <Card as="li" padding="medium">
      <Stack gap="small">
        <Text as="span" variant="caption" tone="muted" aria-hidden="true" className={styles.stopNumber}>
          {String(number).padStart(2, '0')}
        </Text>
        <Heading level={3} size="small">
          {title}
        </Heading>
        {children}
      </Stack>
    </Card>
  );
}

/**
 * One real chain, read from the token manifest for the site's theme and a product profile chosen
 * here: a semantic decision, the Button token that aliases it, and the live Button that paints it.
 * The profile scopes only this demonstration.
 */
export function DecisionDemo() {
  const site = useThemeScope();
  const [product, setProduct] = useState<ProductName>(site.product);
  const [presses, setPresses] = useState(0);
  const scope = { ...site, product };
  const value = tokenValueIn(decision, scope);
  const background = tokenValueIn(buttonBackground, scope);
  const height = tokenValueIn(buttonHeight, scope);

  return (
    <div className={styles.demo}>
      <Field label="Product profile" description="Applies only to this demonstration. The rest of the site keeps its own profile.">
        {(control) => (
          <Select {...control} value={product} onChange={(event) => setProduct(event.target.value as ProductName)}>
            {productNames.map((name) => (
              <option key={name} value={name}>
                {productProfiles[name].name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Text variant="bodySmall" tone="muted">
        Values below are read from the token manifest for {contextLabel(scope)}.
      </Text>
      <Stack as="ol" gap="medium" aria-label="From a design decision to a working interface">
        <Step number={1} title="A design decision sets the primary action’s color">
          <Text variant="bodySmall">
            A semantic token records what a color is for, here the background of the main action on a screen, rather
            than which color it is. Each theme and product maps it to a value.
          </Text>
          <dl className={styles.facts}>
            <div>
              <dt>Current value</dt>
              <dd className={styles.value}>
                <TokenSwatch type="color" value={value.resolved} />
                <code>{value.resolved}</code>
              </dd>
            </div>
            <div>
              <dt>Semantic token</dt>
              <dd>
                <Chain steps={value.chain} />
              </dd>
            </div>
          </dl>
        </Step>

        <Step number={2} title="Button reads that decision">
          <Text variant="bodySmall">
            Button’s stylesheet names no color. Its primary appearance reads Button’s own component token, which points
            to the decision above. Its height reads a control size that the Density setting changes.
          </Text>
          <ThemeScope product={product} className={styles.specimen}>
            <Button appearance="primary" onClick={() => setPresses((count) => count + 1)}>
              Save changes
            </Button>
            <Text variant="bodySmall" tone="muted" role="status">
              {presses === 0 ? 'Not pressed yet.' : `Pressed ${presses} ${presses === 1 ? 'time' : 'times'}.`}
            </Text>
          </ThemeScope>
          <dl className={styles.facts}>
            <div>
              <dt>Background</dt>
              <dd>
                <Chain steps={background.chain} />
              </dd>
            </div>
            <div>
              <dt>Height</dt>
              <dd>
                <code>{height.resolved}</code> from <Chain steps={height.chain} />
              </dd>
            </div>
          </dl>
          <ul className={styles.links}>
            <li>
              <PageLink href="/components/button">Read the Button documentation</PageLink>
            </li>
            <li>
              <PageLink href="/playground?component=button">Open the Button Playground</PageLink>
            </li>
          </ul>
        </Step>

        <Step number={3} title="A pattern combines Button with fields, validation and focus">
          <Text variant="bodySmall">
            The Form validation pattern uses this Button to submit a form built from Field, Input, Select, Checkbox and
            Alert. Submitting with errors moves focus to a summary that links to each field, and the messages update as
            fields are corrected.
          </Text>
          <PageLink href="/patterns/form-validation">Try the Form validation pattern</PageLink>
        </Step>

        <Step number={4} title="A product profile changes the presentation, not the behavior">
          <Text variant="bodySmall">
            Choose another product profile at the top of this demonstration. The decision maps to a different value in
            each product, while Button’s markup, keyboard behavior and accessible name stay the same. Press the button
            first: the count survives the switch, because only styles change. The rest of the site keeps its own profile.
          </Text>
          <Prose>
            <table>
              <caption>The primary action’s background in each product, {scope.theme} theme</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {productNames.map((name) => {
                  const current = name === scope.product;
                  const resolved = tokenValueIn(decision, { ...scope, product: name }).resolved;
                  return (
                    <tr key={name} aria-current={current || undefined} className={current ? styles.currentRow : undefined}>
                      <th scope="row">
                        {productProfiles[name].name}
                        {current && <span> (current)</span>}
                      </th>
                      <td>
                        <span className={styles.value}>
                          <TokenSwatch type="color" value={resolved} />
                          <code>{resolved}</code>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Prose>
        </Step>
      </Stack>
      <ThemeScope product={product}>
        <Disclosure summary="Full trace, including the value this browser computes" lazy>
          <TokenChain path="button.primary.background" />
        </Disclosure>
      </ThemeScope>
    </div>
  );
}
