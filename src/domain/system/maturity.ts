import type { Maturity } from './catalog';

export interface MaturityDefinition {
  /** What a consumer may rely on. */
  promise: string;
  /** Evidence an entry needs before it may carry the label. */
  requires: readonly string[];
  /** How a breaking change is handled at this level. */
  change: string;
  /** What the label does not claim. */
  limits: string;
}

/**
 * What each maturity label means in this system. The documentation renders these, and
 * src/test/documentation.test.ts checks the requirements marked "checked" against the code.
 */
export const maturityDefinitions: Record<Maturity, MaturityDefinition> = {
  experimental: {
    promise: 'An approach being tried. Usable in demos and opted-in pages to learn from real use.',
    requires: ['A documented purpose and its known gaps.', 'No product code depends on it without the owning team agreeing.'],
    change: 'Any release may change or remove it, without a deprecation period.',
    limits: 'No accessibility, browser or performance guarantee beyond what its page states.',
  },
  beta: {
    promise: 'Complete for its documented uses. Safe to adopt with the expectation of small API changes.',
    requires: [
      'Props documented from its own TypeScript types (checked: the props table is typed against the component).',
      'Every prop-to-token trace names a token its files read (checked).',
      'Keyboard, screen-reader and responsive behavior written down (checked: non-empty).',
    ],
    change: 'A breaking change ships with a changelog entry and a migration note in the same release.',
    limits: 'May lack automated tests for some states. Not yet proven in more than one product context.',
  },
  stable: {
    promise: 'Safe for product code. The public API, tokens and markup structure change only through deprecation.',
    requires: [
      'Everything beta requires.',
      'Named in at least one automated unit, component or end-to-end test (checked).',
      'Used by this site outside its own documentation page.',
    ],
    change: 'Deprecate first, keep working for at least one minor release, then remove in a major release.',
    limits: 'Not a claim of WCAG conformance. Automated scans and keyboard tests run in Chromium; no screen-reader evaluation has been performed (see docs/accessibility.md).',
  },
  deprecated: {
    promise: 'Still works, but is scheduled for removal and hidden from navigation and the index.',
    requires: ['A named replacement.', 'A migration note and the release it will be removed in.'],
    change: 'Removed in the announced major release.',
    limits: 'Receives fixes for severe defects only.',
  },
};
