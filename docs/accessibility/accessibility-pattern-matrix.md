# Accessibility pattern matrix: Design System Lab

Built from the rendered UI and source by the accessibility-auditor (Agent 1) on 2026-10-12. Patterns are grouped by user intent and interaction model, not by component name. Issue status is kept only in [accessibility-issues.json](accessibility-issues.json). Evidence paths are relative to `docs/accessibility/`.

Authority key: **N** = normative (WCAG 2.2 SC), **I** = informative (Understanding, APG, MDN), **J** = engineering judgment.
Sources opened on 2026-10-12 (excerpts are in `evidence/wcag22-normative-excerpts.txt` and `evidence/apg-and-understanding-excerpts.txt`):
WCAG 2.2 https://www.w3.org/TR/WCAG22/ · APG dialog-modal, tabs, switch, disclosure, radio, button https://www.w3.org/WAI/ARIA/apg/patterns/ · APG landmark-regions and keyboard-interface https://www.w3.org/WAI/ARIA/apg/practices/ · Understanding pages listed in the audit, section 10 · MDN status role.

Patterns that were looked for and **not found**: menu or menubar, listbox, custom combobox (every "combobox" role is a native `<select>`), grid, tree, toolbar, tooltip, non-modal popover, carousel, custom slider (the width slider is a native range input), drag and drop. No APG contract for those was needed.

---

## P-01 Shell navigation (skip link, section links, contextual nav, on-this-page)
- **Intent**: navigation. Move between sections and pages, and skip repeated content.
- **Instances**: every route. Skip link `a[href="#main"]`, `nav[aria-label="Sections"]`, the contextual nav (`Foundations`/`Components`/`Patterns`/`Design decisions`), and `nav[aria-label="On this page"]`. Owner: `src/app/shell/AppShell.tsx`, `src/features/docs/OnThisPage.tsx`.
- **Native alternative**: native links are used already. `aria-current="page"` marks the current page and `"true"` marks the current section.
- **Semantics and name**: landmark navs with unique names; the current item is underlined, so colour is not the only cue.
- **Keyboard and focus**: the skip link is the first stop and moves focus to `main#main` (tabIndex −1, outline suppressed only on main itself). After client navigation, focus goes to the h1 (`usePageTitle.ts`). A query-only change does not move focus. Back to the first history entry leaves focus on body, which matches a page load (DL-007).
- **Visual and reflow**: the header wraps at 320 px without horizontal scroll; the sidebar collapses behind the disclosure (P-03) below 64rem.
- **Observed**: pass (`evidence/interactions.json` tabOrder and routeFocus, `evidence/history-focus.json`).
- **Failure modes to protect**: positive tabindex; focus left on the clicked link after a route change; duplicate nav names.
- **Manual script**: Tab from the top (skip link visible, then Enter puts focus on main); click a section link with Enter, and focus goes to the h1 and the title updates; Shift+Tab back from the footer reverses the order.
- **Automated protection**: existing `e2e/accessibility.spec.ts` keyboard tests; axe landmark rules.

## P-02 Page structure (title, lang, landmarks, headings)
- **Intent**: content orientation. **Owner**: `usePageTitle.ts`, `PageHeader`, the `Heading` primitive (an explicit level is required).
- **N**: 2.4.2 Page Titled, 1.3.1 Info and Relationships, 3.1.1 Language of Page.
- **Observed**: 55/55 routes have a unique title, `lang="en"` and exactly one h1. There is one level skip, h2 → h4 on `/foundations/products` (**A11Y-008**, best practice).
- **J**: the Heading level should come from the context (as EmptyState does with `headingLevel`), not be hard-coded in specimens.
- **Automated**: axe page-has-heading-one, heading-order (best practice), document-title, html-has-lang; `scripts/baseline.mjs` heading-skip scan.

## P-03 Disclosure buttons (Display settings, section navigation toggle)
- **Intent**: disclosure. Show or hide the setting selects and the section list on narrow screens.
- **Instances**: `ThemeSelect.tsx` "Display …" button (`aria-expanded`, `aria-controls`); `AppShell.tsx` "Show/Hide components" button.
- **Native alternative**: `<details>` would do the job; the button pattern is also valid.
- **I (APG Disclosure)**: role button; Enter and Space toggle; `aria-expanded` reflects the state; optional `aria-controls`.
- **Observed**: pass. Expanded state toggles, and the next Tab enters the revealed content (`evidence/interactions.json` shellSettings). The toggle's label changes (Show to Hide) as well as `aria-expanded`. That is redundant but allowed for a disclosure. The truncated "Display" summary can be revealed by the same button (DL-005).
- **Failure modes**: content revealed but not next in the Tab order; `aria-expanded` going stale.
- **Manual script**: at 375 px, Tab to Display, press Enter; `aria-expanded` is true and Tab reaches Product, Theme, Density in turn.

## P-04 Native select, input and range controls (shell settings, filters, Playground editors)
- **Intent**: entry and selection. **Owner**: `Select`, `Input` primitives; `Field` composite; `ControlsTable.tsx`.
- **Semantics and name**: native elements. Names come from `<label for>` (Field) or `aria-labelledby` (the prop-name `<code>` in the Controls table) plus `aria-describedby` (prop description and metadata). The range control has `aria-valuetext`.
- **N**: 4.1.2, 1.3.1, 2.5.8 (sizes measured at least 24 px except 20 px checkboxes and radios, which pass through their label target and spacing, DL-006).
- **Observed**: pass (`evidence/interactions.json` playground.table, filters). Changing a select does not change context (DL-008).
- **Automated**: axe label rules; Testing Library `getByRole(name)` queries in the existing tests.

## P-05 Radio groups (RadioGroup composite; Playground boolean editor; theme-studio ChoiceGroup)
- **Intent**: choose one value from a set.
- **Instances**: `/components/radio-group` (list and cards); the Playground Controls table booleans (`ControlsTable.tsx` BooleanControl: native radios inside `role=radiogroup` labelled by the prop name); the theme studio `ChoiceGroup.tsx` (fieldset of radios).
- **Native alternative**: native radios are used throughout.
- **I (APG Radio)**: Tab enters the group once on the checked radio; arrows move and select; Space selects. All of this is native behaviour.
- **Unavailable option with explanation**: a disabled radio with a description. The whole option is dimmed to opacity 0.55, so the description falls to 2.51:1 light and 3.0:1 dark (**A11Y-006**, best practice; the text is exempt under 1.4.3 because it belongs to an inactive control).
- **Visual**: the boolean editor draws focus on the label (`:has(:focus-visible)`) and keeps the checked fill under forced colors (Highlight). Both were verified (`evidence/screenshots/forced-colors-playground-radio.png`).
- **Manual script**: Tab into each group, press the arrows, confirm the checked state is visible and in forced colors.

## P-06 Field (label, hint, error, required)
- **Intent**: data entry with instructions. **Owner**: `src/design-system/composites/Field/Field.tsx`.
- **Model**: `<label for>`; a visual "(required)" note that is aria-hidden, plus the native `required`; a hint and an error joined by `aria-describedby`; `aria-invalid` when there is an error; an icon plus text so the error does not rely on colour.
- **N**: 3.3.1, 3.3.2, 1.3.1, 4.1.2. **I**: Understanding 3.3.2 technique H90 (indicate required fields in the label).
- **Variant gap**: the `Checkbox` primitive has no required cue. Where a checkbox is required, the form's convention breaks (**A11Y-003**).
- **Automated**: `Field.test.tsx`; add `toBeRequired()` assertions for required checkboxes.

## P-07 Form validation with error summary (`/patterns/form-validation`)
- **Intent**: submit, then recover from errors. **Owner**: `src/content/patterns/FormValidation.tsx`.
- **Contract**: `noValidate`; validation only on submit; the summary container (tabIndex −1) takes focus on the next animation frame; each summary link focuses its field; fields re-validate while being edited after the first submit; success appears in a persistent `role=status` ("Demo submission complete. Nothing was sent.").
- **Observed**: pass except A11Y-003 (`evidence/interactions.json` form). What a screen reader says for the focused summary div (it has no role or name) is unverified (LEAD-003).
- **Failure modes**: the summary appearing without a focus move; links that only scroll; error text not associated with the field.
- **Manual script**: submit empty (focus is on the summary with a visible ring), Tab to the first link and press Enter (focus is on the field, which is invalid and described by its error), fix every field and resubmit (status message, form resets).

## P-08 Directory filters and result count (Components index, directory demo)
- **Intent**: search and filter a list, and get feedback on the result count. **Owner**: `src/features/directory/DirectoryFilters.tsx`, `ComponentsIndexPage.tsx`, `ResourceDirectory.tsx`.
- **Semantics**: a `role="search"` landmark with a name; native search input and selects; a `role="status"` count ("Showing 12 of 29 matches, 48 in total").
- **N**: 4.1.3 Status Messages (the count is a status message). **I**: Understanding 4.1.3 (a changed status string is a new message; announce the whole string).
- **Observed**: the count updates on every change and is a live region (pass). "Show more" focuses the first revealed item (pass). The **Clear filters** button removes itself and focus falls to `<body>` (**A11Y-001**).
- **J**: after a clear, focus should go to the Search input.
- **Automated**: Playwright `toBeFocused()` after Clear filters; existing filters unit tests.

## P-09 Toggle buttons (Pin, Playground width presets)
- **Intent**: an on/off action. **Instances**: `EntryCard.tsx` Pin (`aria-pressed`), resource detail Pin, Playground width presets (`aria-pressed`, inside `role=group` "Preview width presets").
- **I (APG Button)**: the label must not change when the pressed state changes.
- **Observed**: the name stays "Pin Alert" and `aria-pressed` toggles (pass; `evidence/interactions.json` filters.directory.pin).

## P-10 Empty state
- **Intent**: explain why nothing is shown and offer a next step. **Owner**: `src/design-system/composites/EmptyState/EmptyState.tsx` (static: a heading, a paragraph and an action).
- **J**: EmptyState should stay static. The template that shows it after an async load has to provide the status message (see P-11). When its action removes the empty state (Clear filters), focus has to be handed on (A11Y-001).

## P-11 Async request status: loading / success / empty / error / retry (pattern demos)
- **Intent**: status and feedback for a simulated request. **Owner**: `src/features/scenarios/*`, `src/content/patterns/ResourceDirectory.tsx`, `ActivityDashboard.tsx`, `ResourceDetail.tsx`.
- **Current model**: the section has `aria-busy` while pending; a conditional `role=status` "Loading …"; skeletons are aria-hidden; an error shows an Alert `role=alert` with a Retry action; success shows the count status (directory and dashboard); after a successful retry, focus moves to the demo heading.
- **N**: 4.1.3 (results of an action and waiting state are status messages). **I**: Understanding 4.1.3, "Removal of status text": when a waiting message disappears, provide an equivalent status.
- **Observed gaps**: the empty outcome (directory, dashboard) and the detail success and empty outcomes produce no status (**A11Y-002**). During a retry, the Retry button unmounts and focus is on `<body>` until success (**A11Y-004**).
- **Unverified (no AT)**: whether live regions that are inserted already filled, or that sit inside `aria-busy`, are announced (LEAD-001, LEAD-002).
- **J (contract to implement)**: one persistent `role=status` per demo whose text changes with each state; focus the demo heading as soon as Retry is pressed; keep the alert for errors.
- **Manual script**: for each page and each scenario, watch the persistent status text change (DevTools Accessibility pane); press Retry, then Tab immediately, and focus should stay inside the demo.
- **Automated**: Testing Library `findByRole('status')` text per scenario; Playwright `toBeFocused()` on the heading during pending.

## P-12 Modal dialog (`Dialog` composite: shortcuts, confirm, failing operation, resource-detail archive)
- **Intent**: a modal task or confirmation. **Owner**: `src/design-system/composites/Dialog/Dialog.tsx`.
- **Native alternative**: native `<dialog>` with `showModal()` is used (inert background, top layer, Escape through `cancel`).
- **I (APG Dialog Modal)**: focus moves into the dialog on open; Tab and Shift+Tab wrap; Escape closes; focus returns to the invoker, or to a logical element if the invoker no longer exists; a visible close button; labelled by its title; `aria-describedby` only for a simple description; initial focus on the least destructive action for irreversible actions.
- **Observed**: pass on every point (`evidence/interactions.json` dialog). `:modal` is true; initial focus is Close (shortcuts) or Cancel (confirm); wrapping works both ways; Escape returns focus to "Show keyboard shortcuts"; the operation error is shown as `role=alert` inside the dialog and focus stays on "Try again"; after success, focus goes to the renamed opener ("Reset example", "Restore Button entry") and a status message reports the result. At 320×256 the dialog fits (288 px wide) and scrolls (`overflow-y: auto`).
- **Failure modes to protect**: opener disabled after confirmation (focus would have nowhere to return); content behind the dialog reachable; the close button with no name (it has `aria-label="Close"`).
- **Automated**: the existing Dialog.test.tsx and e2e dialog tests.

## P-13 Tabs (`Tabs` composite: Tabs docs, resource detail)
- **Intent**: switch between related panels. **Owner**: `src/design-system/composites/Tabs/Tabs.tsx`.
- **I (APG Tabs)**: tablist, tab and tabpanel roles; `aria-selected`; `aria-controls`; panels `aria-labelledby` their tab; Left and Right wrap; Home and End are optional; Tab moves from the active tab to the panel; activation can be automatic.
- **Observed**: pass. Automatic activation, wrapping, Home/End, roving tabindex, Tab goes to the panel (tabIndex 0), Shift+Tab returns to the active tab, the outline is visible, and the direction is mirrored for RTL in code (`evidence/interactions.json` tabs).
- **J**: automatic activation is fine because the panels are already rendered (mounted but hidden).

## P-14 Switch (`Switch` primitive; Playground "Show query containers")
- **Intent**: a setting that applies immediately. **Owner**: `src/design-system/primitives/Switch/Switch.tsx`.
- **I (APG Switch)**: role switch; Space toggles (Enter is optional); a visible label that does not change with the state; a native checkbox uses `checked`.
- **Observed**: pass. A native checkbox with `role="switch"`; Space and Enter both toggle; the label "Compact rows" stays the same; the focus ring is drawn on the track; the off-track measures 4.66:1 (light) and 3.98:1 (dark) against the canvas; the state stays visible in forced colors (`evidence/screenshots/forced-colors-switch-focused-on.png`).

## P-15 Native disclosure (`Disclosure` on `<details>/<summary>`: source viewers, props reference, preview settings)
- **Intent**: show secondary detail on request. **Native**: `<details>` supplies the semantics and keyboard support. **I (APG Disclosure)**: Enter and Space toggle; expanded state is exposed.
- **Observed**: every summary is reachable with a visible outline (inset offset), both forward and reverse (`evidence/interactions.json` tabOrder reverse list).

## P-16 Scrollable regions and data tables (`ScrollRegion`, ApiTable, token tables, Controls table)
- **Intent**: content that does not reflow and scrolls inside the page (1.4.10 exception for two-dimensional data). **Owner**: `src/design-system/layout/ScrollRegion.tsx`.
- **Model**: `role=region`, tabIndex 0, a name required by the TypeScript type, focus drawn inside. Tables have `th` with scope; the Controls table keeps explicit roles when narrow layouts restyle its rows as blocks (LEAD-004 is unverified without AT).
- **Observed**: 0 px page overflow at 320 on every route. Two duplicate region names (**A11Y-007**). The axe `th-has-data-cells` result was dismissed: rowgroup headers are valid (DL-004).
- **I (APG landmark regions)**: repeated landmark roles should have unique labels.

## P-17 Theme studio (`/foundations/theme-studio`) colour ramp and contrast tools
- **Intent**: generate a brand palette and inspect it (content plus controls). **Owner**: `src/features/theming/*`.
- **Observed**: axe is clean; the controls are native fieldset radio groups and inputs; CopyButton reports through a VisuallyHidden `role=status`. The ramp strip's chroma labels are cut off with an ellipsis when the 1.4.12 spacing is applied (**A11Y-005**, N: 1.4.12; I: Understanding 1.4.12, "Use of ellipses").
- **Gap**: the colour-picker and export workflows got only light manual testing (see the audit, section 11).

## P-18 Display modes (product, theme, density; forced colors; reduced motion)
- **Intent**: adapt the presentation. **Owner**: `ThemeProvider.tsx`, the tokens, `base.css`.
- **Observed**: the choices persist in localStorage and are applied after reload (`system-lab:theme`/`product`/`density`). The focus ring is at least 3.55:1 against the canvas in every product and theme. Under reduced motion, 0 elements keep transitions or animations longer than 0.001 s (Skeleton shimmer and the button spinner infinite animations are neutralised by the reduced-motion rule in `base.css`). Under forced colors, boundaries stay visible.
- **Automated**: `contrast.test.ts` (534 token pairs, as claimed in docs/accessibility.md; not re-run here); the axe sweep across products, themes and density.
