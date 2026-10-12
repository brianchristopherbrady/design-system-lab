import type { CatalogEntry, EntryKind, Maturity } from './catalog';
import { entryKinds, kindLabels, maturities } from './catalog';

export const activityKinds = ['added', 'changed', 'fixed', 'documented'] as const;
export type ActivityKind = (typeof activityKinds)[number];

export const activityKindLabels: Record<ActivityKind, string> = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  documented: 'Documented',
};

export interface ActivityEvent {
  id: string;
  /** Catalog entry the change belongs to. */
  entryId: string;
  kind: ActivityKind;
  summary: string;
  /** ISO date. */
  date: string;
}

/** The system's changelog, newest first. Fixed data, so every demo renders the same output. */
export const activity: readonly ActivityEvent[] = [
  { id: 'a23', entryId: 'activity-dashboard', kind: 'changed', summary: 'Activity dashboard is stable, with axe scans in both themes alongside its state tests.', date: '2026-10-08' },
  { id: 'a22', entryId: 'resource-detail', kind: 'changed', summary: 'Resource detail is stable, with axe scans in both themes alongside its archive-failure tests.', date: '2026-10-08' },
  { id: 'a21', entryId: 'theme-studio', kind: 'changed', summary: 'Theme studio is stable: shapes, presets, shareable links, gamut chart, color-vision checks and a complete six-part export.', date: '2026-10-08' },
  { id: 'a20', entryId: 'products', kind: 'changed', summary: 'Products and modes is stable: a mode composer, a computed product diff, nested scopes, density measurements and an add-a-product guide.', date: '2026-10-08' },
  { id: 'a19', entryId: 'theme-studio', kind: 'added', summary: 'Added the theme studio: OKLCH ramps, contrast-driven brand roles, WCAG 2 and APCA checks, DTCG export.', date: '2026-10-08' },
  { id: 'a18', entryId: 'theme-scope', kind: 'added', summary: 'Added ThemeScope, which re-themes a region by theme, product and density.', date: '2026-10-08' },
  { id: 'a17', entryId: 'products', kind: 'added', summary: 'Added product and density modifiers; the pipeline now emits dependency-minimal CSS for 12 permutations.', date: '2026-10-08' },
  { id: 'a16', entryId: 'button', kind: 'changed', summary: 'Renamed variant to appearance and added border, radius, fullWidth, loading and icon props.', date: '2026-10-07' },
  { id: 'a15', entryId: 'badge', kind: 'changed', summary: 'Added filled, subtle and outlined appearances, three sizes and a radius prop across six tones.', date: '2026-10-07' },
  { id: 'a14', entryId: 'dialog', kind: 'added', summary: 'Added a modal Dialog with token-backed size, surface, padding, radius, border and elevation.', date: '2026-10-07' },
  { id: 'a13', entryId: 'card', kind: 'changed', summary: 'Added surface, padding, radius, border and elevation props with component-token fallbacks.', date: '2026-10-07' },
  { id: 'a12', entryId: 'tabs', kind: 'added', summary: 'Added Tabs with arrow-key, Home and End navigation.', date: '2026-10-07' },
  { id: 'a11', entryId: 'alert', kind: 'added', summary: 'Added Alert for operation feedback with recovery actions.', date: '2026-10-07' },
  { id: 'a10', entryId: 'grid', kind: 'changed', summary: 'Added rowGap, columnGap and a capped responsive mode; gaps use the named spacing scale.', date: '2026-10-06' },
  { id: 'a09', entryId: 'stack', kind: 'changed', summary: 'Gap values renamed to the shared vocabulary: none through extraExtraLarge.', date: '2026-10-06' },
  { id: 'a08', entryId: 'spacing', kind: 'documented', summary: 'Documented the named spacing vocabulary and its mapping to space tokens.', date: '2026-10-05' },
  { id: 'a07', entryId: 'color', kind: 'changed', summary: 'Replaced status colors with six tones, each with text, surface, border, solid and on-solid roles.', date: '2026-10-05' },
  { id: 'a06', entryId: 'tokens', kind: 'changed', summary: 'Added component tokens for buttons, badges, cards, dialogs, switches and skeletons.', date: '2026-10-05' },
  { id: 'a05', entryId: 'elevation', kind: 'fixed', summary: 'Dark theme now uses stronger shadows so raised surfaces stay distinguishable.', date: '2026-10-05' },
  { id: 'a04', entryId: 'resource-directory', kind: 'added', summary: 'Added the resource directory pattern with five demo scenarios.', date: '2026-10-04' },
  { id: 'a03', entryId: 'field', kind: 'fixed', summary: 'Error text now uses the danger tone text color, which meets 4.5:1 in both themes.', date: '2026-09-30' },
  { id: 'a02', entryId: 'link', kind: 'documented', summary: 'Documented client-side routing through LinkProvider.', date: '2026-09-18' },
  { id: 'a01', entryId: 'container', kind: 'added', summary: 'Added queryName so pages can opt into named container queries.', date: '2026-09-18' },
];

export interface CatalogSummary {
  total: number;
  byKind: Record<EntryKind, number>;
  byMaturity: Record<Maturity, number>;
}

/** Counts derived from the catalog. Nothing here is stored. */
export function summarizeCatalog(entries: readonly CatalogEntry[]): CatalogSummary {
  const byKind = Object.fromEntries(entryKinds.map((kind) => [kind, 0])) as Record<EntryKind, number>;
  const byMaturity = Object.fromEntries(maturities.map((maturity) => [maturity, 0])) as Record<Maturity, number>;
  for (const entry of entries) {
    byKind[entry.kind] += 1;
    byMaturity[entry.maturity] += 1;
  }
  return { total: entries.length, byKind, byMaturity };
}

/** Every resource type with entries, largest first, worded as a count such as “4 design decisions”. */
export function catalogBreakdown(summary: CatalogSummary): { kind: EntryKind; count: number; text: string }[] {
  return entryKinds
    .filter((kind) => summary.byKind[kind] > 0)
    .map((kind) => {
      const count = summary.byKind[kind];
      const label = kindLabels[kind].toLowerCase();
      return { kind, count, text: `${count} ${count === 1 ? label : `${label}s`}` };
    })
    .sort((a, b) => b.count - a.count);
}

export function activityFor(entryId: string, events: readonly ActivityEvent[] = activity): ActivityEvent[] {
  return events.filter((event) => event.entryId === entryId);
}

export function countActivityByKind(events: readonly ActivityEvent[]): Record<ActivityKind, number> {
  const counts = Object.fromEntries(activityKinds.map((kind) => [kind, 0])) as Record<ActivityKind, number>;
  for (const event of events) counts[event.kind] += 1;
  return counts;
}

/** Formats an ISO date without depending on the reader's time zone. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
