# Accessibility test plan: Design System Lab

Written by the accessibility-auditor (Agent 1) on 2026-10-12, for the remediation engineer and the independent verifier. Issue status is kept only in [accessibility-issues.json](accessibility-issues.json). The "Baseline outcome" column records what the audit run observed. It is evidence, not issue status. Paths are relative to `docs/accessibility/`.

## 1. Environments

| ID | Environment | Used for | Status |
| --- | --- | --- | --- |
| E1 | Windows NT 10.0.26300.0; Microsoft Edge 155.0.4283.45 via Playwright 1.64.0 (`channel: 'msedge'`); Node 24.19.0; Vite 7.3.7 dev server at http://localhost:5173 | All audit checks | Run |
| E2 | E1 with `forcedColors: 'active'` and `reducedMotion: 'reduce'` emulation | Forced colors and motion | Run (emulation only) |
| E3 | E1 with injected 1.4.12 CSS: `* { line-height:1.5!important; letter-spacing:0.12em!important; word-spacing:0.16em!important } p { margin-bottom:2em!important }` | Text spacing | Run |
| E4 | NVDA, JAWS, Narrator or VoiceOver with a browser | Announcements, focus-loss effects | **Not run, not available** (BLK-001) |
| E5 | Firefox, Safari, real touch device, real browser zoom, real Windows contrast theme | Cross-browser checks | **Not run** |

Viewports: 1280×900 (default), 1280×720, 1440×600, 1024×768, 640×450 (200% zoom of 1280×900), 375×700, 320×640 and 320×256 (400% zoom). Modes, set through localStorage before load: `system-lab:theme` light|dark, `system-lab:product` system-lab|harbor|meadow, `system-lab:density` comfortable|compact.

## 2. Automated commands

Run from the repository root while the dev server is running.

| Command | Purpose | Baseline outcome | Evidence |
| --- | --- | --- | --- |
| `npm run lint` | ESLint with jsx-a11y, tokens:check, boundaries, styles | Exit 0 | evidence/lint.log |
| `node docs/accessibility/evidence/scripts/axe-sweep.mjs > docs/accessibility/evidence/axe-sweep.json` | axe WCAG 2.0–2.2 A/AA and best practice on 55 routes: lab-light and lab-dark in full; harbor-dark-compact and meadow-light on every third route | 148 scans, 136 clean; 0 WCAG violations except the exempt color-contrast item (A11Y-006); best practice: landmark-unique (A11Y-007), heading-order (A11Y-008) | evidence/axe-sweep.json, .log |
| `node docs/accessibility/evidence/scripts/baseline.mjs > …/baseline.json` | Titles, lang, h1, heading skips, landmarks, overflow at 1280/640/320, spacing, targets | 0 page overflow; 1 heading skip; undersized checkboxes and radios pass by spacing | evidence/baseline.json |
| `node docs/accessibility/evidence/scripts/interactions.mjs > …/interactions.json` | Keyboard and focus flows (section 4) | See per-check outcomes | evidence/interactions.json, screenshots/ |
| `node docs/accessibility/evidence/scripts/leads.mjs` / `leads2.mjs` | Lead confirmation: contrast, targets, spacing, regions, headings | See issues | evidence/leads.json, leads2.json |
| `node docs/accessibility/evidence/scripts/obscured.mjs` | Focus not obscured by the sticky Playground preview (900 ms settle) | 0 fully or partially obscured steps | evidence/obscured.json |
| `node docs/accessibility/evidence/scripts/focus-loss.mjs` | Focus after Clear filters and Retry | Body focus reproduced (A11Y-001, A11Y-004) | evidence/focus-loss.json |
| `node docs/accessibility/evidence/scripts/empty-state.mjs` | Live regions after the Empty scenario | No live region (A11Y-002) | evidence/empty-state.json |
| `node docs/accessibility/evidence/scripts/decisions-recheck.mjs` | Re-sweep of /decisions after the user's mid-audit commits | 0 violations, 0 overflow, 0 unoutlined stops | evidence/decisions-recheck.json |
| `npm test` (Vitest) and `npm run test:e2e` (Playwright, production build on :4173) | Existing regression suites | **Not run in this audit** (the e2e config builds and starts a second server). The verifier should run both after remediation. | — |

Note: smooth scrolling (`scroll-behavior: smooth`) is on unless reduced motion is set. Probes that measure positions after Tab must wait about 900 ms, or emulate `reducedMotion: 'reduce'`. Otherwise the readings are taken mid-scroll (that is how DL-001 came about).

## 3. Issue matrix: reproductions and acceptance criteria

The full reproduction steps and acceptance criteria are in the ledger and are copied here so they stay fixed for verification.

### A11Y-001: Clear filters drops focus to body (medium, best practice)
- **Reproduce** (E1, keyboard): open `/components?q=zzzz`, Tab to either "Clear filters" and press Enter; `document.activeElement` is `<body>` and no focus ring is visible. Repeat on `/patterns/resource-directory` with scenario "No results".
- **Accept**: (1) after either button on both pages, activeElement is a visible element inside main (expected: the Search input) with an outline that is not `none`; (2) the count status reads "Showing 29 of 29" (Components) or "Showing 12 of 48 entries" (directory); (3) activeElement is never body (automated).
- **Automated**: Playwright `expect(getByRole('searchbox', { name: 'Search' })).toBeFocused()` after Enter or Space on each button; Vitest on DirectoryFilters with a stateful wrapper.
- **Manual**: E1 at 1280×900 and 320×640 (the focused input scrolls into view); E4 if available.
- **Baseline**: failed, `evidence/focus-loss.json`.

### A11Y-002: Load outcome not announced for Empty and resource detail (medium, 4.1.3 AA)
- **Reproduce** (E1): on `/patterns/resource-directory`, `/patterns/activity-dashboard` and `/patterns/resource-detail`, choose Demo scenario Empty (and Success on detail). Only "Loading …" is added as a status; the outcome adds none, or adds an empty status.
- **Accept**: (1) a persistent `role=status` (present before the change) gets a non-empty outcome text for directory Empty, dashboard Empty, detail Success and detail Empty; (2) no outcome produces only an empty status insertion; (3) focus stays on the Demo scenario select; (4) the existing counts and alerts still appear exactly once.
- **Automated**: Testing Library `findByRole('status')` per scenario, asserting the same node persists; Playwright status text per page; rerun `interactions.mjs` section 8 and expect `TEXT` changes on a persistent status.
- **Manual**: E1 DevTools Accessibility pane; E4 to confirm speech (blocked).
- **Baseline**: failed, `evidence/interactions.json` (scenarios), `evidence/empty-state.json`.

### A11Y-003: Required checkbox not identified (low, 3.3.2 A)
- **Reproduce** (E1): on `/patterns/form-validation`, four labels show "(required)" and the checkbox does not; the checkbox has `required=false`; an unchecked submit reports an error.
- **Accept**: (1) the label visibly shows "(required)" in the same style before submit; (2) `required` or `aria-required="true"` is exposed; (3) the error and summary behaviour is unchanged; (4) other Checkbox instances are unchanged.
- **Automated**: `expect(getByRole('checkbox', { name: /I searched the directory/ })).toBeRequired()`.
- **Manual**: E1 read-through, then the keyboard submit and summary-link flow.
- **Baseline**: failed, `evidence/leads.json` formCheckbox, `screenshots/form-errors-full.png`.

### A11Y-004: Focus on body during Retry (low, best practice)
- **Reproduce** (E1): scenario Error, then Enter on Retry; 150 ms later activeElement is body; Tab goes past the demo.
- **Accept**: (1) 150 ms after Enter on Retry, focus is on the demo heading (or another in-demo element) on all three pages; (2) after success, focus is on the heading with an outline; (3) Tab during loading stays inside the demo.
- **Automated**: Playwright `toBeFocused()` on the heading during pending; Vitest with fake timers.
- **Baseline**: failed, `evidence/focus-loss.json` retry.

### A11Y-005: Theme studio chroma truncation under text spacing (low, 1.4.12 AA)
- **Reproduce** (E3 at 1280×900): on `/foundations/theme-studio`, all 12 "C 0.0xx" ramp labels end in an ellipsis; there is no way to reveal them.
- **Accept**: (1) with E3 at 1280×900, 640×450 and 320×640, 0 of 24 `[class*=stripMeta]` have scrollWidth > clientWidth + 1 and the full text is visible; (2) no page overflow at 320 without overrides.
- **Automated**: Playwright `addStyleTag` with the E3 CSS and a scrollWidth check.
- **Baseline**: failed, `evidence/leads2.json` themeStudioStrip, `screenshots/theme-studio-ramp-after-spacing.png`.

### A11Y-006: Disabled-option description contrast (low, best practice)
- **Reproduce** (E1): on `/components/radio-group`, "Fully booked this week." measures 2.51:1 light and 3.0:1 dark in every product.
- **Accept**: (1) at least 4.5:1 in all six product × theme combinations (axe color-contrast clean); (2) the disabled radio and its label are still visibly dimmed and the radio is still disabled.
- **Automated**: the axe sweep on `/components/radio-group`; `leads.mjs` section J.
- **Baseline**: failed, `evidence/leads.json` radioDisabled.

### A11Y-007: Duplicate region names (low, best practice)
- **Reproduce**: ariaSnapshot of main on `/playground?component=button` (two "Usage" regions) and on `/components/scroll-region` (two "Release history" regions).
- **Accept**: (1) axe landmark-unique is clean on both pages in all four sweep combinations; (2) every region name on those pages is unique.
- **Automated**: axe with best-practice tags; `getByRole('region', { name: 'Usage' })` count is 1.
- **Baseline**: failed, `evidence/leads.json` regions.

### A11Y-008: Heading skip on Products foundation (low, best practice)
- **Reproduce**: the heading list on `/foundations/products` goes from h2 "Products × themes" to h4 "Pending approvals".
- **Accept**: (1) the baseline heading-skip scan returns [] for this route; (2) axe heading-order is clean.
- **Baseline**: failed, `evidence/baseline.json`, `evidence/leads.json` productsHeadings.

## 4. Pattern and workflow regression checks

The verifier must re-run these after any remediation to catch regressions. Each was run in the audit (E1 unless stated otherwise).

| Check | Steps | Expected | Baseline outcome | Evidence |
| --- | --- | --- | --- | --- |
| W1 Shell Tab order | Load `/components/button`; Tab 40 times; then Shift+Tab 25 times from the last footer link | Skip link → brand → 6 section links → Product/Theme/Density → sidebar; reverse order mirrors it; every stop outlined | Pass | interactions.json tabOrder.* |
| W2 Skip link | First Tab, then Enter | Link visible; focus on main | Pass | screenshots/skip-link-focus.png |
| W3 Route focus | Enter on the "Patterns" section link; sidebar link; Back; Forward | h1 focused; title "X · Design System Lab"; first history entry acts like a page load | Pass (DL-007 noted) | interactions.json routeFocus, history-focus.json |
| W4 Dialog lifecycle | `/components/dialog`: open shortcuts (Enter), Tab ×5, Shift+Tab ×5, Escape; confirm dialog, Tab and Enter on Archive; failing dialog, Delete, then Try again; repeat at 320×256 | Initial focus Close/Cancel; wraps; Escape returns focus to the opener; error is a role=alert in the dialog, focus on Try again; success returns focus to the opener with a status; scrolls at 320×256 | Pass | interactions.json dialog, screenshots/dialog-*.png |
| W5 Tabs | `/components/tabs`: focus Usage; Right ×3, Left, Home, End; Tab; Shift+Tab | Wraps; selection follows focus; panel focused; return to the active tab | Pass | interactions.json tabs |
| W6 Switch | `/components/switch`: focus; Space; Enter; repeat in E2 | Toggles; label constant; ring on the track; visible in forced colors | Pass | interactions.json switch, screenshots/forced-colors-switch-focused-on.png |
| W7 Form | `/patterns/form-validation`: Enter on Submit; Tab; Enter on the first link; fix all fields; submit | Summary focused; field focused, invalid and described; success status | Pass except A11Y-003 | interactions.json form |
| W8 Filters | `/components`: type "but"; then "zzzz"; Clear filters. `/patterns/resource-directory`: type filter, Show more, Pin | Count status updates; Show more focuses the first new item; Pin keeps its name and toggles aria-pressed | Pass except A11Y-001 | interactions.json filters |
| W9 Scenarios | Each pattern page: every Demo scenario option; Error then Retry; Reset demo | Loading status; error alert; success count; heading focused after retry | Pass except A11Y-002, A11Y-004 | interactions.json scenarios |
| W10 Playground edit, share, resume | `/playground?component=button`: ArrowDown on appearance; type into children; ArrowRight on the fullWidth radio; Copy example link; open the copied URL in a new context; repeat copy with no clipboard API | Snippet and URL update; status "Example link copied."; resume restores the props; failure focuses and selects the read-only link input | Pass | interactions.json playground |
| W11 Sticky preview focus | `obscured.mjs` at 1440×600, 1280×720, 1280×900, reverse Tab through the Controls table | No focused control fully covered by the preview panel | Pass (DL-001) | obscured.json |
| W12 Shell settings at 375 px | Display toggle with Enter, Tab, change all three selects, reload; section nav toggle | aria-expanded updates; selects reachable; values persist | Pass | interactions.json shellSettings |
| W13 Reflow | baseline.mjs at 320×256/640 and 640×450 | 0 px page overflow on all 55 routes | Pass | baseline.json |
| W14 Text spacing | E3 on all routes at 1280 and 320 | No loss of content | Pass except A11Y-005 (DL-005 accepted) | baseline.json, leads.json, leads2.json |
| W15 Target size | leads.mjs section B at 320 and compact | Each target ≥ 24 px or passes spacing | Pass (DL-006) | leads.json targets |
| W16 Non-token contrast | leads.mjs C, leads2.mjs, history-focus.mjs | Text ≥ 4.5:1; UI and focus ≥ 3:1 | Pass except A11Y-006 (exempt) | leads.json contrast, leads2.json |
| W17 Forced colors and reduced motion | interactions.mjs section 11 (E2) | Boundaries and states visible; 0 long-running animations | Pass (emulation) | interactions.json forcedColorsReducedMotion, screenshots/forced-colors_*.png |
| W18 axe across modes | axe-sweep.mjs | No new violations | 3 rule ids, all mapped to issues | axe-sweep.json |
| W19 Lint | `npm run lint` | Exit 0 | Pass | lint.log |
| W20 Screen-reader pass | NVDA + Edge: shell, dialog, tabs, switch, form summary, filters count, all scenario states, Playground table at 375 px | Names, roles and states announced; status messages spoken without focus moving | **Not run** (BLK-001); covers LEAD-001 to LEAD-004 | — |
| W21 Cross-browser and zoom | Firefox, Safari, real 200% and 400% browser zoom, Windows contrast theme | Same as W1–W17 | **Not run** | — |

## 5. Unconfirmed leads (no issue raised; need E4)

| Lead | What to test | Expected |
| --- | --- | --- |
| LEAD-001 | Live regions inserted already populated (loading statuses, the filter count on mount, alerts) | Spoken on insertion in NVDA, JAWS and Narrator with Edge/Firefox |
| LEAD-002 | Loading status inside `section[aria-busy=true]` | Spoken while busy; if suppressed, move the status outside the busy section |
| LEAD-003 | Focused error summary div (no role or name) | Summary title and items announced on focus |
| LEAD-004 | Controls table semantics in the narrow block layout | Table, row and column headers navigable |

## 6. Limitations

No assistive-technology testing was done. Zoom was tested through equivalent viewports, not real browser zoom. Forced colors and reduced motion were emulated. Only Edge (Chromium) was used. The existing Vitest and e2e suites were not re-run by the auditor. The repository changed during the audit (commits `42d9d01`, `260b98f`, `f71814a`); findings were re-read at `f71814a` and /decisions was re-swept. These gaps must not be reported as passes.
