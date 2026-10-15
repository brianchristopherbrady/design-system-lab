import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HbButton } from './HbButton';
import wrapperSource from './HbButton.tsx?raw';

describe('HbButton, the hypothetical compatibility wrapper on the adoption page', () => {
  it('maps the old kind and small props to the shared appearance and size', () => {
    render(
      <>
        <HbButton kind="primary">Save</HbButton>
        <HbButton>Cancel</HbButton>
        <HbButton kind="link" small>
          View history
        </HbButton>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('primary');
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('secondary');
    const link = screen.getByRole('button', { name: 'View history' });
    expect(link.className).toContain('ghost');
    expect(link.className).toContain('small');
  });

  it('keeps the old implicit submit, so existing forms still submit', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <HbButton kind="primary">Save</HbButton>
      </form>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('changes busy on purpose: focus and the accessible name stay while activation is ignored', async () => {
    const onClick = vi.fn();
    render(
      <HbButton busy onClick={onClick}>
        Save
      </HbButton>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    button.focus();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it('is shown on the page from this exact source', () => {
    expect(wrapperSource).toContain('export function HbButton(');
    expect(wrapperSource).toMatch(/^\/\/ Hypothetical:/);
  });
});
