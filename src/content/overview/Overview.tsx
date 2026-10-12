import { lazy, Suspense } from 'react';
import { Card } from '@/design-system/composites';
import { Grid, ScrollRegion, Stack } from '@/design-system/layout';
import { Heading, Icon, Link, Skeleton, Text } from '@/design-system/primitives';
import { tokenCounts } from '@/design-system/tokens';
import { catalog, entriesOfKind, productProfiles, summarizeCatalog, type ComponentLayer } from '@/domain/system';
import { DocSection, Note, Prose, SourceList } from '@/features/docs';
import { Horizon } from './Horizon';
import styles from './Overview.module.css';
import { PageLink } from './PageLink';

// Lazy: the demonstration reads the full token manifest, which the rest of this page does not need.
const DecisionDemo = lazy(() => import('./DecisionDemo').then((module) => ({ default: module.DecisionDemo })));

export const overviewSections = [
  { id: 'review', label: 'Review the work' },
  { id: 'about', label: 'About this project' },
  { id: 'decision-to-interface', label: 'From a design decision to a working interface' },
  { id: 'site', label: 'How this site is built' },
  { id: 'principles', label: 'Principles' },
  // The id predates the title; keeping it keeps existing #architecture links working.
  { id: 'architecture', label: 'Implementation architecture' },
  { id: 'contributing', label: 'Contributing' },
] as const;

export interface OverviewAuthor {
  name: string;
  portfolio: string;
  caseStudy: string;
  repository: string;
}

interface Stop {
  title: string;
  shows: string;
  link: { label: string; href: string };
}

/** The strongest evidence first; each stop is one destination with one sentence about what it demonstrates. */
const reviewPath: readonly Stop[] = [
  {
    title: 'Component Playground',
    shows: 'Edit Button’s token-backed props in a Controls table, watch a scoped preview respond, and copy the usage code generated from the same values.',
    link: { label: 'Open the Playground', href: '/playground?component=button' },
  },
  {
    title: 'Theme studio',
    shows: 'Generate a product theme from one brand color, check every brand role’s contrast in both themes, and export the token sources it produces.',
    link: { label: 'Open the Theme studio', href: '/foundations/theme-studio' },
  },
  {
    title: 'Form validation',
    shows: 'Submit the form empty, follow the error summary’s links to each field, and see where focus goes as components combine to recover.',
    link: { label: 'Try Form validation', href: '/patterns/form-validation' },
  },
];

const moreStops: readonly Stop[] = [
  {
    title: 'Token architecture',
    shows: 'Reference, semantic and component tiers, traced to the value your browser computes, with a dependency policy the build enforces.',
    link: { label: 'Token architecture', href: '/foundations/tokens' },
  },
  {
    title: 'Design decisions',
    shows: 'How a system is planned, shared across products, implemented and operated, with hypothetical examples labelled as such.',
    link: { label: 'Design decisions', href: '/decisions' },
  },
];

const componentNames = (layer: ComponentLayer) =>
  entriesOfKind('component')
    .filter((entry) => entry.layer === layer)
    .map((entry) => entry.name)
    .join(', ');

/** The page's actions, placed in the page header: the main one, then the source and the case study. */
export function OverviewActions({ author }: { author: OverviewAuthor }) {
  return (
    <>
      <Link href="/playground?component=button" variant="standalone" className={styles.primaryLink}>
        Explore Button <Icon name="arrowRight" />
      </Link>
      <Link href={author.repository} variant="standalone" className={styles.actionLink}>
        Source on GitHub <Icon name="externalLink" />
      </Link>
      <Link href={author.caseStudy} variant="standalone" className={styles.actionLink}>
        Case study <Icon name="externalLink" />
      </Link>
    </>
  );
}

export function OverviewContent({ author }: { author: OverviewAuthor }) {
  const summary = summarizeCatalog(catalog);
  const { harbor, meadow } = productProfiles;
  return (
    <Stack gap="extraExtraLarge">
      <DocSection id="review" title="Review the work">
        <Grid as="ol" minColumnWidth="small" gap="medium" aria-label="Suggested review path">
          {reviewPath.map((stop, index) => (
            <Card as="li" key={stop.title} padding="medium">
              <Stack gap="small">
                <Text as="span" variant="caption" tone="muted" aria-hidden="true" className={styles.stopNumber}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Heading level={3} size="small">
                  {stop.title}
                </Heading>
                <Text variant="bodySmall">{stop.shows}</Text>
                <PageLink href={stop.link.href}>{stop.link.label}</PageLink>
              </Stack>
            </Card>
          ))}
        </Grid>
        <ul className={styles.more} aria-label="More to review">
          {moreStops.map((stop) => (
            <li key={stop.title}>
              <PageLink href={stop.link.href}>{stop.link.label}</PageLink>
              <Text as="span" variant="bodySmall" tone="muted">
                {stop.shows}
              </Text>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="about" title="About this project">
        <Prose>
          <p>
            A design system connects shared design decisions with reusable components, documentation, and processes for
            maintaining them.
          </p>
          <p>
            Design System Lab is a small working design system. It implements design tokens in three tiers, layout
            primitives, components and interface patterns, with documentation generated from the same source. This
            website is built from it, so every page is also an example of the system in use.
          </p>
          <p>
            Foundations, Components, the Playground and Patterns show working implementation. The Design decisions section
            goes beyond what this project implements: it explores how to plan a system, share it across products,
            implement it and keep it healthy. Each example there is labelled as implemented here, a proposed approach, a
            hypothetical scenario or a conceptual sketch.
          </p>
          <p>What the system contains today:</p>
        </Prose>
        <Horizon
          readouts={[
            { label: 'Tokens', value: tokenCounts.total },
            { label: 'Components', value: summary.byKind.component },
            { label: 'Foundations', value: summary.byKind.foundation },
            { label: 'Patterns', value: summary.byKind.pattern },
          ]}
        />
      </DocSection>

      <DocSection id="decision-to-interface" title="From a design decision to a working interface">
        <Prose>
          <p>
            One real chain from this system: a named decision, the component that uses it, a pattern built from that
            component, and a product profile that restyles it. The values follow the Product, Theme and Density controls in
            the header.
          </p>
        </Prose>
        <Suspense fallback={<Skeleton shape="block" size="large" />}>
          <DecisionDemo />
        </Suspense>
      </DocSection>

      <DocSection id="site" title="How this site is built">
        <Prose>
          <p>
            Every page, including this one, is built from the components it documents and styled only with its tokens.
            This table maps things you can see on this page to the component that renders them and the documented
            decision that controls how they look.
          </p>
          <ScrollRegion axis="inline" aria-label="Elements of this page and where they come from">
            <table>
              <caption>Elements of this page and where they come from</caption>
              <thead>
                <tr>
                  <th scope="col">On this page</th>
                  <th scope="col">Built with</th>
                  <th scope="col">Controlled by</th>
                  <th scope="col">Inspect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">The page title and the introduction under it</th>
                  <td>PageHeader, which renders a level 1 Heading and lead Text</td>
                  <td>
                    Type roles <code>typography.heading-1</code> and <code>typography.lead</code>
                  </td>
                  <td>
                    <Link href="/components/page-header">PageHeader</Link>, <Link href="/foundations/typography">Typography</Link>
                  </td>
                </tr>
                <tr>
                  <th scope="row">The review path cards</th>
                  <td>
                    Card, placed in a Grid with <code>gap="medium"</code>
                  </td>
                  <td>
                    Gaps and card padding: <code>spacing.medium</code>. Corners: <code>card.radius</code>, which each product
                    sets.
                  </td>
                  <td>
                    <Link href="/components/card">Card</Link>, <Link href="/components/grid">Grid</Link>,{' '}
                    <Link href="/foundations/spacing">Spacing</Link>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Titles on the review path cards</th>
                  <td>Heading, level 3 at size small</td>
                  <td>
                    Type role <code>typography.heading-4</code>
                  </td>
                  <td>
                    <Link href="/components/heading">Heading</Link>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Underlined links</th>
                  <td>Link</td>
                  <td>
                    Text color <code>text.link</code>; underline <code>border.strong</code>
                  </td>
                  <td>
                    <Link href="/components/link">Link</Link>, <Link href="/foundations/color">Color</Link>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Save changes in the demonstration, and Explore Button at the top</th>
                  <td>Button; Explore Button is a Link drawn with Button’s primary tokens, because it navigates</td>
                  <td>
                    <code>button.primary.background</code>, which points to <code>action.primary.background</code>
                  </td>
                  <td>
                    <Link href="/components/button">Button</Link>, <Link href="/foundations/tokens">Token architecture</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollRegion>
        </Prose>
        <Note title="Try it">
          <p>
            Change the Product control above to see the same components use a different product profile. On small screens
            it is under Display.
          </p>
          <p>
            Harbor and Meadow are example product profiles for different product contexts. Harbor stands for{' '}
            {harbor.audience.charAt(0).toLowerCase() + harbor.audience.slice(1)} Meadow stands for{' '}
            {meadow.audience.charAt(0).toLowerCase() + meadow.audience.slice(1)} Switching profiles restyles this same site
            through its tokens: colors, typefaces and corner shapes change, while the name, logo and content stay. It does
            not open a separate application.
          </p>
        </Note>
        <Prose>
          <h3>Behind the scenes</h3>
          <ul>
            <li>
              The section navigation, the Components index and the resource directory demo all read one catalog (
              <code>src/domain/system/catalog.ts</code>), so the components listed are the ones the directory demo searches.
            </li>
            <li>Token tables, alias chains and contrast ratios are rendered from the generated token manifest.</li>
            <li>Props tables are typed against the components’ own props, and source panels load the real files, so the code shown is the code that runs.</li>
            <li>
              The Product, Theme and Density controls set attributes on the page. No component knows which one is active;
              the change happens in CSS custom properties.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection id="principles" title="Principles">
        <Prose>
          <p>The choices this project makes, and how its implementation follows them.</p>
          <ol>
            <li>
              <strong>Choices, not values.</strong> Visual props take named options backed by tokens, such as{' '}
              <code>size="large"</code>, <code>gap="medium"</code> or <code>elevation="low"</code>, instead of arbitrary
              CSS. Other props, such as <code>disabled</code>, <code>onClick</code> or a label, are ordinary component
              props.
            </li>
            <li>
              <strong>Purpose before appearance.</strong> Components read semantic roles named for what a value is for, such
              as <code>action.primary.background</code>, not for how it looks. A theme or product changes which value a
              role maps to, without rewriting component styles.
            </li>
            <li>
              <strong>Native first.</strong> Components start from the HTML element with the right built-in semantics and
              keyboard behavior: Button renders a <code>button</code>, Dialog a <code>dialog</code>, Switch a checkbox with
              the switch role, Disclosure <code>details</code>. The implementation supplies what those elements do not, such
              as label and error wiring in Field, focus restoration when Dialog closes and arrow-key movement in Tabs.
              Native elements still need correct labels, states and testing.
            </li>
            <li>
              <strong>Space-aware components.</strong> Layout responds to the space a component is given, not to the
              viewport: Grid fits as many columns as its container allows, Container creates named query containers, and
              EntryCard and ActivityList change layout at their own width. The same component can then be reused in a page
              column, a sidebar, a dialog or the Playground’s resizable frame.
            </li>
            <li>
              <strong>Product data and requests outside reusable components.</strong> Reusable components receive data
              through props and report changes through callbacks; they do not fetch data or read the URL. Requests,
              fixtures, URL state and demo controls live in this application’s features and content. Components still keep
              local interaction state, such as whether a Disclosure is open, and controlled props, such as RadioGroup’s{' '}
              <code>value</code>, let an application own that state when it needs to.
            </li>
            <li>
              <strong>Verified where it can be checked.</strong> The token build fails on a missing or circular reference,
              and lint fails on an import across a layer boundary or an unknown CSS variable. Unit tests check{' '}
              <Link href="/foundations/color#contrast">text and control color pairs for contrast</Link> in every product
              and theme. Browser tests scan pages with axe in both themes, check keyboard order and focus movement, and
              check reflow at 320 pixels. These checks catch many problems, not all; they are not a full accessibility audit
              or testing with assistive technology. <Link href={`${author.repository}/tree/main/e2e`}>See the browser tests</Link>{' '}
              and the <Link href={`${author.repository}/blob/main/docs/accessibility.md`}>accessibility notes</Link>.
            </li>
          </ol>
          <p>
            <Link href="/decisions/planning#principles">How these principles resolve competing priorities</Link>, and one
            traced from requirement to validation.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="architecture" title="Implementation architecture">
        <Prose>
          <p>
            How this application’s code is organized, and how dependency rules protect the reusable system from the site
            that documents it. It is one workable arrangement for a single repository, not a structure every design system
            needs.
          </p>
          <p>
            The first four implementation layers are the reusable design system, in <code>src/design-system</code>; they
            know nothing about this website. Of these, Layout, Primitives and Composites are also the component layers that
            classify components. The other four are this application, which consumes the system. Here, “domain” means
            knowledge about what this site documents, such as its catalog of entries and its changelog, rather than
            reusable interface code. Each layer may import only from the layers before it, and only through a public index.
          </p>
          <ScrollRegion axis="inline" aria-label="Implementation layers and what they may import">
            <table>
              <caption>Implementation layers and what they may import</caption>
              <thead>
                <tr>
                  <th scope="col">Implementation layer</th>
                  <th scope="col">Holds</th>
                  <th scope="col">May import</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.groupRow}>
                  <th scope="rowgroup" colSpan={3}>
                    Reusable design system
                  </th>
                </tr>
                <tr>
                  <th scope="row">Tokens</th>
                  <td>Reference, semantic and component tokens; prop vocabularies</td>
                  <td>Nothing</td>
                </tr>
                <tr>
                  <th scope="row">Layout</th>
                  <td>{componentNames('Layout')}</td>
                  <td>Tokens</td>
                </tr>
                <tr>
                  <th scope="row">Primitives</th>
                  <td>{componentNames('Primitive')}</td>
                  <td>Tokens, layout</td>
                </tr>
                <tr>
                  <th scope="row">Composites</th>
                  <td>{componentNames('Composite')}</td>
                  <td>Tokens, layout, primitives</td>
                </tr>
              </tbody>
              <tbody>
                <tr className={styles.groupRow}>
                  <th scope="rowgroup" colSpan={3}>
                    This application
                  </th>
                </tr>
                <tr>
                  <th scope="row">Domain</th>
                  <td>The catalog and changelog, the sharing comparison, EntryCard, ActivityList</td>
                  <td>Design system</td>
                </tr>
                <tr>
                  <th scope="row">Features</th>
                  <td>Docs rendering, directory filters, demo scenarios, playground engine, theming tools</td>
                  <td>Design system, domain</td>
                </tr>
                <tr>
                  <th scope="row">Content</th>
                  <td>Component docs, playground stories, foundations, patterns, fixtures, design decisions</td>
                  <td>Design system, domain, features</td>
                </tr>
                <tr>
                  <th scope="row">App</th>
                  <td>Routes, shell, theme provider, pages</td>
                  <td>Everything</td>
                </tr>
              </tbody>
            </table>
          </ScrollRegion>
          <p>
            The design system and domain may not import React Router. <code>scripts/architecture/check-boundaries.mjs</code>{' '}
            enforces the table, and <code>check-styles.mjs</code> enforces cascade layers and token-only CSS variables.
          </p>
        </Prose>
        <SourceList
          sources={[
            { path: 'scripts/architecture/boundaries.mjs', note: 'The layer rules' },
            { path: 'scripts/architecture/check-styles.mjs', note: 'Cascade layers and token usage' },
            { path: 'src/design-system/styles/index.css', note: 'Layer order' },
          ]}
        />
      </DocSection>

      <DocSection id="contributing" title="Contributing">
        <Prose>
          <ol>
            <li>
              Search the <Link href="/components">Components index</Link>. Extending an existing component is usually better
              than adding one.
            </li>
            <li>
              Propose a new component or a change by{' '}
              <Link href={`${author.repository}/issues/new`}>opening an issue in the GitHub repository</Link>. Describe the
              problem it solves and what you searched.
            </li>
            <li>
              Follow the <Link href={`${author.repository}/blob/main/docs/contributing.md`}>contributing guide</Link>. A
              visual decision that should change with theme, product or density needs a semantic or component token before
              any CSS; a fixed value may read a non-color reference scale directly.
            </li>
            <li>Add a catalog entry, a ComponentDoc and, for components with visual props, a Playground story.</li>
            <li>
              Run <code>npm run verify</code> before opening a pull request. It runs lint with the token, boundary and style
              checks, type checking, unit tests, the build and the end-to-end suite.
            </li>
          </ol>
          <p>
            The <Link href="/patterns/form-validation">Form validation pattern</Link> shows how a proposal form can validate
            input. It is a demonstration: submitting it sends nothing.
          </p>
        </Prose>
      </DocSection>
    </Stack>
  );
}
