# 0008: Patient and provider profiles, scoped to their examples

## Status

Accepted. Replaces the Harbor and Meadow products from 0006 and 0007, and retires the site-wide
Product and Density settings. The modifier architecture from 0006 and the typeface and signal roles
from 0007 are unchanged.

## Context

The header switched the whole site between three products and two densities. A reader could turn
Design System Lab into an unrelated brand by accident, and every page had to be reviewed in twelve
combinations. Harbor and Meadow were presentation modes with names of their own, while the Decisions
pages borrowed the same names for a hypothetical consumer product and a professional application:
two meanings for one pair of names, and neither tied to a concrete domain.

Three ways forward:

- **Keep global switching and rename the products.** Fixes the names, not the accidental re-theming
  or the review cost.
- **Drop the product modifier.** One brand everywhere, but nothing left to show that tokens carry a
  product's presentation.
- **Scope product profiles to the examples that show them, and give them one scenario.** The site
  keeps one identity; the profiles stay real and testable where they are explained.

## Decision

- The header sets only the theme: System, Light or Dark. `<html>` always carries the Design System
  Lab profile at comfortable density, and saved `system-lab:product` and `system-lab:density`
  values are deleted on load.
- The product contexts are `patient` (Patient app) and `provider` (Provider workspace), two products
  of one fictional healthcare company: a patient app for requesting care and a provider workspace
  for reviewing requests. Examples apply them with `ThemeScope`: Products and modes, the Sharing
  examples, the Overview demonstration, the decision demonstrations and the Playground preview.
- Both share one brand family, `brand.care` (the former Harbor teal ramp), and IBM Plex Sans for
  display and text. The provider workspace adds tighter corners (small for controls and badges,
  medium for cards and dialogs); the patient app keeps the system's corners. Density is chosen per
  example, and the provider examples use compact.
- The Meadow ramp, Fraunces and Nunito are removed.
- The Decisions scenario uses the same two products, with appointment requests as the shared fixture
  in `src/domain/scenario`. The hypothetical legacy button in the adoption example is `PwButton`.
- Old links keep working: Playground `preview.product` and ThemeScope `p.product` values `harbor`
  and `meadow` open as `provider` and `patient`.

## Consequences

- The site has one identity, and its pages are reviewed in two themes rather than twelve
  combinations. The pipeline still resolves all 3 × 2 × 2 permutations, and the contrast suite still
  checks every product and theme.
- The two products differ in density and corner shape, not in color or typeface. Typeface and color
  differences are shown between Design System Lab and the care profiles, so the products matrix
  shows four distinct palettes rather than six.
- 338 tokens instead of 361, and 878 lines of generated CSS instead of 919. Two fewer font families
  to self-host.
- The profiles still demonstrate configurable presentation only. Whether two real products should
  share workflows or component behavior needs evidence from their users, which the Sharing decision
  works through.
