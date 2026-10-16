import { useEffect, useRef, useState } from 'react';
import { useThemeScope } from '@/design-system/layout';
import { Icon } from '@/design-system/primitives';
import { tokenSelectorIn, tokenValueIn, type ModifierInput, type TokenPath } from '@/design-system/tokens';
import { tokenManifest, type TokenRecord } from '@/design-system/tokens/manifest';
import { densityLabels, productProfiles } from '@/domain/system';
import styles from './TokenExplorer.module.css';

let index: Map<string, TokenRecord> | undefined;
// Built on first use rather than at import, so pages that never trace a token do not pull in the manifest.
const byPath = () => (index ??= new Map(tokenManifest.map((record) => [record.path, record])));

export function TokenSwatch({ type, value }: { type: string; value: string }) {
  if (type !== 'color') return null;
  return <span className={styles.swatch} style={{ backgroundColor: value }} aria-hidden="true" />;
}

/** "Provider workspace · dark · compact": the modifiers a value was resolved for. */
export function contextLabel(input: ModifierInput) {
  return `${productProfiles[input.product].name} · ${input.theme} · ${densityLabels[input.density].toLowerCase()}`;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

type Reading =
  | { status: 'pending' }
  | { status: 'match' | 'differs'; computed: string }
  | { status: 'unavailable'; reason: string };

/**
 * What this browser substitutes for the token on an element in the current scope. A hidden probe
 * inherits the same custom properties as its neighbours, so the reading reflects the real cascade.
 */
function ComputedReading({ record, expected }: { record: TokenRecord; expected: string }) {
  const probe = useRef<HTMLSpanElement>(null);
  const { theme, product, density } = useThemeScope();
  const [reading, setReading] = useState<Reading>({ status: 'pending' });

  useEffect(() => {
    const node = probe.current;
    if (!node) return;
    if (record.type === 'typography') {
      setReading({ status: 'unavailable', reason: `Composite: the build writes it as separate properties such as ${record.cssVar}-font-size, so there is no single computed value.` });
      return;
    }
    const computed = getComputedStyle(node).getPropertyValue(record.cssVar).trim();
    if (!computed) {
      setReading({ status: 'unavailable', reason: 'No element in this context declares it.' });
      return;
    }
    let same = normalize(computed) === normalize(expected);
    if (!same && record.type === 'color') {
      // Browsers serialize colors in their own format; compare what each value paints.
      node.style.color = computed;
      const painted = getComputedStyle(node).color;
      node.style.color = expected;
      same = painted === getComputedStyle(node).color;
      node.style.color = '';
    }
    setReading({ status: same ? 'match' : 'differs', computed });
  }, [record, expected, theme, product, density]);

  return (
    <>
      <span ref={probe} hidden />
      {reading.status === 'pending' && <span className={styles.muted}>Reading…</span>}
      {reading.status === 'unavailable' && <span className={styles.muted}>Not inspectable. {reading.reason}</span>}
      {(reading.status === 'match' || reading.status === 'differs') && (
        <span className={styles.resolved}>
          <TokenSwatch type={record.type} value={reading.computed} />
          <code className={styles.value}>{reading.computed}</code>
          <span className={reading.status === 'match' ? styles.match : styles.mismatch}>
            <Icon name={reading.status === 'match' ? 'check' : 'warning'} />
            {reading.status === 'match' ? 'matches the build' : 'differs from the build'}
          </span>
        </span>
      )}
    </>
  );
}

function ContextTable({ record, scope }: { record: TokenRecord; scope: ModifierInput }) {
  const rows = record.variants ?? (['light', 'dark'] as const).map((theme) => ({ input: { theme }, ...record.values[theme] }));
  const current = tokenSelectorIn(record, scope);
  return (
    <table className={styles.contexts}>
      <caption className={styles.contextsCaption}>Every context it is declared for</caption>
      <thead>
        <tr>
          <th scope="col">Selector</th>
          <th scope="col">Resolves to</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const selector = tokenSelectorIn(record, { ...scope, ...row.input });
          const isCurrent = selector === current;
          return (
            <tr key={selector} aria-current={isCurrent || undefined} className={isCurrent ? styles.currentRow : undefined}>
              <th scope="row">
                <code>{selector}</code>
                {isCurrent && <span className={styles.currentLabel}> this context</span>}
              </th>
              <td>
                <span className={styles.resolved}>
                  <TokenSwatch type={record.type} value={row.resolved} />
                  <code>{row.resolved}</code>
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Follows a token through its aliases for the theme, product and density in effect where it is
 * rendered, and reads it three ways: as authored, as resolved by the token build, and as computed
 * by this browser.
 */
export function TokenChain({ path }: { path: TokenPath }) {
  const scope = useThemeScope();
  const record = byPath().get(path);
  if (!record) return <p>Unknown token {path}</p>;
  const value = tokenValueIn(record, scope);

  return (
    <div className={styles.trace}>
      <p className={styles.traceContext}>
        <span className={styles.muted}>Context</span> {contextLabel(scope)}
        <span className={styles.muted}>
          {' '}
          · {record.dependsOn.length ? `depends on ${record.dependsOn.join(' × ')}` : 'the same in every context'}
        </span>
      </p>
      <ol className={styles.chainList} aria-label={`${path} in this context`}>
        {value.chain.map((step) => {
          const stepRecord = byPath().get(step);
          const source = stepRecord ? (tokenValueIn(stepRecord, scope).source ?? stepRecord.source) : undefined;
          return (
            <li key={step} className={styles.chainStep}>
              <code>{step}</code>
              <span className={styles.tier}>
                {stepRecord?.tier}
                {source && ` · ${source}`}
              </span>
            </li>
          );
        })}
        <li className={styles.chainStep}>
          <TokenSwatch type={record.type} value={value.resolved} />
          <code>{value.resolved}</code>
        </li>
      </ol>
      <dl className={styles.readings}>
        <div>
          <dt>Authored</dt>
          <dd>
            <code className={styles.value}>{value.authored}</code>
          </dd>
        </div>
        <div>
          <dt>Resolved by the token build</dt>
          <dd>
            <span className={styles.resolved}>
              <TokenSwatch type={record.type} value={value.resolved} />
              <code className={styles.value}>{value.resolved}</code>
            </span>
          </dd>
        </div>
        <div>
          <dt>Computed by this browser</dt>
          <dd>
            <ComputedReading record={record} expected={value.resolved} />
          </dd>
        </div>
      </dl>
      {record.dependsOn.length > 0 && <ContextTable record={record} scope={scope} />}
    </div>
  );
}
