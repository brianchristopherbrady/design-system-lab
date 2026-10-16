import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { componentDocs } from '@/content/components';
import { findEntry } from '@/domain/system';
import { ComponentReference } from '@/features/docs';

function renderReference(id: string) {
  const entry = findEntry(id);
  const doc = componentDocs.find((candidate) => candidate.id === id);
  if (!entry || !doc) throw new Error(`No reference for ${id}`);
  const { container } = render(<ComponentReference entry={entry} doc={doc} playgroundHref={`/playground?component=${id}`} />);
  return (section: string) => {
    const element = container.querySelector<HTMLElement>(`#${section}`);
    if (!element) throw new Error(`No #${section} section`);
    return element;
  };
}

describe('component reference', () => {
  it('shows code marked in reference text as code, never as backticks', () => {
    const section = renderReference('box');
    for (const id of ['overview', 'api', 'behavior', 'guidance']) expect(section(id).textContent, id).not.toContain('`');
    expect([...section('api').querySelectorAll('code')].map((code) => code.textContent)).toEqual(expect.arrayContaining(['as', 'ref', 'className']));
    expect([...section('behavior').querySelectorAll('code')].map((code) => code.textContent)).toContain('as');
  });

  it('explains how to read the traces once, and leaves the classification to the page header', () => {
    const section = renderReference('button');
    expect(within(section('tokens')).getAllByText('How to read these traces')).toHaveLength(1);
    expect(within(section('overview')).queryByText(/^(Primitive|Stable)$/)).toBeNull();
    expect(within(section('overview')).getByRole('link', { name: /Open in playground/ })).toHaveAttribute('href', '/playground?component=button');
  });
});
