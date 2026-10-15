# Contributing

## Before you add something

1. **Search the Components index.** Extending an existing component is usually better than adding one.
2. **Open an issue first.** Describe the problem a new component or change solves and what you searched.
3. **Find the lowest implementation layer that has everything the code needs.** Catalog knowledge belongs in
   `src/domain/system`; URL, storage, requests and demo orchestration belong in
   `src/features/<area>`; documentation, stories and fixtures belong in `src/content/<area>`;
   routes and the shell belong in `src/app`.
4. **Prefer native HTML.** Introduce ARIA only when no native element expresses the pattern, and
   then follow the matching WAI-ARIA Authoring Practices pattern.
5. **Do not add props to make an API larger.** A visual prop must express a real design decision
   and resolve to a token.

## Adding a token

1. Reuse an existing semantic role if one fits.
2. Theme-dependent values go in **both** `theme.light.tokens.json` and `theme.dark.tokens.json`
   (the build fails otherwise). Shared semantic values go in `semantic.tokens.json`, raw values in
   `reference.tokens.json`, component decisions in `component.tokens.json` (alias a semantic token
   and explain the decision in `$description`).
3. Run `npm run tokens`. Missing references, cycles, type mismatches and collisions stop the build.
4. Add new color pairs to `src/design-system/tokens/contrast.test.ts`.
5. Commit the sources and `src/design-system/tokens/generated/` together.

## Adding a product

1. Open Foundations → Theme studio, enter the brand color, product id and shape, and confirm every
   pair passes in both themes. Review the status and color-vision table; a brand close to danger
   or success needs a deliberate decision. Copy the link to share the exact theme for review.
2. From the Token files tabs, create `product.<id>.tokens.json` and merge the ramp into
   `reference.modes.tokens.json` and the brand roles into `brands.light.tokens.json` and
   `brands.dark.tokens.json`. Product files may only override existing tokens.
3. Merge the resolver entry into `system-lab.resolver.json` and the profile into
   `src/domain/system/products.ts`, then run `npm run tokens` and `npm test`. The contrast suite
   picks up the new product automatically.

## Adding or changing a component

1. Create `src/design-system/<layer>/<Name>/<Name>.tsx`, where `<layer>` is the component layer
   (`layout`, `primitives` or `composites`), plus `<Name>.module.css` (wrapped in its
   cascade layer) and `<Name>.test.tsx`.
2. Export `<Name>OwnProps`, the props type, option arrays (`nameSizes`, `nameAppearances` …) and
   a defaults object. Use the shared vocabularies from `vocabulary.ts` for space, radius, border,
   elevation, surface and tone. Pass `ref` and native attributes through.
3. In CSS, read component tokens through private properties so explicit props win:
   `var(--_radius, var(--name-radius))`.
4. Export it from the layer's `index.ts`.
5. Add a catalog entry in `src/domain/system/catalog.ts` with `kind: 'component'` and its component
   `layer`, a `ComponentDoc` in
   `src/content/components/docs/`, examples in `src/content/components/examples/`, and — when it
   has visual props — a story in `src/content/components/stories.tsx`.
   `propsTable<NameOwnProps>()` and `defineStory<NameProps>()` make the docs and controls
   compile-time matches for the component.
6. `src/test/documentation.test.ts` fails if an exported component has no catalog entry or doc,
   or if a source path or link is broken. `src/test/playground.test.tsx` fails if a control's
   options drift from the exported arrays or a selected value is missing from the snippet.

## Adding a pattern

1. Add the catalog entry (kind `pattern`, with no layer: only components have one).
2. Put fixtures and simulated requests in `src/content/patterns/fixtures.ts`, using
   `simulateRequest` and `outcomeFor` so scenarios stay deterministic.
3. Wrap request-driven demos in `ScenarioDemo` and render every state through design-system
   components. Distinguish Empty (no data) from No results (filters too narrow).
4. Document states, transitions, ownership, accessibility, responsive behavior and tradeoffs in
   `patterns.tsx`.

## Checklist for every change

- [ ] Imports only point to lower layers and through public `index.ts` entries.
- [ ] Every visual prop resolves to a token; styles declare their cascade layer.
- [ ] Native semantics are preserved; no interactive element is nested in another.
- [ ] Keyboard: every action reachable, focus visible, focus moved deliberately when content disappears.
- [ ] Status is never communicated by color alone.
- [ ] Tests query by role and accessible name and cover the states that matter.
- [ ] Docs, examples and the playground story show the change.
- [ ] `npm run verify` passes, and you checked the change with a keyboard, in both themes and at 320px.

## Reviewing and releasing

The design system ships with the site, so a breaking change updates every consumer in the same
change. For larger changes, deprecate first: keep the old prop working, document the replacement,
migrate internal consumers, then remove the old prop later. Record significant decisions in
[decisions/](decisions/).
