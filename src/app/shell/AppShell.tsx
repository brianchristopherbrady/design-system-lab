import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Container, Inline } from '@/design-system/layout';
import { Button, Icon, Link, Text } from '@/design-system/primitives';
import { componentLayers, entriesOfKind, type CatalogEntry } from '@/domain/system';
import { appName, author, paths, sections } from '../paths';
import styles from './AppShell.module.css';
import { Lens } from './Lens';
import { ThemeSelect } from './ThemeSelect';

interface NavGroup {
  heading?: string;
  entries: CatalogEntry[];
}

interface SectionNav {
  label: string;
  href: (id: string) => string;
  groups: NavGroup[];
}

const components = entriesOfKind('component');

const sectionNavs: Record<string, SectionNav> = {
  decisions: { label: 'Design decisions', href: paths.decision, groups: [{ entries: entriesOfKind('decision') }] },
  foundations: { label: 'Foundations', href: paths.foundation, groups: [{ entries: entriesOfKind('foundation') }] },
  components: {
    label: 'Components',
    href: paths.component,
    groups: componentLayers
      .map((layer) => ({ heading: layer, entries: components.filter((entry) => entry.layer === layer) }))
      .filter((group) => group.entries.length > 0),
  },
  patterns: { label: 'Patterns', href: paths.pattern, groups: [{ entries: entriesOfKind('pattern') }] },
};

function isCurrentSection(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Page frame: skip link, banner with the five sections and the theme choice, contextual
 * section navigation built from the catalog, main content and footer. The single viewport
 * media query lives here because only the shell responds to the window; components respond
 * to their containers.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const sectionKey = pathname.split('/')[1] ?? '';
  const nav = sectionNavs[sectionKey];
  const [navOpen, setNavOpen] = useState(false);
  const [landed, setLanded] = useState(true);

  // After a new path: close the small-screen section list and let pages glide in (adjusting state during render, not in an effect).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setNavOpen(false);
    setLanded(false);
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to main content
      </a>

      <header className={styles.header}>
        <Container width="full">
          <div className={styles.headerRow}>
            <Link href={paths.overview} variant="standalone" className={styles.brand}>
              <Lens className={styles.logo} />
              <span className={styles.brandName}>{appName}</span>
            </Link>
            <nav aria-label="Sections" className={styles.primaryNav}>
              <Inline as="ul" gap="extraSmall">
                {sections.map((section) => {
                  const current = isCurrentSection(pathname, section.href);
                  return (
                    <li key={section.href}>
                      <Link
                        href={section.href}
                        variant="standalone"
                        className={styles.navLink}
                        aria-current={pathname === section.href ? 'page' : current ? 'true' : undefined}
                      >
                        {section.label}
                      </Link>
                    </li>
                  );
                })}
              </Inline>
            </nav>
            <div className={styles.settings}>
              <ThemeSelect />
            </div>
          </div>
        </Container>
      </header>

      <div className={[styles.body, nav && styles.withSidebar].filter(Boolean).join(' ')}>
        {nav && (
          <nav aria-label={nav.label} className={styles.sidebar}>
            <Button
              className={styles.navToggle}
              aria-expanded={navOpen}
              aria-controls="section-nav-list"
              iconEnd={<Icon name={navOpen ? 'close' : 'arrowRight'} />}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? `Hide ${nav.label.toLowerCase()}` : `Show ${nav.label.toLowerCase()}`}
            </Button>
            <div id="section-nav-list" className={[styles.sectionList, navOpen && styles.open].filter(Boolean).join(' ')}>
              {nav.groups.map((group) => (
                <div key={group.heading ?? 'all'} className={styles.group}>
                  {group.heading && <p className={styles.groupHeading}>{group.heading}</p>}
                  <ul className={styles.links}>
                    {group.entries.map((entry) => {
                      const href = nav.href(entry.id);
                      return (
                        <li key={entry.id}>
                          <Link
                            href={href}
                            variant="standalone"
                            className={styles.sectionLink}
                            aria-current={pathname === href ? 'page' : undefined}
                          >
                            {entry.shortName ?? entry.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        )}

        <main id="main" tabIndex={-1} className={styles.main}>
          <Suspense
            fallback={
              <Container>
                <Text role="status" className={styles.loading}>
                  Loading page…
                </Text>
              </Container>
            }
          >
            {/* Keyed by path so each new page glides in; the first page and query-only changes render in place. */}
            <div key={pathname} className={landed ? undefined : styles.arrive}>
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>

      <footer className={styles.footer}>
        <Container width="full">
          <Inline gap="medium" justify="between">
            <Text variant="bodySmall" tone="muted">
              {appName} is designed and built by <Link href={author.portfolio}>{author.name}</Link>, with the components it
              documents.
            </Text>
            <Text variant="bodySmall" tone="muted">
              <Link href={author.caseStudy}>Case study</Link> · <Link href={author.repository}>Source on GitHub</Link>
            </Text>
          </Inline>
        </Container>
      </footer>
    </div>
  );
}
