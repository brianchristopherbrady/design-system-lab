import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { activity, catalogBreakdown, summarizeCatalog } from './activity';
import { catalog, entryKinds } from './catalog';
import { EntryCard } from './EntryCard';

const button = catalog.find((entry) => entry.id === 'button')!;

describe('EntryCard', () => {
  it('links the title and states the classification in text', () => {
    render(<EntryCard entry={button} href="/components/button" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Button' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
    expect(screen.getByText('Primitive component')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('leaves out the classification where every card on the page shares it', () => {
    render(<EntryCard entry={button} href="/components/button" showClassification={false} />);
    expect(screen.getByRole('link', { name: 'Button' })).toBeInTheDocument();
    expect(screen.queryByText('Primitive component')).toBeNull();
  });

  it('exposes the pin state with aria-pressed and a name that includes the entry', async () => {
    const onTogglePin = vi.fn();
    render(<EntryCard entry={button} href="/components/button" pinned={false} onTogglePin={onTogglePin} />);
    const pin = screen.getByRole('button', { name: /^Pin\s+Button$/ });
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pin);
    expect(onTogglePin).toHaveBeenCalledOnce();
  });
});

describe('catalog data', () => {
  it('has unique ids and every activity event points at an entry', () => {
    const ids = catalog.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const event of activity) expect(ids).toContain(event.entryId);
  });

  it('summarizes counts by kind', () => {
    const summary = summarizeCatalog(catalog);
    expect(summary.total).toBe(catalog.length);
    expect(Object.values(summary.byKind).reduce((total, count) => total + count, 0)).toBe(catalog.length);
  });

  it('breaks the catalog total down by every resource type, design decisions included', () => {
    const summary = summarizeCatalog(catalog);
    const parts = catalogBreakdown(summary);
    expect(parts.reduce((total, part) => total + part.count, 0)).toBe(summary.total);
    expect(parts.map((part) => part.kind).sort()).toEqual(entryKinds.filter((kind) => summary.byKind[kind] > 0).sort());
    const decisions = catalog.filter((entry) => entry.kind === 'decision').length;
    expect(parts.find((part) => part.kind === 'decision')?.text).toBe(`${decisions} design decision${decisions === 1 ? '' : 's'}`);
    expect(parts.map((part) => part.count)).toEqual([...parts.map((part) => part.count)].sort((a, b) => b - a));
  });

  it('words single entries in the singular and leaves out empty resource types', () => {
    const summary = summarizeCatalog(catalog.filter((entry) => entry.kind === 'pattern').slice(0, 1));
    expect(catalogBreakdown(summary)).toEqual([{ kind: 'pattern', count: 1, text: '1 pattern' }]);
  });
});
