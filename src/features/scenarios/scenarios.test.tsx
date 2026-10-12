import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioDemo, useScenarioStatus } from './ScenarioDemo';
import { outcomeFor } from './scenarios';
import { simulateRequest } from './simulateRequest';
import { useRequest } from './useRequest';

const request = (attempt: number, signal: AbortSignal) =>
  simulateRequest(() => ({ attempt }), { outcome: outcomeFor('error', attempt), signal });

describe('outcomeFor', () => {
  it('is deterministic: error fails once then recovers, loading never settles', () => {
    expect([0, 1, 2].map((attempt) => outcomeFor('error', attempt))).toEqual(['fail', 'succeed', 'succeed']);
    expect(outcomeFor('loading', 3)).toBe('hang');
    expect(outcomeFor('empty', 0)).toBe('succeed');
  });
});

describe('useRequest with simulated requests', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('moves from pending to error, then retries to success', async () => {
    const { result } = renderHook(() => useRequest(request));
    expect(result.current.state).toEqual({ status: 'idle' });

    act(() => result.current.load(0));
    expect(result.current.state).toEqual({ status: 'pending', requestId: 1 });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.state).toMatchObject({ status: 'error', message: expect.stringContaining('503') as string });

    act(() => result.current.load(1));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.state).toEqual({ status: 'success', requestId: 2, data: { attempt: 1 } });
  });

  it('cancels an in-flight request and never reports its result', async () => {
    const { result } = renderHook(() => useRequest(request));
    act(() => result.current.load(1));
    act(() => result.current.cancel());
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.state).toEqual({ status: 'cancelled', requestId: 1 });
  });

  it('ignores a stale response that arrives after a newer one', async () => {
    const pending: ((value: number) => void)[] = [];
    const manual = () => new Promise<number>((resolve) => pending.push(resolve));
    const { result } = renderHook(() => useRequest(manual));
    act(() => result.current.load());
    act(() => result.current.load());
    await act(async () => {
      pending[1]?.(2);
      await Promise.resolve();
    });
    await act(async () => {
      pending[0]?.(1);
      await Promise.resolve();
    });
    expect(result.current.state).toEqual({ status: 'success', requestId: 2, data: 2 });
  });
});

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count {count}
    </button>
  );
}

describe('ScenarioDemo', () => {
  it('labels the selector "Demo scenario" and resets the demo by remounting it', async () => {
    const user = userEvent.setup();
    render(<ScenarioDemo>{(scenario) => <><p>Scenario: {scenario}</p><Counter /></>}</ScenarioDemo>);
    const select = screen.getByRole('combobox', { name: 'Demo scenario' });
    expect(screen.getByText('Scenario: success')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Count 0' }));
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(screen.getByRole('button', { name: 'Count 0' })).toBeInTheDocument();

    await user.selectOptions(select, 'error');
    expect(screen.getByText('Scenario: error')).toBeInTheDocument();
    expect(select).toHaveAccessibleDescription(/first request fails/i);
  });

  it('announces each demo state through one status message that persists across scenario changes (A11Y-002)', async () => {
    const user = userEvent.setup();
    function Reporter({ scenario }: { scenario: string }) {
      useScenarioStatus(scenario === 'empty' ? 'No entries yet.' : '');
      return <p>Scenario: {scenario}</p>;
    }
    render(<ScenarioDemo>{(scenario) => <Reporter scenario={scenario} />}</ScenarioDemo>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Demo scenario' }), 'empty');
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('No entries yet.');
    expect(screen.getByRole('combobox', { name: 'Demo scenario' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('No entries yet.');
  });

  it('offers only the scenarios a demo lists, in its own words', async () => {
    const user = userEvent.setup();
    render(
      <ScenarioDemo
        scenarios={[
          { scenario: 'success', label: 'Success', description: 'Everything loads.' },
          { scenario: 'empty', label: 'Empty history', description: 'The entry has no recorded changes.' },
        ]}
      >
        {(scenario) => <p>Scenario: {scenario}</p>}
      </ScenarioDemo>,
    );
    const select = screen.getByRole('combobox', { name: 'Demo scenario' });
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Success', 'Empty history']);
    expect(select).toHaveAccessibleDescription('Everything loads.');
    await user.selectOptions(select, 'Empty history');
    expect(screen.getByText('Scenario: empty')).toBeInTheDocument();
    expect(select).toHaveAccessibleDescription('The entry has no recorded changes.');
  });
});
