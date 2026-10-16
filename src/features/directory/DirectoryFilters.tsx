import { useCallback, useRef, type RefObject } from 'react';
import { Button, Input, Select } from '@/design-system/primitives';
import { Field } from '@/design-system/composites';
import { kindLabels, type ComponentLayer, type EntryKind } from '@/domain/system';
import { defaultFilters, hasActiveFilters, withType, type DirectoryFilters as Filters } from './filters';
import styles from './DirectoryFilters.module.css';

export interface DirectoryFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Resource types offered in the Resource type select. Omit where every entry has the same type. */
  types?: readonly EntryKind[];
  /** Component layers offered in the Component layer select. With `types`, shown only while Component is selected. */
  layers: readonly ComponentLayer[];
  resultCount: number;
  /** Entries currently listed, when the list shows only some of the matches. Defaults to all of them. */
  shownCount?: number;
  totalCount: number;
  /** Accessible name of the search region. */
  label?: string;
  /** Ref to the Search input from useClearDirectoryFilters, so Clear filters buttons outside this component can hand focus to it. */
  searchRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Clears every filter and moves focus to the Search input first. Clear filters buttons disappear once
 * nothing is filtered, so without this focus would fall back to the document body.
 * Pass `searchRef` to DirectoryFilters and use `clear` for every other Clear filters button.
 */
export function useClearDirectoryFilters(onChange: (filters: Filters) => void) {
  const searchRef = useRef<HTMLInputElement>(null);
  const clear = useCallback(() => {
    searchRef.current?.focus();
    onChange(defaultFilters);
  }, [onChange]);
  return { searchRef, clear };
}

/** The count line: how many are listed, how many match, and how many exist. */
export function countSummary(shown: number, matching: number, total: number): string {
  if (shown >= matching) return `Showing ${matching} of ${total}`;
  return matching === total ? `Showing ${shown} of ${total} entries` : `Showing ${shown} of ${matching} matches, ${total} in total`;
}

/**
 * Search and filter controls. Controlled, so the same UI works with URL state (the
 * Components index) or local state (the directory pattern demo).
 */
export function DirectoryFilters({ filters, onChange, types, layers, resultCount, shownCount, totalCount, label = 'Filter entries', searchRef }: DirectoryFiltersProps) {
  const ownSearchRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? ownSearchRef;
  const offerTypes = types !== undefined && types.length > 1;
  const offerLayers = layers.length > 1 && (!offerTypes || filters.type === 'component');
  return (
    <div role="search" className={styles.filters} aria-label={label}>
      <div className={styles.fields}>
        <Field label="Search">
          {(control) => (
            <Input
              {...control}
              ref={inputRef}
              type="search"
              value={filters.query}
              placeholder="Name, summary or tag"
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
            />
          )}
        </Field>
        {offerTypes && (
          <Field label="Resource type">
            {(control) => (
              <Select
                {...control}
                value={filters.type}
                onChange={(event) => onChange(withType(filters, event.target.value as Filters['type']))}
              >
                <option value="all">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {kindLabels[type]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        {offerLayers && (
          <Field label="Component layer">
            {(control) => (
              <Select
                {...control}
                value={filters.layer}
                onChange={(event) => onChange({ ...filters, layer: event.target.value as Filters['layer'] })}
              >
                <option value="all">All layers</option>
                {layers.map((layer) => (
                  <option key={layer} value={layer}>
                    {layer}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>
      <div className={styles.summary}>
        <p role="status" className={styles.count}>
          {countSummary(shownCount ?? resultCount, resultCount, totalCount)}
        </p>
        {hasActiveFilters(filters) && (
          <Button
            size="small"
            appearance="ghost"
            onClick={() => {
              // This button unmounts once nothing is filtered; hand focus to Search first.
              inputRef.current?.focus();
              onChange(defaultFilters);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
