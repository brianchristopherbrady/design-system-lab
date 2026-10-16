# Architecture

Design System Lab is one Vite + React application with internal boundaries. The site documents the
design system and is built from it. This file explains the layers, the token tiers, how props map
to tokens, and where state lives. The Overview page shows the same material with live data.

## Layers

| Folder | Layer | Responsibility | May import |
| --- | --- | --- | --- |
| `src/design-system/tokens` | ds-tokens | DTCG sources, generated CSS variables, TypeScript keys, manifest, prop vocabularies | — |
| `src/design-system/styles` | ds-styles | Cascade layer order, reset, base element styles | ds-tokens |
| `src/design-system/layout` | ds-layout | Box, Stack, Inline, Grid, Container, ThemeScope, ScrollRegion | ds-tokens |
| `src/design-system/primitives` | ds-primitives | Text, Heading, Button, Badge, Icon, Link, Input, Select, Checkbox, Switch, Progress, Skeleton, VisuallyHidden | ds-tokens, ds-layout |
| `src/design-system/composites` | ds-composites | Card, Dialog, Alert, Tabs, Field, PageHeader, EmptyState, Disclosure, RadioGroup | ds-tokens, ds-layout, ds-primitives |
| `src/domain/system` | domain | The catalog of components, foundations, patterns and design decisions; the changelog; catalog-aware presentation | design system |
| `src/domain/decisions` | domain | Sources cited by the design decisions, and the sharing comparison's reasoning as pure functions | design system |
| `src/features/docs` | feature | Component reference rendering, live examples, source viewers, token chains | design system, domain |
| `src/features/directory` | feature | Search and filter logic, URL encoding, the filter UI | design system, domain |
| `src/features/scenarios` | feature | Demo scenarios, simulated requests, the `useRequest` state machine | design system, domain |
| `src/features/playground` | feature | Typed control specs, prop and snippet builders, the workbench UI, the container inspector | design system, domain |
| `src/features/theming` | feature | OKLCH, contrast (WCAG 2 and APCA), ΔEOK and color-vision math, ramp generation, role assignment, the theme studio panels and its URL-backed state | design system, domain |
| `src/content/*` | content | Overview, foundations, component docs and stories, pattern demos and fixtures, design decisions | design system, domain, features |
| `src/app` | app | Shell, routes, providers, pages | everything |
| `src/main.tsx` | entry | Mounts the app and global styles | app, ds-styles |
| `src/test` | test-support | Test setup and cross-layer tests | everything |

```text
app ──► content ──► features ──► domain ──► design-system
          (content areas never import each other; features never import each other)
design-system: composites ──► primitives ──► layout ──► tokens
```

## Rules enforced by `npm run lint:architecture`

`scripts/architecture/check-boundaries.mjs` parses every import in `src/` with the TypeScript
scanner, resolves it to a file and fails on: **layer** (importing a layer not allowed above),
**sibling-module** (one feature or content area importing another), **public-entry** (reaching
past another module's `index.ts`), **own-public-entry**, **forbidden-package** (`react-router`
inside the design system or domain), **cycle** and **unresolved**. `?raw` imports are exempt.

`scripts/architecture/check-styles.mjs` requires every CSS Module to declare its cascade layer,
forbids raw colors and palette (`--color-*`) variables outside the token files, and requires every
`var(--name)` to be a generated token, declared in the same file, or a private `--_name`.

## Token tiers

1. **Reference** (`reference.tokens.json`): palettes and raw scales — `color.neutral.950`,
   `space.md`, `radius.lg`, `shadow.medium`, `duration.base`. Palettes are read only through
   semantic roles; the non-color scales may be read directly for fixed values. The dependency
   policy (`src/design-system/tokens/policy.ts`) lists the rules and their exceptions, and the token
   build and `scripts/tokens/policy.test.mjs` enforce them.
2. **Semantic** (`semantic.tokens.json`, `theme.light|dark.tokens.json`): purpose-named aliases —
   `surface.panel`, `text.muted`, `border.default`, `action.primary.background`,
   `tone.danger.text`, `focus.ring`, `spacing.medium`, `elevation.low`. Themes remap the color
   and elevation roles; everything else is shared.
3. **Component** (`component.tokens.json`): decisions for one component that alias semantic
   tokens — `button.primary.background-hover`, `badge.radius`, `card.padding`,
   `dialog.width.medium`, `switch.track-on`, `skeleton.size.large`. Added only where a component
   exposes a knob a product may retune.

The pipeline keeps aliases as `var()` in CSS, so changing a modifier attribute on any element
cascades through all three tiers. Contrast for every foreground/background pair is unit-tested in
every product and theme (`contrast.test.ts`, 534 checks).

## Modifiers: theme, product and density

`system-lab.resolver.json` follows the DTCG resolver module (2025.10). Sets (reference, semantic,
component) always apply; three **modifiers** add or replace tokens by context:

| Modifier | Contexts | Sources | Rule |
| --- | --- | --- | --- |
| `theme` | light, dark | `theme.*.tokens.json`, `brands.*.tokens.json` | `complete`: every context defines the same tokens |
| `product` | system-lab (default, empty), patient, provider | `product.*.tokens.json` | `overrides`: may only replace existing tokens; brand roles, typefaces, signal and shape only |
| `density` | comfortable (default, empty), compact | `density.compact.tokens.json` | `overrides` |

The pipeline resolves every permutation (3 × 2 × 2 = 12), then compares each token's resolved
signature across them to find the modifiers it actually **depends on**. CSS is emitted
dependency-minimal: a token that never changes is written once in `:root`; one that depends on
product and theme is written once per product × theme combination under
`[data-theme='…'][data-product='…']`, and so on. The output is 878 lines for 338 tokens rather than
12 copies of every token. Override files that introduce a new path, or change a token's type or
tier, fail the build with "overrides nothing".

`ThemeScope` (layout) re-themes a region by writing all three attributes, inheriting any it is not
given from the nearest scope. Because every block's selector names all of its token's modifiers, a
scoped region must carry all three attributes; `ThemeScope` guarantees that. `ThemeProvider` does
the same on `<html>`. The products foundation composes any permutation, computes each product's
overrides and every density change from the manifest (`src/content/foundations/modes.ts`), and
renders nested scopes and every product × theme combination. The theme studio generates a new
product's ramp in OKLCH (reporting where sRGB limits chroma), picks each role by WCAG 2 contrast
against the system's real surfaces, reports APCA Lc alongside, compares the brand with the status
fills under simulated color-vision deficiencies, applies a shape, and exports all six pieces a
product needs. Its choices live in the URL so a theme can be shared for review.

## From prop to style

Props accept named choices only. `src/design-system/tokens/vocabulary.ts` maps shared vocabularies
to token paths:

| Vocabulary | Values | Tokens |
| --- | --- | --- |
| Space (`gap`, `rowGap`, `columnGap`, `padding`) | none, extraSmall, small, medium, large, extraLarge, extraExtraLarge | `spacing.*` |
| Radius | none, small, medium, large, extraLarge, full | `radius.*` |
| Elevation | none, low, medium, high | `elevation.*` |
| Border strength (surfaces) | none, subtle, default, strong | `border.*` at `border-width.thin` |
| Surface | canvas, panel, sunken, accent | `surface.*` |
| Tone | neutral, brand, success, warning, danger, info | `tone.<tone>.{text,surface,border,solid,on-solid}` |
| Column width | extraSmall, small, medium, large | `size.item.*` |

Components set private `--_` custom properties from these values; their CSS reads the private
property with the component token as fallback, for example
`background-color: var(--_background, var(--card-background))`. That is the documented precedence:
an explicit prop wins, an unset prop uses the component token. Example trace:
`appearance="primary"` → `--button-primary-background` → `--action-primary-background` →
`--color-neutral-950` (Design System Lab, light) / `--brand-care-strong` (Patient app and Provider
workspace, either theme).

Option arrays (`buttonAppearances`, `badgeSizes`, `gridColumnCounts` …) and default objects are
exported next to each component. The component, its docs and its playground story all import the
same arrays, and `src/test/playground.test.tsx` checks they stay identical.

## Grid modes

`Grid` derives one of three modes, so no prop combination is ambiguous: `columns` alone is fixed;
`minColumnWidth` alone (or neither) is responsive auto-fit; both is auto-fit capped at `columns`.
`rowGap` and `columnGap` override `gap` per axis.

## Cascade layers

`@layer reset, tokens, base, layout, components, product;` — a later layer always wins regardless
of specificity or load order, so product code can adjust a component with a plain class.

## Responsive strategy

- Intrinsic layout first: Inline wraps, Grid auto-fits.
- Container queries for components and compositions (EntryCard 28rem, ActivityList 36rem,
  DirectoryFilters 40rem, the playground workbench 52rem, documentation pages 56rem).
- Viewport media queries only in the app shell (the section sidebar and the header's row layout).
- Every threshold has a comment explaining its value. The responsive foundation lists every
  `@container` and `@media` rule by parsing the stylesheets at runtime, and flags any viewport size
  query outside the shell. Pattern demos and the playground can outline their live query
  containers ("Show query containers").

## State ownership

| State | Owner |
| --- | --- |
| Local UI (disclosures, selected tab, pins in demos) | The component (`useState`) or the native element |
| Components index filters | URL search parameters (`useUrlDirectoryFilters`) |
| Playground component | URL `?component=`; control values, preview theme/product/density, width and the container overlay in `Playground` state |
| Demo scenario and resets | `ScenarioDemo`, which remounts the demo with a `key` |
| Simulated requests | `useRequest` (discriminated union, abort on reload, stale-response guard) |
| Theme preference, product and density | `ThemeProvider` (app layer), stored in localStorage; `ThemeScope` for regions |
| Counts, filtered lists, snippets | Derived during render |

No design-system component knows about fixtures, scenarios or the playground.

## Routing and focus

Routes: `/`, `/foundations`, `/foundations/:topicId`, `/components`, `/components/:componentId`,
`/playground`, `/patterns`, `/patterns/:patternId`, `/decisions`, `/decisions/:decisionId` and a
catch-all. The retired `/guides` and `/guides/:id` URLs redirect to the page that now covers the same
ground (`src/app/legacyGuides.ts`). All but the overview are lazy
chunks. The token manifest (about 280 kB, 17 kB compressed) loads only with pages that inspect tokens; the
overview reads the generated `tokenCounts` for its summary and loads its token demonstration as a separate chunk. `usePageTitle` sets `document.title` and moves focus to the page `h1` after client-side
navigation, or to the target of a URL fragment; first load and query changes leave focus alone.
`Link` renders a real anchor; the app passes React Router's `navigate` through `LinkProvider`.
