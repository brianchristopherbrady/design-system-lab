import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { componentLayers } from '@/domain/system';
import { DirectoryFilters, useClearDirectoryFilters } from './DirectoryFilters';
import { defaultFilters, type DirectoryFilters as Filters } from './filters';

/** Stateful owner with an empty-state Clear filters button outside DirectoryFilters, like the real pages. */
function Owner({ initial }: { initial: Filters }) {
  const [filters, setFilters] = useState(initial);
  const { searchRef, clear } = useClearDirectoryFilters(setFilters);
  const empty = filters.query === 'zzzz';
  return (
    <>
      <DirectoryFilters
        filters={filters}
        onChange={setFilters}
        layers={componentLayers}
        resultCount={empty ? 0 : 29}
        totalCount={29}
        searchRef={searchRef}
      />
      {empty && (
        <button type="button" onClick={clear}>
          Clear filters
        </button>
      )}
    </>
  );
}

describe('DirectoryFilters Clear filters (A11Y-001)', () => {
  it('moves focus to the Search input when its own Clear filters button removes itself', async () => {
    const user = userEvent.setup();
    render(<Owner initial={{ ...defaultFilters, maturity: 'stable' }} />);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 29 of 29');
  });

  it('moves focus to the Search input from an empty-state Clear filters button, with Enter and Space', async () => {
    const user = userEvent.setup();
    for (const key of ['{Enter}', ' ']) {
      const { unmount } = render(<Owner initial={{ ...defaultFilters, query: 'zzzz' }} />);
      const buttons = screen.getAllByRole('button', { name: 'Clear filters' });
      buttons[buttons.length - 1]?.focus();
      await user.keyboard(key);
      expect(screen.queryAllByRole('button', { name: 'Clear filters' })).toHaveLength(0);
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
      expect(document.activeElement).not.toBe(document.body);
      unmount();
    }
  });
});
