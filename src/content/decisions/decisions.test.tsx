import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DecisionPager } from './DecisionPager';
import { DecisionsIndex } from './DecisionsIndex';
import { decisions, decisionTopics } from './topics';
import type { Block, DecisionRecord } from './types';

const blocksOf = (blocks: readonly Block[]): Block[] => blocks.flatMap((block) => (block.kind === 'details' ? [block, ...block.items.flatMap((item) => blocksOf(item.blocks))] : [block]));
const allBlocks = decisions.flatMap((decision) => decision.sections.flatMap((section) => blocksOf(section.blocks)));
const sentences = (text: string) => text.split(/(?<=\.)\s/).length;
const fields: readonly (keyof DecisionRecord)[] = ['context', 'choice', 'alternatives', 'consequences', 'validation', 'reconsider'];

describe('design decisions', () => {
  it('states a question, a one-sentence decision and why it matters on every page', () => {
    for (const decision of decisions) {
      expect(decision.question.endsWith('?'), decision.id).toBe(true);
      expect(sentences(decision.record.choice[0]?.text ?? ''), decision.id).toBe(1);
      expect(sentences(decision.matters), decision.id).toBe(1);
    }
  });

  it('keeps a complete decision record on every page, set in the same scenario', () => {
    for (const decision of decisions) {
      for (const field of fields) {
        const statements = decision.record[field];
        expect(statements.length, `${decision.id} ${field}`).toBeGreaterThan(0);
        for (const statement of statements) expect(Boolean(statement.text || statement.items?.length), `${decision.id} ${field}`).toBe(true);
      }
      expect(decision.record.context.some((statement) => statement.evidence === 'hypothetical' && /Meadow/.test(statement.text ?? '') && /Harbor/.test(statement.text ?? '')), decision.id).toBe(true);
    }
  });

  it('links every implemented statement to a working example on this site', () => {
    const statements = decisions.flatMap((decision) => fields.flatMap((field) => decision.record[field]));
    const implemented = [
      ...statements,
      ...allBlocks.flatMap((block) => (block.kind === 'steps' ? block.items.flatMap((item) => (item.note ? [item.note] : [])) : [])),
    ].filter((statement) => statement.evidence === 'implemented');
    expect(implemented.length).toBeGreaterThanOrEqual(decisions.length);
    for (const statement of implemented) expect(statement.example?.href, statement.text).toMatch(/^\//);
  });

  it('labels every table, visual and code sample', () => {
    for (const block of allBlocks) {
      if (block.kind === 'table') expect(block.evidence, block.caption).toBeDefined();
      if (block.kind === 'visual') expect(block.evidence).toBeDefined();
      if (block.kind === 'code') expect(block.evidence).toBe('conceptual');
    }
  });

  it.each(decisionTopics.map((topic) => [topic.id, topic] as const))('renders %s with its decision record and every section', (_, topic) => {
    render(<topic.Content />);
    for (const section of topic.sections) expect(screen.getByRole('heading', { level: 2, name: section.label })).toBeInTheDocument();
    for (const term of ['Context', 'Choice', 'Alternatives considered', 'Consequences', 'Validation', 'Reconsider when']) expect(screen.getByText(term, { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByText(topic.choice)).toBeInTheDocument();
  });

  it('links to the previous decision, the overview and the next decision', () => {
    const { unmount } = render(<DecisionPager id="sharing" />);
    const pager = within(screen.getByRole('navigation', { name: 'Previous and next decisions' }));
    expect(pager.getAllByRole('link').map((link) => [link.textContent?.replace(/\s+/g, ' ').trim(), link.getAttribute('href')])).toEqual([
      ['Previous Planning a system', '/decisions/planning'],
      ['Back to Decisions overview', '/decisions'],
      ['Next Choosing an implementation approach', '/decisions/implementation'],
    ]);
    unmount();
    render(<DecisionPager id="planning" />);
    expect(screen.queryByRole('link', { name: /^Previous/ })).not.toBeInTheDocument();
  });

  it('introduces the scenario, one card per decision and the four labels on the overview', () => {
    render(<DecisionsIndex />);
    expect(within(screen.getByRole('list', { name: 'Products in the scenario' })).getAllByRole('listitem')).toHaveLength(2);
    const cards = within(screen.getByRole('list', { name: 'Design decisions' })).getAllByRole('listitem');
    expect(cards).toHaveLength(decisionTopics.length);
    expect(within(cards[0] as HTMLElement).getByText(decisionTopics[0]?.choice ?? '')).toBeInTheDocument();
    for (const label of ['Implemented', 'Hypothetical', 'Proposed', 'Conceptual']) expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it('updates the sharing comparison when a constraint changes', async () => {
    const user = userEvent.setup();
    const sharing = decisionTopics.find((topic) => topic.id === 'sharing');
    if (!sharing) throw new Error('No sharing page');
    render(<sharing.Content />);
    expect(screen.queryByText(/Native and web code cannot be shared directly/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Meadow is built as' }), 'native');
    expect(screen.getByText(/Native and web code cannot be shared directly/)).toBeInTheDocument();
  });
});
