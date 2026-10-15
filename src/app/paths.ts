/** The site's name, shown in the header, the footer and every browser tab title. */
export const appName = 'Design System Lab';

/** Who made the site, and where to find the source and the case study. */
export const author = {
  name: 'Brian Brady',
  role: 'Design Engineer',
  portfolio: 'https://brianbrady.dev',
  caseStudy: 'https://brianbrady.dev/projects/system-lab.html',
  repository: 'https://github.com/brianchristopherbrady/design-system-lab',
} as const;

/** The Overview's browser tab title; index.html carries the same title for link previews. */
export const homeTitle = `${appName} | ${author.name} | ${author.role}`;

/** Deployment base path without the trailing slash: "" locally, "/design-system-lab" on GitHub Pages. */
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Route paths. The route table in routes.tsx and every link built by the app use these. */
export const paths = {
  overview: '/',
  decisions: '/decisions',
  decision: (id: string) => `/decisions/${id}`,
  foundations: '/foundations',
  foundation: (id: string) => `/foundations/${id}`,
  components: '/components',
  component: (id: string) => `/components/${id}`,
  playground: '/playground',
  playgroundFor: (id: string) => `/playground?component=${encodeURIComponent(id)}`,
  patterns: '/patterns',
  pattern: (id: string) => `/patterns/${id}`,
} as const;

export const sections = [
  { href: paths.overview, label: 'Overview' },
  { href: paths.foundations, label: 'Foundations' },
  { href: paths.components, label: 'Components' },
  { href: paths.playground, label: 'Playground' },
  { href: paths.patterns, label: 'Patterns' },
  { href: paths.decisions, label: 'Design decisions' },
] as const;
