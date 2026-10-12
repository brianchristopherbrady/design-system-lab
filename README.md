# Design System Lab

Design System Lab is a design system and its reference site, created by
[Brian Brady](https://brianbrady.dev) to demonstrate design-system thinking and implementation
([case study](https://brianbrady.dev/projects/system-lab.html)). The site documents tokens, foundations,
components and patterns with live demos, and it is built entirely from the components it
documents: the navigation, the Components index and the pattern demos all read the same catalog.

Sections:

- **Overview** — what the project is and who made it, a live chain from a design decision to a working
  Button, a suggested review path, how the page itself is built from the system, principles and the
  implementation architecture.
- **Foundations** — token tiers, color, typography, spacing, borders and radii, elevation, motion,
  themes and responsive rules, rendered from the generated token manifest. **Products and modes**
  shows one token source resolving into three products × two themes × two densities, with a mode
  composer, a computed product diff, nested scopes and density measurements; the **theme studio**
  generates a complete product from one brand color (OKLCH ramp with its gamut limits, contrast-
  chosen roles, shape, WCAG 2 and APCA checks, status and color-vision checks, shareable links and
  every source file to add); the responsive foundation lists every container and media query in the
  code.
- **Components** — each component's props, defaults, precedence rules, prop → token traces,
  examples, accessibility notes and real source.
- **Playground** — Storybook-style controls for real public props, presets, a scoped theme,
  product and density, an independently resizable preview that stays in view on desktop while
  props are edited, a query-container overlay and a usage snippet that always matches the controls.
- **Patterns** — a resource directory, a resource detail page, an activity dashboard and a
  validated form. Each request-driven demo has a **Demo scenario** selector listing only the
  states that apply to it (loading, success, error, an empty state, and no results where there is
  a search), and an overlay of the query containers each demo responds to.
- **Design decisions** — four engineering decisions (planning, sharing across products,
  implementation and operating), each with a short decision record, followed through one
  hypothetical scenario: Meadow, for occasional consumers completing guided tasks, and Harbor, for
  professionals scanning dense information. The scenario is separate from the Harbor and Meadow
  product modes this site implements. Material is labelled implemented, hypothetical, proposed or
  conceptual.

The header switches the whole site between products (Design System Lab, Harbor, Meadow), themes and
densities. A product changes brand colors, typefaces and corner shapes, not the site's name, logo or
content; nothing in a component knows which one is active.

## Run it

Requirements: Node 20.19 or newer.

```sh
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```sh
npm run tokens       # regenerate CSS variables, TypeScript keys and the token manifest
npm run typecheck    # tsc -b (app and tooling)
npm run lint         # ESLint + token freshness + import boundaries + stylesheet rules
npm test             # Vitest unit and component tests
npm run build        # production build in dist/
npm run preview      # serve dist/
npm run test:e2e     # Playwright + axe-core against the production build
npm run verify       # all of the above
```

`npm run test:e2e` needs a Chromium browser: run `npx playwright install chromium` once, or set
`PLAYWRIGHT_CHANNEL=msedge` (or `chrome`) to use an installed browser.

## What is where

```text
src/
  design-system/
    tokens/        DTCG sources and resolver (source/), generated CSS + TS + manifest (generated/), prop vocabularies
    styles/        cascade layer order, reset, base element styles
    layout/        Box, Stack, Inline, Grid, Container, ThemeScope, ScrollRegion
    primitives/    Text, Heading, Button, Badge, Icon, Link, Input, Select, Checkbox, Switch,
                   Progress, Skeleton, VisuallyHidden
    composites/    Card, Dialog, Alert, Tabs, Field, PageHeader, EmptyState, Disclosure, RadioGroup
  domain/system/   the catalog and changelog, EntryCard, ActivityList, MaturityBadge
  domain/decisions/ sources and the sharing comparison's reasoning (pure functions, tested)
  features/
    docs/          ComponentReference, LiveExample, SourceViewer, ApiTable, TokenChain, TokenExplorer
    directory/     search and filters (URL-backed or local)
    scenarios/     Demo scenario selector, simulated requests, useRequest
    playground/    typed control specs, prop and snippet builders, the Playground workbench, ContainerInspector
    theming/       OKLCH, contrast (WCAG 2, APCA) and color-vision math, ramps, roles, the theme studio
  content/
    overview/      the Overview page
    foundations/   foundation topics
    components/    component docs, examples and playground stories
    patterns/      pattern demos, fixtures and their documentation
    decisions/     the Design decisions pages and the sharing comparison
  app/             shell, routes, providers, pages
scripts/
  tokens/          the token pipeline
  architecture/    import-boundary and stylesheet checks
docs/              architecture, contributing, maintenance, accessibility, decision records
e2e/               Playwright specs
```

Imports only point down: `app → content → features → domain → design-system`. The rules are
enforced by `npm run lint`; see [docs/architecture.md](docs/architecture.md).

## Further reading

- [docs/architecture.md](docs/architecture.md) — layers, token tiers and modifiers, prop vocabularies, state ownership
- [docs/contributing.md](docs/contributing.md) — adding tokens, components, stories and patterns
- [docs/maintenance.md](docs/maintenance.md) — scripts, versions, persisted data, limitations
- [docs/accessibility.md](docs/accessibility.md) — what was verified and what was not
- [docs/decisions/](docs/decisions/) — decision records
