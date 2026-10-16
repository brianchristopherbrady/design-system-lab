import type { ReactNode } from 'react';
import { Disclosure } from '@/design-system/composites';
import { Inline, Stack } from '@/design-system/layout';
import { Badge, Icon, Link } from '@/design-system/primitives';
import { MaturityBadge, type CatalogEntry } from '@/domain/system';
import { ApiTable } from './ApiTable';
import { DocSection, Prose } from './DocSection';
import type { ComponentDoc, PropTokenTrace } from './docTypes';
import { SourceList } from './SourceList';
import { TokenChain } from './TokenChain';
import { TokensRead } from './TokensRead';
import styles from './ComponentReference.module.css';

/** What a reader will find in a source file, from its kind. */
export function sourceNote(path: string) {
  if (path.endsWith('.css')) return 'Styles: the tokens each class reads';
  if (path.endsWith('.tokens.json')) return 'Token source: the component tokens and what they alias';
  if (/\.test\.tsx?$/.test(path)) return 'Tests: the behavior this component is checked for';
  if (path.endsWith('.ts')) return 'Logic and types shared with the implementation';
  return 'Implementation and public types';
}

export const componentSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'examples', label: 'Examples' },
  { id: 'api', label: 'Props' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'behavior', label: 'Behavior and accessibility' },
  { id: 'guidance', label: 'Guidance' },
  { id: 'source', label: 'Source' },
] as const;

function BulletList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function TraceItem({ trace }: { trace: PropTokenTrace }) {
  return (
    <li>
      <Disclosure
        lazy
        className={styles.trace}
        summary={
          <>
            <code>{trace.prop}</code> <Icon name="arrowRight" /> <code>{trace.property}</code> <Icon name="arrowRight" />{' '}
            <code>{trace.token}</code>
            {trace.readBy && <span className={styles.muted}> read by the {trace.readBy} component it renders</span>}
          </>
        }
      >
        <TokenChain path={trace.token} />
      </Disclosure>
    </li>
  );
}

export interface ComponentReferenceProps {
  entry: CatalogEntry;
  doc: ComponentDoc;
  /** Link to the playground for this component, when it has a story. */
  playgroundHref?: string;
}

/** Renders the reference for one component from its catalog entry and typed ComponentDoc. */
export function ComponentReference({ entry, doc, playgroundHref }: ComponentReferenceProps) {
  return (
    <Stack gap="extraExtraLarge">
      <DocSection id="overview" title="Overview">
        <Inline gap="small">
          <Badge tone="info" appearance="outlined">
            {entry.layer}
          </Badge>
          <MaturityBadge maturity={entry.maturity} />
          {playgroundHref && (
            <Link href={playgroundHref} variant="standalone" className={styles.playgroundLink}>
              Open in playground <Icon name="arrowRight" />
            </Link>
          )}
        </Inline>
        <Prose>
          <p>{doc.purpose}</p>
        </Prose>
        <div className={styles.columns}>
          <Prose>
            <h3>Use it for</h3>
            <BulletList items={doc.whenToUse} />
          </Prose>
          <Prose>
            <h3>Not for</h3>
            <BulletList items={doc.whenNotToUse} />
          </Prose>
        </div>
      </DocSection>

      <DocSection id="examples" title="Examples">
        <doc.Example />
      </DocSection>

      <DocSection id="api" title="Props">
        {doc.props.length > 0 && <ApiTable caption={`${entry.name} props`} props={doc.props} />}
        <Prose>
          <p>{doc.nativeProps}</p>
          {doc.precedence.length > 0 && (
            <>
              <h3>Defaults, combinations and precedence</h3>
              <BulletList items={doc.precedence} />
            </>
          )}
        </Prose>
      </DocSection>

      <DocSection id="tokens" title="Tokens">
        {doc.propTokens.length > 0 && (
          <>
            <Prose>
              <h3>From prop to token</h3>
              <p>
                Each row follows a prop value to the CSS property it sets and the first token that property reads. Open a
                row to follow the alias chain for the product, theme and density this page is rendered in, and to compare
                three readings: the value as authored in the token file, the value the token build resolved, and the value
                this browser computes on an element in the same context.
              </p>
            </Prose>
            <ul className={styles.traces}>
              {doc.propTokens.map((trace) => (
                <TraceItem key={`${trace.prop}:${trace.property}`} trace={trace} />
              ))}
            </ul>
          </>
        )}
        <Prose>
          <h3>Every token read</h3>
          <p>
            Derived from this component’s own source files, not listed by hand: <code>var()</code> reads in its stylesheet
            and the prop vocabularies its code calls. Values are for the context this page is rendered in; change the
            theme in the header to compare.
          </p>
        </Prose>
        <TokensRead sourcePaths={doc.sourcePaths} />
      </DocSection>

      <DocSection id="behavior" title="Behavior and accessibility">
        <div className={styles.columns}>
          <Prose>
            <h3>States</h3>
            <BulletList items={doc.states} />
          </Prose>
          <Prose>
            <h3>Accessibility and keyboard</h3>
            <BulletList items={doc.accessibility} />
          </Prose>
        </div>
        <Prose>
          <h3>Responsive behavior</h3>
          <BulletList items={doc.responsive} />
        </Prose>
      </DocSection>

      <DocSection id="guidance" title="Guidance">
        <div className={styles.columns}>
          <Prose>
            <h3>Composition</h3>
            <BulletList items={doc.composition} />
          </Prose>
          <Prose>
            <h3>Common mistakes</h3>
            <BulletList items={doc.mistakes} />
          </Prose>
        </div>
        <Prose>
          <h3>Tradeoffs</h3>
          <BulletList items={doc.tradeoffs} />
        </Prose>
      </DocSection>

      <DocSection id="source" title="Source">
        <SourceList
          sources={doc.sourcePaths.map((path) => ({
            path,
            note: sourceNote(path),
          }))}
        />
      </DocSection>
    </Stack>
  );
}
