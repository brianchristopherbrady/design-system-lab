/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as composites from '@/design-system/composites';
import * as layout from '@/design-system/layout';
import * as primitives from '@/design-system/primitives';
import { tokenManifest } from '@/design-system/tokens/manifest';
import { componentDocs, playgroundStories } from '@/content/components';
import { decisionsIndexSections, decisionTopics } from '@/content/decisions';
import { foundationTopics } from '@/content/foundations';
import { overviewSections } from '@/content/overview';
import { entryHref, patternDocs } from '@/content/patterns';
import { catalog, entriesOfKind, findEntry } from '@/domain/system';
import { cssVarIndex, hasSource, tokenReadsOf } from '@/features/docs';
import { parseSearch, toSearchParams } from '@/features/playground';
import { legacyGuideTargets } from '@/app/legacyGuides';
import { paths } from '@/app/paths';

const siteSources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/test/documentation.test.ts', '!/src/**/generated/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});
const projectText = import.meta.glob<string>(['/docs/**/*.md', '/README.md', '/e2e/**/*.ts', '/scripts/**/*.mjs', '/index.html'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ids = (kind: 'decision' | 'component' | 'foundation' | 'pattern') => entriesOfKind(kind).map((entry) => entry.id).sort();

describe('the catalog drives the site', () => {
  it('has a ComponentDoc for every component entry and no orphan docs', () => {
    expect(componentDocs.map((doc) => doc.id).sort()).toEqual(ids('component'));
  });

  it('has a topic for every foundation, a page for every pattern and content for every design decision', () => {
    expect(foundationTopics.map((topic) => topic.id).sort()).toEqual(ids('foundation'));
    expect(patternDocs.map((doc) => doc.id).sort()).toEqual(ids('pattern'));
    expect(decisionTopics.map((topic) => topic.id).sort()).toEqual(ids('decision'));
  });

  it('documents every component the design system exports', () => {
    const exported = [layout, primitives, composites]
      .flatMap((module) => Object.entries(module))
      .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name) && !name.endsWith('Provider'))
      .map(([name]) => name)
      .sort();
    const documented = entriesOfKind('component').map((entry) => entry.name);
    expect(exported.filter((name) => !documented.includes(name))).toEqual([]);
  });

  it('gives every playground story a documented component', () => {
    const documented = new Set(componentDocs.map((doc) => doc.id));
    for (const story of playgroundStories) expect(documented.has(story.id), story.id).toBe(true);
  });

  it('points every source reference at a file that exists', () => {
    for (const entry of catalog) expect(hasSource(entry.sourcePath), `${entry.id}: ${entry.sourcePath}`).toBe(true);
    for (const doc of componentDocs) {
      for (const path of doc.sourcePaths) expect(hasSource(path), `${doc.id}: ${path}`).toBe(true);
    }
  });

  it('builds entry links that match the app routes', () => {
    for (const entry of catalog) {
      const expected = { decision: paths.decision, component: paths.component, foundation: paths.foundation, pattern: paths.pattern }[entry.kind](entry.id);
      expect(entryHref(entry)).toBe(expected);
    }
  });
});

describe('component docs agree with the implementation', () => {
  const index = cssVarIndex(tokenManifest);
  const read = (path: string) => readFileSync(path, 'utf8');

  it('lists the stylesheet of every component that has one, so derived token reads are complete', () => {
    const missing = componentDocs.flatMap((doc) => {
      const source = findEntry(doc.id)?.sourcePath ?? '';
      const stylesheet = source.replace(/\.tsx$/, '.module.css');
      return existsSync(stylesheet) && !doc.sourcePaths.includes(stylesheet) ? [`${doc.id}: ${stylesheet}`] : [];
    });
    expect(missing).toEqual([]);
  });

  it('traces each prop to a token that the component’s own files read, or the child it names', () => {
    const readsOf = (id: string) => {
      const doc = componentDocs.find((candidate) => candidate.id === id);
      return new Set(tokenReadsOf((doc?.sourcePaths ?? []).map((path) => ({ path, text: read(path) })), index).map((entry) => entry.path));
    };
    const wrong = componentDocs
      .filter((doc) => doc.id !== 'theme-scope')
      .flatMap((doc) =>
        doc.propTokens
          .filter((trace) => !readsOf(trace.readBy ?? doc.id).has(trace.token))
          .map((trace) => `${doc.id}: ${trace.prop} → ${trace.token}`),
      );
    expect(wrong).toEqual([]);
  });

  it('traces each ThemeScope prop to a token that depends on the modifier it sets', () => {
    const scope = componentDocs.find((doc) => doc.id === 'theme-scope');
    const wrong = (scope?.propTokens ?? []).filter((trace) => {
      const modifier = trace.prop.split('=')[0] ?? '';
      return !tokenManifest.find((record) => record.path === trace.token)?.dependsOn.includes(modifier);
    });
    expect(scope?.propTokens.length).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });
});

describe('maturity labels match their requirements', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
  const tests = [...walk('src'), ...walk('e2e'), ...walk('scripts')]
    .filter((file) => /\.(test\.tsx?|test\.mjs|spec\.ts)$/.test(file) && !file.endsWith('documentation.test.ts'))
    .map((file) => readFileSync(file, 'utf8'));
  const usage = walk('src')
    .map((file) => file.split(sep).join('/'))
    .filter((file) => /\.tsx$/.test(file) && !file.startsWith('src/content/components/') && !/\.test\.tsx$/.test(file))
    .map((file) => ({ file, text: readFileSync(file, 'utf8') }));
  const components = entriesOfKind('component');

  it('documents keyboard, screen-reader and responsive behavior for beta and stable components', () => {
    const missing = components
      .filter((entry) => entry.maturity === 'beta' || entry.maturity === 'stable')
      .filter((entry) => {
        const doc = componentDocs.find((candidate) => candidate.id === entry.id);
        return !doc || doc.accessibility.length === 0 || doc.responsive.length === 0;
      })
      .map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it('names every stable component in at least one automated test', () => {
    const untested = components
      .filter((entry) => entry.maturity === 'stable')
      .filter((entry) => !tests.some((text) => new RegExp(`\\b${entry.name}\\b`).test(text)))
      .map((entry) => entry.name);
    expect(untested).toEqual([]);
  });

  it('uses every stable component somewhere other than its own documentation', () => {
    const unused = components
      .filter((entry) => entry.maturity === 'stable')
      .filter((entry) => {
        const folder = entry.sourcePath.slice(0, entry.sourcePath.lastIndexOf('/'));
        return !usage.some(({ file, text }) => !file.startsWith(`${folder}/${entry.name}`) && file !== entry.sourcePath && new RegExp(`<${entry.name}\\b`).test(text));
      })
      .map((entry) => entry.name);
    expect(unused).toEqual([]);
  });
});

describe('links', () => {
  const known = new Set(catalog.map((entry) => entryHref(entry)));
  const sectionRoots = new Set<string>([paths.overview, paths.decisions, paths.foundations, paths.components, paths.playground, paths.patterns]);
  const isRoute = (href: string) => {
    const path = href.split(/[?#]/)[0] ?? '';
    return sectionRoots.has(path) || known.has(path);
  };

  it('only links to routes that exist', () => {
    const broken = Object.entries(siteSources).flatMap(([file, source]) =>
      [...source.matchAll(/(?:href(?:="|: ')|\]\()(\/[^"')]*)["')]/g)]
        .map((match) => match[1] ?? '')
        .filter((href) => !isRoute(href))
        .map((href) => `${file}: ${href}`),
    );
    expect(broken).toEqual([]);
  });

  it('sends every old Guides link to a page that exists', () => {
    for (const [id, target] of Object.entries(legacyGuideTargets)) expect(isRoute(target), `${id} -> ${target}`).toBe(true);
  });

  it('links only to Playground configurations the Playground reproduces in full', () => {
    const links = [...new Set(Object.values(siteSources).flatMap((source) => source.match(/\/playground\?[^"'`)\s#]*v=1[^"'`)\s#]*/g) ?? []))];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const search = new URLSearchParams(link.slice(link.indexOf('?') + 1));
      const parsed = parseSearch(search, playgroundStories, 'button');
      expect(parsed.kind, link).toBe('configured');
      if (parsed.kind !== 'configured') continue;
      expect(parsed.config.component, link).toBe(search.get('component'));
      const story = playgroundStories.find((candidate) => candidate.id === parsed.config.component);
      const kept = story ? toSearchParams(parsed.config, story) : new URLSearchParams();
      for (const [key, value] of search) if (key.startsWith('p.')) expect(kept.get(key), `${link}: ${key}`).toBe(value);
    }
  });

  it('points every hash link in the site at a section that exists', () => {
    const anchors = new Map<string, readonly string[]>([
      [paths.overview, overviewSections.map((section) => section.id)],
      [paths.decisions, decisionsIndexSections.map((section) => section.id)],
      ...foundationTopics.map((topic) => [paths.foundation(topic.id), topic.sections.map((section) => section.id)] as const),
      ...decisionTopics.map((topic) => [paths.decision(topic.id), topic.sections.map((section) => section.id)] as const),
    ]);
    const links = [
      ...Object.values(siteSources).flatMap((source) => [...source.matchAll(/(?:href(?:="|: ')|\]\()(\/[^"')]*#[^"')]+)["')]/g)].map((match) => match[1] ?? '')),
      ...Object.values(legacyGuideTargets),
    ];
    const broken = links.filter((link) => {
      if (!link.includes('#')) return false;
      const [path = '', hash = ''] = link.split('#');
      const ids = anchors.get(path);
      return ids !== undefined && !ids.includes(hash);
    });
    expect(broken).toEqual([]);
  });
});

describe('terminology', () => {
  it('contains no course or lesson vocabulary anywhere in the site, docs or tests', () => {
    const banned = /\b(lessons?|curricul\w*|coursework)\b/i;
    const hits = Object.entries({ ...siteSources, ...projectText })
      .filter(([, text]) => banned.test(text))
      .map(([file, text]) => `${file}: ${banned.exec(text)?.[0] ?? ''}`);
    expect(hits).toEqual([]);
  });
});

describe('written facts match the source', () => {
  it('names only palette tokens that exist', () => {
    const known = new Set<string>(tokenManifest.map((record) => record.path));
    const missing = Object.entries({ ...siteSources, ...projectText }).flatMap(([file, text]) =>
      [...text.matchAll(/\bcolor\.[a-z]+\.\d{2,3}\b/g)].map((match) => match[0]).filter((path) => !known.has(path)).map((path) => `${file}: ${path}`),
    );
    expect(missing).toEqual([]);
  });

  it('counts the design decisions correctly where the section is described', () => {
    const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const describing = ['/README.md', '/index.html', '/src/content/overview/Overview.tsx', '/src/app/pages/DecisionsIndexPage.tsx', '/src/content/decisions/DecisionsIndex.tsx'];
    // Top-level docs only: dated audit records and ADRs describe the site as it was.
    const texts = Object.entries({ ...siteSources, ...projectText }).filter(([file]) => describing.includes(file) || /^\/docs\/[^/]+\.md$/.test(file));
    expect(texts.length).toBeGreaterThanOrEqual(describing.length);
    const wrong = texts.flatMap(([file, text]) =>
      [...text.matchAll(/\b(\w+) (?:engineering |design )?decision(?:s| records| pages)\b/gi)]
        .filter((match) => {
          const word = (match[1] ?? '').toLowerCase();
          const count = /^\d+$/.test(word) ? Number(word) : numbers.indexOf(word);
          return count >= 0 && count !== decisionTopics.length;
        })
        .map((match) => `${file}: ${match[0]}`),
    );
    expect(wrong).toEqual([]);
  });
});
