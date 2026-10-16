import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Grid, Inline, ScrollRegion, Stack } from '@/design-system/layout';
import { Button, Heading, Link, Switch, Text } from '@/design-system/primitives';
import type { TokenPath } from '@/design-system/tokens';
import { PwButton } from './PwButton';
import styles from './decisions.module.css';

interface Measured {
  primary: CSSStyleDeclaration;
  disabled: CSSStyleDeclaration;
}

// Colors are read from the token's custom property: the button transitions its colors, so a computed color can lag a theme switch.
const token = (style: CSSStyleDeclaration, path: TokenPath) => style.getPropertyValue(`--${path.replaceAll('.', '-')}`).trim();

const mapping: readonly { legacy: string; token: string; here: (measured: Measured) => string; result: string }[] = [
  { legacy: 'background: #0b5cab', token: 'button.primary.background', here: (m) => token(m.primary, 'button.primary.background'), result: 'Maps. The value now follows the product and theme.' },
  { legacy: 'color: #fff', token: 'button.primary.foreground', here: (m) => token(m.primary, 'button.primary.foreground'), result: 'Maps.' },
  { legacy: 'border-radius: 3px', token: 'button.radius', here: (m) => m.primary.borderTopLeftRadius, result: 'Changes on purpose: each product sets its own radius.' },
  { legacy: 'height: 26px (small)', token: 'button.height.small', here: (m) => m.primary.minBlockSize, result: 'Changes on purpose: a larger target, set by density.' },
  {
    legacy: 'font: 600 12px Arial (small)',
    token: 'typography.control and button.font-size.small',
    here: (m) => `${m.primary.fontWeight} ${m.primary.fontSize} ${m.primary.fontFamily.split(',')[0] ?? ''}, ${m.primary.textTransform}`,
    result: 'Changes on purpose: the shared control type is uppercase.',
  },
  {
    legacy: 'box-shadow: 0 0 0 2px #7fb2e5 on :focus',
    token: 'focus.width and focus.ring',
    here: (m) => `${m.primary.getPropertyValue('--focus-width').trim()} outline, ${m.primary.getPropertyValue('--focus-ring').trim()}`,
    result: 'Changes on purpose: an outline on :focus-visible, tested at 3:1 against every surface.',
  },
  { legacy: 'background: #e0e0e0 when disabled', token: 'button.disabled.background', here: (m) => token(m.disabled, 'button.disabled.background'), result: 'Maps.' },
];

/** The provider workspace's raw values beside the tokens that replace them, with what those tokens compute to on this page right now. */
export function TokenMapping() {
  const primary = useRef<HTMLButtonElement>(null);
  const disabled = useRef<HTMLButtonElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);

  useEffect(() => {
    const measure = () => {
      if (primary.current && disabled.current) setMeasured({ primary: getComputedStyle(primary.current), disabled: getComputedStyle(disabled.current) });
    };
    measure();
    // The header's theme setting changes data-theme on the root element.
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <Stack gap="small">
      <Inline gap="small" align="center">
        <Text as="span" variant="caption" tone="muted">
          Measured from
        </Text>
        <Button ref={primary} appearance="primary" size="small">
          Save
        </Button>
        <Button ref={disabled} size="small" disabled>
          Export
        </Button>
      </Inline>
      <ScrollRegion axis="inline" aria-label="Raw values and the tokens that replace them">
        <table className={styles.table}>
          <caption>Raw values and the tokens that replace them</caption>
          <thead>
            <tr>
              <th scope="col">Provider workspace CSS</th>
              <th scope="col">Token</th>
              <th scope="col">On this page now</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((row) => (
              <tr key={row.legacy}>
                <th scope="row">
                  <code>{row.legacy}</code>
                </th>
                <td>
                  <code>{row.token}</code>
                </td>
                <td>{measured ? row.here(measured) : '…'}</td>
                <td>{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </Stack>
  );
}

function CallSite({ code, children }: { code: string; children: ReactNode }) {
  return (
    <li className={styles.callSite}>
      <code>{code}</code>
      <div>{children}</div>
    </li>
  );
}

/** The same three call sites before and after replacement, with one shared saving state. */
export function WrapperBench() {
  const [saving, setSaving] = useState(false);
  const wrapped = useId();
  const replaced = useId();
  return (
    <Stack gap="medium">
      <Switch label="Saving" description="Puts both Save buttons into their in-progress state." checked={saving} onChange={(event) => setSaving(event.target.checked)} />
      <Grid columns={2} minColumnWidth="medium" gap="medium">
        <section aria-labelledby={wrapped}>
          <Stack gap="small">
            <Heading level={3} size="small" id={wrapped}>
              Unchanged call sites, through the wrapper
            </Heading>
            <ul className={styles.callSites}>
              <CallSite code='<PwButton kind="primary" busy={saving}>Save</PwButton>'>
                <PwButton kind="primary" busy={saving}>
                  Save
                </PwButton>
              </CallSite>
              <CallSite code="<PwButton small>Export</PwButton>">
                <PwButton small>Export</PwButton>
              </CallSite>
              <CallSite code='<PwButton kind="link" onClick={openHistory}>View history</PwButton>'>
                <PwButton kind="link">View history</PwButton>
              </CallSite>
            </ul>
          </Stack>
        </section>
        <section aria-labelledby={replaced}>
          <Stack gap="small">
            <Heading level={3} size="small" id={replaced}>
              Replaced, one screen at a time
            </Heading>
            <ul className={styles.callSites}>
              <CallSite code='<Button appearance="primary" type="submit" loading={saving}>Save</Button>'>
                <Button appearance="primary" type="submit" loading={saving}>
                  Save
                </Button>
              </CallSite>
              <CallSite code='<Button size="small">Export</Button>'>
                <Button size="small">Export</Button>
              </CallSite>
              <CallSite code='<Link href="/patterns/resource-detail">View history</Link>'>
                <Link href="/patterns/resource-detail">View history</Link>
              </CallSite>
            </ul>
          </Stack>
        </section>
      </Grid>
    </Stack>
  );
}
