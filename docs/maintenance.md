# Maintenance notes

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. A plugin regenerates tokens when a file in `src/design-system/tokens/source` changes. |
| `npm run tokens` | Generates `tokens.css`, `tokens.ts` and `manifest.ts` from the DTCG sources. |
| `npm run tokens:check` | Fails if the generated files are out of date. |
| `npm run typecheck` | `tsc -b` for the app and the tooling. |
| `npm run lint` | ESLint (typescript-eslint, react-hooks, jsx-a11y) plus `lint:architecture`. |
| `npm run lint:architecture` | Token freshness, import boundaries and stylesheet rules. |
| `npm test` | Vitest unit and component tests in jsdom. |
| `npm run build` | Generates tokens, type-checks and builds to `dist/`. |
| `npm run preview` | Serves `dist/`. |
| `npm run test:e2e` | Builds, serves the production bundle and runs Playwright + axe-core. |
| `npm run verify` | Everything above, in order. |

## Runtime and dependency versions

Node 20.19 or newer. Dependencies are pinned to the newest majors that support Node 20 (React 19,
React Router 7, Vite 7, Vitest 3, TypeScript 5.9, ESLint 9, jsdom 26). Newer majors of React
Router, Vitest and jsdom require Node 22: upgrade Node first, then those packages, then run
`npm run verify`. Runtime dependencies are only `react`, `react-dom` and `react-router`.

## Playwright browsers

`npm run test:e2e` needs Chromium. Run `npx playwright install chromium` once, or set
`PLAYWRIGHT_CHANNEL=msedge` (or `chrome`) to use an installed browser.

## Generated files

`src/design-system/tokens/generated/*` is generated and committed. Never edit it by hand;
`npm run lint` catches drift.

## Persisted data

| Key | Shape | Owner |
| --- | --- | --- |
| `system-lab:theme` | `"light"` or `"dark"` (absent means system) | `src/app/providers/ThemeProvider.tsx` |

Nothing else is stored. `system-lab:product` and `system-lab:density`, saved when the header also
chose a product and density, are removed on load so an old choice cannot restyle the site. Demo pins,
archives and form submissions live in component state and reset with the demo.

## Fixtures

The catalog (`src/domain/system/catalog.ts`) and changelog (`activity.ts`) are the site's real
content and the pattern demos' data. Simulated requests (`src/content/patterns/fixtures.ts`) never
leave the browser; their outcomes come from `outcomeFor(scenario, attempt)`.

## Known limitations

- The token generator implements the DTCG features this project uses and rejects the rest
  (`$extends`, JSON Pointer `$ref`, `$root`, non-sRGB colors) with a clear error.
- Every modifier combination is resolved at build time, so permutations multiply: a fourth
  modifier with three contexts would mean 36. The CSS stays small because emission is
  dependency-minimal, but the manifest's `variants` grow with each product-dependent token.
- The theme studio's APCA figures use the published 0.0.98G-4g constants and are informational;
  roles are chosen by WCAG 2 ratios, which remain the conformance target.
- Its color-vision simulation uses the Machado et al. (2009) matrices at full severity, and its
  status warning threshold (0.1 ΔEOK) is a review heuristic. Neither is a substitute for testing
  with people who have color-vision deficiencies.
- The studio previews by re-pointing Harbor's brand roles and radii inline, and resets Harbor's
  typefaces to the system's, which a generated product inherits. It does not choose typefaces; set
  `typeface.*` in the product file by hand. A product only becomes real CSS through the token
  files and the pipeline.
- The query registry parses CSS with a regular expression that understands this codebase's
  conventions (one rule per `@container`/`@media`, explanatory comment directly above), not
  arbitrary CSS.
- Code blocks are plain text without syntax highlighting.
- The playground's snippets for layout stories write `{items}` for the sample children.
- Dialog styling relies on `::backdrop` inheriting custom properties (all current browsers).
- An explicitly chosen theme is applied when the script runs; a slow first load can briefly show
  the system theme.
