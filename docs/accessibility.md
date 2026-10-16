# Accessibility: target, decisions and verification record

**Target:** WCAG 2.2 level AA. This is a goal, not a conformance claim — the checks below are what
was actually done, and the gaps are listed.

## Built-in decisions

- Landmarks: one banner, a "Sections" navigation, a contextual section navigation (Foundations,
  Components or Patterns), an "On this page" navigation on documentation pages, one main and one
  contentinfo. Documentation sections are not landmarks.
- One `h1` per page (PageHeader); `Heading` requires an explicit `level` and sizes independently.
- Skip link first. After client-side navigation, focus moves to the new `h1` (or to a URL
  fragment's target) and `document.title` updates; query changes do not move focus.
- Focus is handed on deliberately: after a successful Retry the demo heading receives focus;
  every Clear filters button moves focus to the Search input before it disappears;
  dialog openers stay enabled after confirmation (Archive becomes Restore) so focus restoration
  always has a target; the form error summary receives focus and links to each field.
- Dialog: native `showModal()` (inert background, top layer), labelled by its title and described
  by its description, initial focus on the first control or a chosen element (Cancel for
  confirmations), Tab/Shift+Tab wrap inside the dialog, Escape closes through `onClose`, focus
  returns to the opener, operation errors stay inside the dialog in a `role="alert"` Alert.
- Tabs: ARIA tabs pattern with roving tabindex, arrow keys (reversed in right-to-left), Home/End
  and focusable panels.
- Switch is a native checkbox with `role="switch"`; Checkbox, Select, Input and Progress are native.
- Status is never color alone: Badge and Alert state their meaning in text, Alert adds an icon,
  field errors add an icon and text, inline links and the current navigation item are underlined.
- Every foreground/background pair (text and tones on every surface, button labels in every state,
  filled and subtle badges, borders, focus ring, switch track) is unit-tested in every product and
  theme. The theme studio applies the same checks to generated brands before export.
- `prefers-reduced-motion: reduce` removes transitions and animations (Dialog entry, Skeleton
  shimmer, Switch thumb, Button spinner speed).
- `forced-colors: active`: buttons always draw a system border, Switch and Tabs use system colors,
  Skeleton shapes get outlines.
- `rem`-based type, spacing and query thresholds. Medium and large controls are at least 44px tall
  in the comfortable density; the compact density brings them to 36px and 44px, and small controls
  to 28px (all above the 24px minimum).
- Scrollable tables and code blocks are focusable regions with accessible names.
- Skeletons are `aria-hidden`; loading is shown with `aria-busy`. Each pattern demo has one persistent status
  message (in ScenarioDemo, outside the busy section) that reports loading and then the outcome
  (for example "No entries yet." or "Button entry loaded."); success counts and error alerts report the rest.

## Verification performed

Environment: Windows, Node 24, Microsoft Edge (Chromium) driven by Playwright 1.64
(`PLAYWRIGHT_CHANNEL=msedge`) against the production build; jsdom for unit tests.

| Check | Method | Result |
| --- | --- | --- |
| Roles, names, descriptions, states | Vitest + Testing Library by role and name (Button, Link, Field, Dialog, Tabs, EntryCard, ScenarioDemo, all playground stories) | Pass |
| Token contrast, every product and theme | `contrast.test.ts`, 534 pairs | Pass |
| Automated WCAG 2.0/2.1/2.2 A and AA rules | axe-core on 14 routes, an open dialog and all five directory scenarios, in light and dark; patient app and provider workspace previews of three Playground components in both themes | Pass (0 violations) |
| Shell tab order, skip link, focus after navigation | Playwright keyboard tests | Pass |
| Dialog focus wrap, Escape, focus restoration, in-dialog error and retry | Playwright | Pass |
| Tabs keyboard pattern | Vitest and Playwright | Pass |
| Form error summary focus and field links | Playwright | Pass |
| Reflow at 320 CSS px | Playwright on 13 routes | Pass (no page-level horizontal scroll) |
| Container queries at a fixed viewport | Playwright: EntryCard layout in a resized frame; playground preview at 320px vs fill; docs contents column | Pass |
| Theme switching and persistence | Playwright | Pass |
| Theme persistence; product and density scoping | Playwright: header Theme select, Playground examples and preview scope, products matrix | Pass |
| Forced colors and reduced motion | Chromium emulation in the dev server; visual review and computed transition duration | Boundaries visible; transitions effectively removed |

## Not verified (known gaps)

- **No screen-reader testing** with NVDA, JAWS, Narrator, VoiceOver or TalkBack.
- **Browser zoom** at 200% and 400% was not automated; the 320px reflow tests approximate 400%.
- **Real Windows Contrast themes** — only Chromium's emulation was used.
- **Firefox and Safari** were not tested.
- **Touch devices** were only emulated by viewport size.

## How to re-run

```sh
npm test                                   # unit and component tests, including contrast
npx playwright install chromium            # once, or set PLAYWRIGHT_CHANNEL=msedge / chrome
npm run test:e2e                           # axe, keyboard, playground, patterns, reflow, container queries
```
