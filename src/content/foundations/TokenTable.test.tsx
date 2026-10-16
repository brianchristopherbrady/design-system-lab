import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeScope } from '@/design-system/layout';
import { TokenTable } from './TokenTable';

describe('TokenTable', () => {
  it('resolves rows for the product and density in effect and says which they are', () => {
    render(
      <ThemeScope product="patient" density="compact">
        <TokenTable caption="Action roles used by Button" paths={['action.primary.background']} />
      </ThemeScope>,
    );
    const table = screen.getByRole('table', { name: 'Action roles used by Button, for Patient app at compact density' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Token', 'Light', 'Dark']);
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['{brand.care.strong}', '{brand.care.strong}']);
  });

  it('keeps the default product’s mapping outside a product scope', () => {
    render(<TokenTable caption="Action roles used by Button" paths={['action.primary.background']} />);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['{color.neutral.950}', '{color.neutral.50}']);
  });

  it('shows one Value column and no context when nothing in the table varies', () => {
    render(<TokenTable caption="Border widths" paths={['border-width.thin', 'border-width.thick']} />);
    const table = screen.getByRole('table', { name: 'Border widths' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Token', 'Value']);
  });
});
