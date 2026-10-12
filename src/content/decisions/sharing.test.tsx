import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ProductCompositions } from './ProductCompositions';
import { SharingExplorer } from './SharingExplorer';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.search}${location.hash}`}</output>;
}

const renderExplorer = (path = '/decisions/sharing#explore') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SharingExplorer />
      <LocationProbe />
    </MemoryRouter>,
  );
const address = () => screen.getByTestId('location').textContent ?? '';
const select = (name: string) => screen.getByRole<HTMLSelectElement>('combobox', { name });
const announced = () =>
  screen
    .getAllByRole('status')
    .map((region) => region.textContent)
    .join(' ');
const changedSection = () => screen.getByRole('region', { name: 'What changed' });

describe('sharing explorer', () => {
  it('starts at the scenario with a clean address', () => {
    renderExplorer();
    expect(select('Meadow is built as').value).toBe('web');
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveAttribute('aria-pressed', 'true');
    expect(address()).toBe('#explore');
    expect(screen.queryByRole('heading', { name: 'What changed' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Meadow and Harbor on the web' })).toBeInTheDocument();
  });

  it('applies a preset, says what changed and why, and keeps it in the address', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole('button', { name: 'Native plus web' }));

    expect(select('Meadow is built as').value).toBe('both');
    expect(screen.getByRole('button', { name: 'Native plus web' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveAttribute('aria-pressed', 'false');
    expect(address()).toMatch(/mobile=both/);
    expect(address()).toMatch(/#explore$/);
    expect(within(changedSection()).getByText(/Meadow is built as changed from Responsive web to Both/)).toBeInTheDocument();
    expect(within(changedSection()).getByText('Starting point: Meadow’s native app')).toBeInTheDocument();
    expect(announced()).toMatch(/Preset applied: Native plus web\. \d conclusions changed/);
    expect(screen.getByRole('heading', { level: 4, name: 'Meadow’s web app and Harbor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Meadow’s native app' })).toBeInTheDocument();
  });

  it('explains a single change, marks it in the results, and resets', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.selectOptions(select('Meadow is built as'), 'native');

    expect(select('Web frameworks')).toBeDisabled();
    expect(screen.getByText('Only Harbor is on the web.')).toBeInTheDocument();
    const change = within(changedSection()).getByText('Component code (web)').closest('li');
    expect(change).toHaveTextContent(/Share in part → to Keep separate/);
    expect(change).toHaveTextContent(/Why: Only Harbor is on the web, so there is no second web product/);
    const layers = screen.getByRole('region', { name: 'Layer by layer' });
    expect(within(layers).getByText('Component code (web)').closest('li')).toHaveTextContent('Changed');
    expect(within(layers).getByText('Principles').closest('li')).not.toHaveTextContent('Changed');
    expect(announced()).toMatch(/Meadow is built as: A native app\./);

    await user.click(screen.getByRole('button', { name: 'Reset to the scenario' }));
    expect(select('Meadow is built as').value).toBe('web');
    expect(address()).toBe('#explore');
    expect(announced()).toMatch(/Reset to the scenario\./);
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('says so when a change alters no conclusion', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.selectOptions(select('Product release schedules'), 'coordinated');
    expect(within(changedSection()).getByText('No conclusions changed.')).toBeInTheDocument();
    expect(announced()).toMatch(/Product release schedules: Coordinated\. No conclusions changed\./);
  });

  it('reads a shared link, keeps defaults for invalid values and rewrites the address', async () => {
    renderExplorer('/decisions/sharing?mobile=native&brands=distinct&overlap=bogus&ownership=#explore');
    expect(select('Meadow is built as').value).toBe('native');
    expect(select('Brands').value).toBe('distinct');
    expect(select('Controls with equivalent behavior').value).toBe('few');
    expect(select('System ownership').value).toBe('team');
    expect(select('Web frameworks')).toBeDisabled();
    await waitFor(() => expect(address()).not.toMatch(/bogus/));
    expect(address()).toMatch(/mobile=native/);
    expect(address()).toMatch(/overlap=few/);
    expect(address()).toMatch(/#explore$/);
    expect(screen.queryByRole('heading', { name: 'What changed' })).not.toBeInTheDocument();
  });

  it('copies a link that reopens the same comparison', async () => {
    const user = userEvent.setup();
    const { unmount } = renderExplorer();
    await user.click(screen.getByRole('button', { name: 'Different web frameworks' }));
    await user.selectOptions(select('Controls with equivalent behavior'), 'many');
    await user.click(screen.getByRole('button', { name: 'Copy scenario link' }));

    const copied = new URL(await navigator.clipboard.readText());
    expect(copied.searchParams.get('frameworks')).toBe('different');
    expect(copied.searchParams.get('overlap')).toBe('many');
    expect(copied.hash).toBe('#explore');
    expect(await screen.findByText('Scenario link copied.')).toBeInTheDocument();
    unmount();

    renderExplorer(`${copied.pathname}${copied.search}${copied.hash}`);
    expect(select('Web frameworks').value).toBe('different');
    expect(select('Controls with equivalent behavior').value).toBe('many');
    expect(screen.getByRole('button', { name: 'Different web frameworks' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Custom constraints: they match no preset.')).toBeInTheDocument();
  });

  it('offers the link to copy by hand when the clipboard refuses', async () => {
    const user = userEvent.setup();
    renderExplorer();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy scenario link' }));
    const field = await screen.findByRole<HTMLInputElement>('textbox', { name: 'Scenario link' });
    expect(field.value).toMatch(/#explore$/);
    expect(field).toHaveFocus();
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Native plus web' })).toHaveFocus();
    await user.keyboard(' ');
    expect(select('Meadow is built as').value).toBe('both');
    expect(screen.getByRole('button', { name: 'Native plus web' })).toHaveFocus();
  });
});

describe('product compositions', () => {
  it('scopes each demonstration to its product and density', () => {
    render(<ProductCompositions />);
    expect(screen.getByRole('region', { name: 'How should we keep you updated?' })).toHaveAttribute('data-product', 'meadow');
    const harbor = screen.getByRole('region', { name: 'Records to review' });
    expect(harbor).toHaveAttribute('data-product', 'harbor');
    expect(harbor).toHaveAttribute('data-density', 'compact');
  });

  it('gives the same input the same validation in both products', async () => {
    const user = userEvent.setup();
    render(<ProductCompositions />);
    const meadowEmail = screen.getByRole('textbox', { name: 'Email address' });
    const harborEmail = screen.getByRole('textbox', { name: 'Notify by email' });
    await user.type(meadowEmail, 'abc');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(meadowEmail).toHaveFocus();
    await user.type(harborEmail, 'abc');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(harborEmail).toHaveFocus();
    expect(screen.getAllByText('Enter an email address, like name@example.com.')).toHaveLength(2);
    expect(meadowEmail).toHaveAttribute('aria-invalid', 'true');
    expect(harborEmail).toHaveAttribute('aria-invalid', 'true');
  });

  it('filters Harbor’s list as you type, without validating, and confirms the bulk action', async () => {
    const user = userEvent.setup();
    render(<ProductCompositions />);
    const harbor = within(screen.getByRole('region', { name: 'Records to review' }));
    await user.click(harbor.getByRole('button', { name: 'Mark reviewed' }));
    expect(harbor.getByText('Select at least one record first.')).toBeInTheDocument();

    const filter = harbor.getByRole('textbox', { name: 'Filter records' });
    await user.type(filter, 'access');
    expect(harbor.getByText('Showing 2 of 5 records')).toBeInTheDocument();
    expect(harbor.getAllByRole('checkbox')).toHaveLength(2);
    expect(filter).not.toHaveAttribute('aria-invalid');

    await user.click(harbor.getByRole('checkbox', { name: 'A-1043 · Access request' }));
    await user.click(harbor.getByRole('button', { name: 'Mark reviewed' }));
    expect(harbor.getByText('1 record marked reviewed. Nothing was saved.')).toBeInTheDocument();
  });
});
