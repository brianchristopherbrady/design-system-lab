# Accessibility audit: Design System Lab

Auditor: accessibility-auditor (Agent 1), read-only. Date: 2026-10-12. Target: WCAG 2.2 Level AA.
The issue ledger [accessibility-issues.json](accessibility-issues.json) is the only place issue status is kept. This document explains the findings and refers to ledger IDs.

## 1. Executive summary

The site is **largely clean**. Its built-in decisions (native `<dialog>`, ARIA tabs with roving tabindex, native checkbox switch, focus moved to the `h1` after navigation, a focus-receiving error summary, token-tested contrast, and handling for reduced motion and forced colors) held up in rendered keyboard testing in Microsoft Edge. Across 148 route × mode axe scans, the only WCAG-tagged violation was one color-contrast node on the disabled radio option description. In the rendered UI it was confirmed as exempt under 1.4.3 and is recorded as best practice A11Y-006. The two other axe rules flagged were best-practice only. `npm run lint` passes.

There are **8 confirmed issues**. None is critical or high:

| ID | Severity | Classification | Criterion | Summary |
| --- | --- | --- | --- | --- |
| A11Y-001 | medium | best practice | (2.4.3 reviewed, not failed) | "Clear filters" removes itself and focus falls to `<body>` |
| A11Y-002 | medium | **WCAG failure** | 4.1.3 Status Messages (AA) | Empty and resource-detail load outcomes are not announced |
| A11Y-003 | low | **WCAG failure** | 3.3.2 Labels or Instructions (A) | Required confirmation checkbox is not marked required |
| A11Y-004 | low | best practice | — | Focus sits on `<body>` while Retry is loading |
| A11Y-005 | low | **WCAG failure** | 1.4.12 Text Spacing (AA) | Theme-studio chroma labels are cut off with an ellipsis when text spacing is increased |
| A11Y-006 | low | best practice | (1.4.3 exempt) | Reason text for a disabled radio option is at 2.5:1 |
| A11Y-007 | low | best practice | — | Duplicate region names ("Usage", "Release history") |
| A11Y-008 | low | best practice | — | Heading skips from h2 to h4 on the Products foundation |

There are 4 unconfirmed leads (all need a screen reader) and 8 dismissed leads, all in the ledger. **No screen reader was available** (program blocker BLK-001). No claim about screen-reader output is made, and this audit does not claim WCAG conformance.

## 2. Product, scope and exclusions

- Product: a design-system learning site, built with React 19.3 + Vite 7.3 + react-router 7.18 as a single-page app, styled with CSS modules and generated tokens. There are no accounts, no back end and no real data. All of the "requests" are simulated (`src/features/scenarios/simulateRequest.ts`), so every flow is safe to run.
- Routes covered (55 concrete URLs found from the navigation links): `/`, `/foundations` plus 11 topics, `/components` plus 29 components, `/playground` (`?component=` for button, card, dialog, badge), `/patterns` plus 4 patterns, `/decisions` plus 4 decisions, and an unknown path (404). The full list is in `evidence/axe-sweep.json` → `routes`.
- Workflows covered: shell navigation and display settings, component docs and their live demos (dialog, tabs, switch, field, radio group, disclosure), the Playground (editing props, presets, sharing, resuming from a link, the copy-failure path), and the pattern demos (directory filters, resource detail, activity dashboard, scenario loading/empty/error/retry, the form-validation process from errors through to success).
- Exclusions (from the ledger scope): external links (portfolio, GitHub), and third-party fonts beyond how they render.
- Repository state: the audit started on a tree with uncommitted user changes. During the audit the user committed them as `42d9d01` and then added `260b98f` and `f71814a` (content and styles for the decisions pages only). Every file and line cited was re-read at HEAD `f71814a`, and the `/decisions` routes were re-swept afterwards (`evidence/decisions-recheck.json`: 0 violations, no overflow at 320 px, every focus stop outlined). The auditor did not stash, check out or reset anything.

## 3. Environments, states and responsive coverage

| Item | Value |
| --- | --- |
| OS | Windows NT 10.0.26300.0 |
| Browser | Microsoft Edge 155.0.4283.45, through Playwright 1.64.0 (`channel: 'msedge'`) |
| Runtime | Node.js 24.19.0; the Vite dev server that was already running on :5173 |
| Automated | axe-core 4.13.0 (@axe-core/playwright 4.13.0); eslint-plugin-jsx-a11y 6.10.2 |
| Viewports | 1280×900, 1280×720, 1440×600, 1024×768, 640×450 (200% zoom), 375×700, 320×256 and 320×640 (400% zoom) |
| Modes | light/dark × Design System Lab/Harbor/Meadow × comfortable/compact; forced colors on; reduced motion; 1.4.12 text-spacing CSS |
| AT | **none** (see limitations) |

States exercised: dialogs (open, Escape, confirm, operation error then retry, and at 320×256), tabs, switch on/off, form (empty submit, error summary links, fixing the fields, success), directory (filter, no results, show more, pin, clear), all scenario states on the three pattern pages including retry and reset, Playground (select, text and boolean edits, width-preset aria-pressed state and range aria-valuetext inspected but not operated, copy link, copy failure, resume in a fresh context, switching component), the shell display settings and the section-navigation disclosure at 375 px, browser Back/Forward, and the 404 page.

## 4. Tools, method and limitations

Scripts (run from the repo root; outputs are in `evidence/`):

- `scripts/axe-sweep.mjs` → `axe-sweep.json` / `.log`: every route in lab-light and lab-dark, plus every third route in harbor-dark-compact and meadow-light.
- `scripts/baseline.mjs` → `baseline.json`: title, lang, h1, heading skips, landmarks, overflow at 1280/640/320, 1.4.12 spacing at 1280/320, and targets under 24 px.
- `scripts/interactions.mjs` → `interactions.json` plus screenshots: Tab order forward and reverse with computed outlines, focus after route change, dialog lifecycle, tabs, switch, form, filters, scenarios, Playground, shell settings, forced colors and reduced motion.
- `scripts/leads.mjs`, `leads2.mjs`, `obscured.mjs`, `focus-loss.mjs`, `empty-state.mjs`, `th-lead.mjs`, `history-focus.mjs`, `decisions-recheck.mjs`: targeted checks that confirmed or dismissed individual leads.
- `npm run lint` → `lint.log` (exit 0: ESLint with jsx-a11y, token check, boundary check, style check).

Limitations:

- **No screen reader** (NVDA, JAWS, Narrator, VoiceOver, TalkBack). Announcements were inferred from live-region DOM mutations and Playwright ARIA snapshots.
- Zoom was approximated by viewport size (CSS-pixel equivalents); real browser zoom and OS text scaling were not used.
- Forced colors was Chromium emulation only; no real Windows contrast theme. Reduced motion was emulated.
- Firefox, Safari and real touch devices were not tested. Pointer gestures were reviewed in code (no drag or path gestures exist).
- The existing e2e and Vitest suites were not re-run (the production-build e2e webServer would start a second server; that was not needed for the audit). `docs/accessibility.md` claims they pass. That claim was not used as evidence.
- Every WCAG 2.2 criterion and APG page cited was opened on 2026-10-12. Excerpts are saved in `evidence/wcag22-normative-excerpts.txt` and `evidence/apg-and-understanding-excerpts.txt`.

## 5. Baseline results (tested, with outcome)

| Area | Result | Evidence |
| --- | --- | --- |
| Page titles | Unique and descriptive on all 55 routes, updated on client navigation ("Patterns · Design System Lab"); 404 is "Page not found · …" | baseline.json, interactions.json routeFocus |
| Language | `lang="en"` on every route | baseline.json |
| Landmarks | banner, nav "Sections", contextual nav, main, "On this page" nav, contentinfo; search landmark on the filter pages; named complementary asides | baseline.json |
| Headings | One h1 per route; one skip (A11Y-008) | baseline.json |
| Skip link | First Tab stop, visible on focus, moves focus to main | interactions.json, screenshots/skip-link-focus.png |
| Tab order and visible focus | Forward and reverse orders match the visual order; 0 focus stops without an outline (2px solid focus ring; a different ring colour per product, e.g. rgb(20,184,166) in Harbor) | interactions.json tabOrder, focus.noOutline [] |
| Focus after route change | Moves to the new h1 (link click, sidebar, Back/Forward); a query-only change keeps focus; Back to the first history entry acts like a page load (DL-007) | interactions.json, history-focus.json |
| Focus not obscured | Sticky Playground preview never fully covers a focused control after scrolling settles (DL-001) | obscured.json |
| Dialog | Matches the APG contract: modal (`:modal` true), labelled by its title (aria-describedby set only when a description exists; the shortcuts dialog has none), initial focus (Close / Cancel), Tab and Shift+Tab wrap, Escape closes, focus returns to the opener; error stays in the dialog as role=alert; after confirm, focus is on the renamed opener; scrolls at 320×256 | interactions.json dialog, screenshots/dialog-*.png |
| Tabs | Arrows wrap, Home/End work, automatic activation, roving tabindex; Tab goes to the panel | interactions.json tabs |
| Switch | Native checkbox with role=switch; Space and Enter both toggle; label stays constant; focus ring drawn on the track; visible in forced colors | interactions.json switch, screenshots/forced-colors-switch-focused-on.png |
| Form validation | Summary takes focus; links move focus to the fields; aria-invalid and the error are linked by aria-describedby; success is a status message; one gap: the checkbox is not marked required (A11Y-003) | interactions.json form, leads.json formCheckbox |
| Directory filters | The count is a role=status that updates on every keystroke and filter change; "Show more" moves focus to the first newly revealed item; Pin is a toggle (aria-pressed) with a stable name; Clear filters loses focus (A11Y-001) | interactions.json filters, focus-loss.json |
| Scenario states | Loading is a status, error is an alert, success is the count status; a successful retry moves focus to the heading; empty and detail outcomes are not announced (A11Y-002); focus drops while Retry loads (A11Y-004) | interactions.json scenarios, empty-state.json |
| Playground | The Controls table names every editor from its prop name plus its description; booleans are native radios; edits update the snippet and URL; copy link reports through a status, and on failure focuses and selects a read-only link field; a link resumes correctly in a fresh context; the range control has aria-valuetext; width presets use aria-pressed | interactions.json playground |
| Reflow 320 / 200% / 400% | 0 px page-level horizontal scroll on all 55 routes at 320 and 640 wide; dialog scrolls within 320×256 | baseline.json, interactions.json dialog320 |
| Text spacing (1.4.12) | No page overflow; one truncation failure (A11Y-005); the Display summary ellipsis can be revealed (DL-005) | baseline.json, leads.json, leads2.json |
| Target size 24 px | All controls pass size or spacing, including 20 px checkboxes and radios, which have full-row labels (DL-006) | leads.json targets |
| Contrast (outside tokens) | Header selects 19.57/15.98:1; readouts 7.52/17.13:1; input borders 4.66 (light) and 3.98 (dark) against the canvas; focus ring at least 3.55:1 against the canvas in every product; switch off-track 4.66/3.98; the one low value is a disabled-option description (A11Y-006) | leads.json contrast, leads2.json, history-focus.json |
| Forced colors / reduced motion | Boundaries, the switch state and the selected boolean radio stay visible; 0 elements left with transition or animation over 0.001 s under reduced motion | interactions.json forcedColorsReducedMotion, screenshots/forced-colors-*.png |
| Lint | `npm run lint` exit 0 | lint.log |

## 6. Intent-based pattern inventory (summary)

The full matrix, with contracts, is in [accessibility-pattern-matrix.md](accessibility-pattern-matrix.md). It has 18 pattern rows (P-01 to P-18). They cover navigation (shell nav, section-nav disclosure, skip link, on-this-page), actions (Button, toggle buttons with aria-pressed, Copy), entry and selection (Field, Input, Select, Checkbox, RadioGroup, the native-radio boolean editor, range), composite widgets (modal Dialog, Tabs, Switch, native `<details>` Disclosure), status and feedback (Alert, role=status counts, scenario states, error summary), and content (tables, ScrollRegion, EmptyState, Skeleton). No menu, menubar, listbox, custom combobox, grid, tree, toolbar, tooltip, carousel or custom slider exists. The "combobox" role that appears comes from native `<select>`, and the slider is a native `<input type=range>`.

## 7. Findings by root cause

1. **Self-removing controls without a focus handoff** (A11Y-001, A11Y-004). Shared cause: conditionally rendered action buttons (Clear filters, Retry) unmount while focused. Layer: the DirectoryFilters composite plus the pattern templates. Affected: keyboard, screen-reader and magnifier users.
2. **Async outcome is not exposed as a status** (A11Y-002). Shared cause: the loading live region is mounted only while pending, and empty or detail outcomes add no status. Layer: the pattern templates and the scenarios feature. Affected: screen-reader users.
3. **Input requirements not stated** (A11Y-003). Cause: the Checkbox primitive has no required cue, unlike Field. Layer: primitive.
4. **Truncation under user spacing** (A11Y-005). Cause: nowrap with an ellipsis in fixed-width grid columns. Layer: page CSS.
5. **Dimming applied to explanatory text** (A11Y-006). Cause: opacity is set on the whole option container in RadioGroup. Layer: composite.
6. **Naming and outline hygiene** (A11Y-007, A11Y-008). Layer: page and content.

## 8. Severity and priority method

Severity follows the artifact contract. Critical means it blocks a critical process or traps the user. High means a major feature is unusable or the defect is systemic. Medium means a meaningful barrier with a workaround. Low means limited friction or a best practice. Priority is ranked separately in the ledger and weighs reach (shared components first), workflow importance, how many users are affected, and fix leverage. That is why A11Y-001 (best practice, shared DirectoryFilters, the Components landing page) ranks above A11Y-002 even though A11Y-002 is a conformance failure. Both are medium, and A11Y-001 reaches the main navigation workflow with one change. The gate may reorder these.

Classification note: A11Y-001 and A11Y-004 were checked against 2.4.3 Focus Order. They are recorded as best practice because Edge kept a logical next and previous Tab destination after focus fell to `<body>`. A11Y-006 was checked against 1.4.3 and is exempt because the text belongs to an inactive component. These calls are explained in each ledger entry's `bestPracticeRationale` and are open to review at the gate.

## 9. Quick wins vs systemic fixes

- Quick wins (one file each): A11Y-003 (Checkbox `required` plus its label cue), A11Y-005 (stripMeta CSS), A11Y-006 (RadioGroup opacity selector), A11Y-007 (two aria-labels), A11Y-008 (heading level).
- Small systemic fixes (shared code): A11Y-001 (a focus handoff in DirectoryFilters used by both pages), A11Y-002 together with A11Y-004 (one persistent status plus early heading focus across the three pattern demos, ideally through a small shared helper in `features/scenarios`).

## 10. Sources consulted and contracts

All opened on 2026-10-12.

- WCAG 2.2 Recommendation, normative: https://www.w3.org/TR/WCAG22/. The SC text for 1.3.1, 1.4.3, 1.4.10, 1.4.11, 1.4.12, 2.4.2, 2.4.3, 2.4.7, 2.4.11, 2.5.8, 3.3.1, 3.3.2, 4.1.2 and 4.1.3 was extracted to `evidence/wcag22-normative-excerpts.txt`.
- Understanding WCAG 2.2, informative: focus-order, status-messages, text-spacing, contrast-minimum, labels-or-instructions, error-identification, info-and-relationships, focus-not-obscured-minimum, target-size-minimum, reflow (all at https://www.w3.org/WAI/WCAG22/Understanding/<slug>.html).
- ARIA APG, informative: dialog-modal, tabs, switch, disclosure, radio, button (https://www.w3.org/WAI/ARIA/apg/patterns/<name>/), plus the practices pages landmark-regions and keyboard-interface.
- MDN ARIA status role, informative: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role.
- Research limitation: the APG Tabs page opened through web_fetch returned only its intro, so its keyboard and ARIA sections were read from the raw HTML (excerpt saved). No source was unavailable.

Contracts per pattern, with normative obligations, informative guidance and engineering judgment kept separate, are in the pattern matrix.

## 11. Coverage gaps

Screen-reader output, real zoom, real Windows contrast themes, Firefox and Safari, touch devices, and the existing automated suites were not run (see section 4). The Theme Studio was covered by axe, structure, reflow, spacing and keyboard Tab order, but its colour-picker and export workflows got only light manual testing (the copy button's status was reviewed in code: `CopyButton.tsx` uses a VisuallyHidden role=status).

## 12. Recommended remediation order

1. A11Y-001: shared DirectoryFilters focus handoff (Components index and directory).
2. A11Y-002 and A11Y-004 together: a persistent outcome status and early heading focus in the three pattern demos.
3. A11Y-003: Checkbox required support (primitive).
4. A11Y-006: RadioGroup disabled-description contrast (composite).
5. A11Y-005: theme-studio strip truncation.
6. A11Y-007 and A11Y-008: naming and outline hygiene.

## 13. Handoff acceptance and decisions

Not yet accepted. Gate acceptance, the approved IDs and the artifact identifiers go in `handoff` in the ledger. Decisions the gate needs to make:

- Confirm the best-practice classifications of A11Y-001, A11Y-004 and A11Y-006, or reclassify them.
- Decide how to handle BLK-001: provide a screen reader, or accept DOM-level verification for A11Y-001, A11Y-002, A11Y-004 and LEAD-001 to LEAD-004.
- A11Y-004 has two options: early heading focus (recommended) or keeping the alert mounted with Retry in a loading state. The second is a visual change that needs product agreement.
