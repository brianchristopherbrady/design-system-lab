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
    expect(select('The patient app is built as').value).toBe('web');
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveAttribute('aria-pressed', 'true');
    expect(address()).toBe('#explore');
    expect(screen.queryByRole('heading', { name: 'What changed' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'The patient app and the provider workspace on the web' })).toBeInTheDocument();
  });

  it('applies a preset, says what changed and why, and keeps it in the address', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole('button', { name: 'Native plus web' }));

    expect(select('The patient app is built as').value).toBe('both');
    expect(screen.getByRole('button', { name: 'Native plus web' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Two React products' })).toHaveAttribute('aria-pressed', 'false');
    expect(address()).toMatch(/mobile=both/);
    expect(address()).toMatch(/#explore$/);
    expect(within(changedSection()).getByText(/The patient app is built as changed from Responsive web to Both/)).toBeInTheDocument();
    expect(within(changedSection()).getByText('Starting point: The native patient app')).toBeInTheDocument();
    expect(announced()).toMatch(/Preset applied: Native plus web\. \d conclusions changed/);
    expect(screen.getByRole('heading', { level: 4, name: 'The patient web app and the provider workspace' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'The native patient app' })).toBeInTheDocument();
  });

  it('explains a single change, marks it in the results, and resets', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.selectOptions(select('The patient app is built as'), 'native');

    expect(select('Web frameworks')).toBeDisabled();
    expect(screen.getByText('Only the provider workspace is on the web.')).toBeInTheDocument();
    const change = within(changedSection()).getByText('Component code (web)').closest('li');
    expect(change).toHaveTextContent(/Share in part → to Keep separate/);
    expect(change).toHaveTextContent(/Why: Only the provider workspace is on the web, so there is no second web product/);
    const layers = screen.getByRole('region', { name: 'Layer by layer' });
    expect(within(layers).getByText('Component code (web)').closest('li')).toHaveTextContent('Changed');
    expect(within(layers).getByText('Principles').closest('li')).not.toHaveTextContent('Changed');
    expect(announced()).toMatch(/The patient app is built as: A native app\./);

    await user.click(screen.getByRole('button', { name: 'Reset to the scenario' }));
    expect(select('The patient app is built as').value).toBe('web');
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
    expect(select('The patient app is built as').value).toBe('native');
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
    expect(select('The patient app is built as').value).toBe('both');
    expect(screen.getByRole('button', { name: 'Native plus web' })).toHaveFocus();
  });
});

describe('product compositions', () => {
  it('scopes each example to its product and density', () => {
    render(<ProductCompositions />);
    const patient = screen.getByRole('region', { name: 'How should we confirm your appointment?' });
    expect(patient).toHaveAttribute('data-product', 'patient');
    expect(patient).toHaveAttribute('data-density', 'comfortable');
    const provider = screen.getByRole('region', { name: 'Appointment requests' });
    expect(provider).toHaveAttribute('data-product', 'provider');
    expect(provider).toHaveAttribute('data-density', 'compact');
  });

  it('gives the same input the same validation in both products', async () => {
    const user = userEvent.setup();
    render(<ProductCompositions />);
    const patientEmail = screen.getByRole('textbox', { name: 'Email address' });
    const providerEmail = screen.getByRole('textbox', { name: 'Notify by email' });
    await user.type(patientEmail, 'abc');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(patientEmail).toHaveFocus();
    await user.type(providerEmail, 'abc');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(providerEmail).toHaveFocus();
    expect(screen.getAllByText('Enter an email address, like name@example.com.')).toHaveLength(2);
    expect(patientEmail).toHaveAttribute('aria-invalid', 'true');
    expect(providerEmail).toHaveAttribute('aria-invalid', 'true');
  });

  it('completes the patient step without sending anything', async () => {
    const user = userEvent.setup();
    render(<ProductCompositions />);
    const patient = within(screen.getByRole('region', { name: 'How should we confirm your appointment?' }));
    await user.click(patient.getByRole('radio', { name: /Text message/ }));
    await user.type(patient.getByRole('textbox', { name: 'Email address' }), 'sam@example.com');
    await user.click(patient.getByRole('button', { name: 'Continue' }));
    expect(patient.getByText('Step complete. In a real flow, step 3 would review the request. Nothing was sent.')).toBeInTheDocument();
  });

  it('filters the provider queue as you type, without validating, and confirms the selected requests', async () => {
    const user = userEvent.setup();
    render(<ProductCompositions />);
    const provider = within(screen.getByRole('region', { name: 'Appointment requests' }));
    await user.click(provider.getByRole('button', { name: 'Confirm selected' }));
    expect(provider.getByText('Select at least one request first.')).toBeInTheDocument();

    const filter = provider.getByRole('textbox', { name: 'Filter requests' });
    await user.type(filter, 'visit');
    expect(provider.getByText('Showing 2 of 5 requests')).toBeInTheDocument();
    expect(provider.getAllByRole('checkbox')).toHaveLength(2);
    expect(filter).not.toHaveAttribute('aria-invalid');

    const row = provider.getByRole('checkbox', { name: 'R-2042 · Priya N. · Follow-up visit' });
    await user.click(row);
    await user.click(provider.getByRole('button', { name: 'Confirm selected' }));
    expect(provider.getByText('1 request confirmed. Nothing was saved.')).toBeInTheDocument();
    expect(row.closest('li')).toHaveTextContent('Confirmed');
    expect(row).not.toBeChecked();
  });
});
