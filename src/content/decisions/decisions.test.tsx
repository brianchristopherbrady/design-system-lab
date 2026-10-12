import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
      ...allBlocks.flatMap((block) => (block.kind === 'record' ? block.fields.flatMap((field) => field.statements) : [])),
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

  it('records this repository’s implementation choice apart from current analysis, and sets a prototype acceptance matrix', () => {
    const implementation = decisions.find((decision) => decision.id === 'implementation');
    const blocks = (implementation?.sections ?? []).flatMap((section) => blocksOf(section.blocks));
    const [record] = blocks.flatMap((block) => (block.kind === 'record' ? [block] : []));
    expect(record?.fields.map((field) => field.label)).toEqual(['Constraints', 'Choice and reasons', 'Alternatives', 'Accepted limitations', 'Reconsider when']);

    const analysis = (record?.fields ?? []).flatMap((field) => field.statements).filter((statement) => /^Current analysis/.test(statement.text ?? ''));
    expect(analysis.length).toBeGreaterThan(0);
    for (const statement of analysis) expect(statement.evidence).toBe('proposed');

    const matrix = blocks.flatMap((block) => (block.kind === 'table' && /acceptance matrix/i.test(block.caption) ? [block] : []))[0];
    expect(matrix?.rows.map((row) => row[0])).toEqual(['Properties', 'Events', 'Forms', 'Focus', 'Styling', 'Server rendering', 'Typing', 'Host integration']);
  });

  it('traces every planning finding and requirement through to a pilot check', () => {
    const planning = decisions.find((decision) => decision.id === 'planning');
    const tables = (planning?.sections ?? []).flatMap((section) => blocksOf(section.blocks)).flatMap((block) => (block.kind === 'table' ? [block] : []));
    const table = (first: string, has: string) => tables.find((candidate) => candidate.columns[0] === first && candidate.columns.includes(has))?.rows ?? [];
    const ids = (cells: readonly string[]) => cells.flatMap((cell) => cell.match(/\b[IRP]\d+\b/g) ?? []);
    const findings = ids(table('Finding', 'Judgment').map((row) => row[0] ?? ''));
    const trace = table('Finding', 'Pilot check');
    const requirements = table('ID', 'Accepted when').map((row) => row[0] ?? '');
    const checks = table('Check', 'Requirement');

    expect(findings.length).toBeGreaterThan(0);
    expect(ids(trace.map((row) => row[0] ?? ''))).toEqual(findings);
    for (const id of ids(trace.flatMap((row) => [row[2] ?? '', row[3] ?? '']))) expect([...requirements, ...checks.map((row) => row[0])], id).toContain(id);
    for (const id of ids(checks.map((row) => row[1] ?? ''))) expect(requirements, id).toContain(id);
    for (const id of requirements) expect(ids(checks.map((row) => row[1] ?? '')), id).toContain(id);
  });

  it.each(decisionTopics.map((topic) => [topic.id, topic] as const))('renders %s with its decision record and every section', (_, topic) => {
    const { container } = render(
      <MemoryRouter initialEntries={[`/decisions/${topic.id}`]}>
        <topic.Content />
      </MemoryRouter>,
    );
    for (const section of topic.sections) expect(screen.getByRole('heading', { level: 2, name: section.label })).toBeInTheDocument();
    const record = container.querySelector<HTMLElement>('#record');
    if (!record) throw new Error(`${topic.id} has no decision record`);
    for (const term of ['Context', 'Choice', 'Alternatives considered', 'Consequences', 'Validation', 'Reconsider when']) expect(within(record).getByText(term, { selector: 'dt' })).toBeInTheDocument();
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
});
