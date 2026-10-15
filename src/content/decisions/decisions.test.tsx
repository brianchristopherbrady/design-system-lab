import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { badgeAppearances, badgeSizes } from '@/design-system/primitives';
import { toneScale } from '@/design-system/tokens';
import { entriesOfKind, findEntry, maturities, maturityDefinitions, maturityLabels } from '@/domain/system';
import { badgeMapping, differences } from './AlignmentExamples';
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

  it('works each component API decision from requirement to validation', () => {
    const apis = decisions.find((decision) => decision.id === 'component-apis');
    const records = (apis?.sections ?? []).flatMap((section) => blocksOf(section.blocks)).flatMap((block) => (block.kind === 'record' ? [block] : []));
    expect(records.map((record) => record.caption.split(':')[0])).toEqual(['Button', 'Card', 'Dialog']);
    for (const record of records) {
      expect(record.fields.map((field) => field.label), record.caption).toEqual(['Requirement', 'Options considered', 'Chosen contract', 'Rejected alternative', 'Consequences', 'Validation']);
      const rejected = record.fields.find((field) => field.label === 'Rejected alternative')?.statements ?? [];
      for (const statement of rejected) expect(statement.evidence, record.caption).not.toBe('implemented');
    }
  });

  it('works a migration in six steps on its own page, and leaves a pointer where migration used to be', () => {
    const adoption = decisions.find((decision) => decision.id === 'adoption');
    const titles = (adoption?.sections ?? []).map((section) => section.title).filter((title) => /^\d\. /.test(title));
    expect(titles).toEqual(['1. The existing control', '2. Raw values to tokens', '3. A compatibility wrapper', '4. Replacing call sites', '5. Verifying the change', '6. Removing the wrapper']);
    const codemod = adoption?.sections.find((section) => section.id === 'codemod');
    expect(JSON.stringify(codemod)).toContain('No codemod exists in this repository.');

    const operating = decisions.find((decision) => decision.id === 'operating');
    const pointer = operating?.sections.find((section) => section.id === 'migration');
    expect(pointer?.blocks).toHaveLength(1);
    expect(JSON.stringify(pointer)).toContain('](/decisions/adoption)');
  });

  it('accepts Tabs against a matrix that names its evidence and does not treat a pass as conformance', () => {
    const quality = decisions.find((decision) => decision.id === 'quality');
    const tables = (quality?.sections ?? []).flatMap((section) => blocksOf(section.blocks)).flatMap((block) => (block.kind === 'table' ? [block] : []));
    const matrix = tables.find((table) => /acceptance matrix/i.test(table.caption));
    expect(matrix?.rows.map((row) => row[0])).toEqual(['Keyboard interaction', 'Focus', 'Accessible names', 'States', 'Contrast', 'Motion preferences', 'Supported environments']);
    for (const row of matrix?.rows ?? []) expect(row.every((cell) => cell.trim().length > 0), row[0]).toBe(true);

    const checks = tables.find((table) => table.columns.includes('Does not establish'));
    expect(checks?.rows.find((row) => row[0] === 'Screen-reader evaluation')?.[3]).toMatch(/^Not done/);
    expect(JSON.stringify(quality)).not.toMatch(/\b(conforms|is conformant|fully accessible)\b(?! to WCAG; this project makes no)/);
  });

  it('maps Badge design properties to the values the component exports, and says no design tool exists here', () => {
    const byProp = Object.fromEntries(badgeMapping.map((mapping) => [mapping.prop, mapping]));
    expect(byProp.tone?.codeValues).toBe(toneScale);
    expect(byProp.appearance?.codeValues).toBe(badgeAppearances);
    expect(byProp.size?.codeValues).toBe(badgeSizes);
    for (const mapping of badgeMapping) {
      for (const value of Object.values(mapping.designValues)) expect(mapping.codeValues, `${mapping.prop}: ${value}`).toContain(value);
    }
    expect(byProp.tone ? differences(byProp.tone) : []).toEqual(expect.arrayContaining(['property Tone → tone', 'Error → danger']));

    const alignment = decisions.find((decision) => decision.id === 'alignment');
    const today = alignment?.sections.find((section) => section.id === 'today');
    expect(JSON.stringify(today)).toContain('There is no design-tool library, plugin, export or synchronization here.');
  });

  it('works operating examples through to stable, a declined request, an exception and a release, and defines every measure', () => {
    const operating = decisions.find((decision) => decision.id === 'operating');
    const blocksIn = (id: string) => blocksOf(operating?.sections.find((section) => section.id === id)?.blocks ?? []);
    const recordIn = (id: string) => blocksIn(id).flatMap((block) => (block.kind === 'record' ? [block] : []))[0];
    const labels = (id: string) => recordIn(id)?.fields.map((field) => field.label) ?? [];
    const tables = (id: string) => blocksIn(id).flatMap((block) => (block.kind === 'table' ? [block] : []));

    const steps = blocksIn('contribution').flatMap((block) => (block.kind === 'steps' ? block.items.map((item) => item.title) : []));
    expect(steps).toEqual(['Request', 'Evidence', 'API proposal', 'Review feedback', 'Experimental release', 'Stable acceptance']);
    expect(labels('disputed')).toEqual(expect.arrayContaining(['Who decides', 'Evidence that matters', 'Decision', 'How Harbor proceeds']));
    expect(labels('exceptions')).toEqual(expect.arrayContaining(['Reason', 'Owner', 'Affected products', 'Logged and review date', 'Remove when', 'Include in the shared system when']));
    expect(labels('releases')).toEqual(expect.arrayContaining(['Changes', 'Affected consumers', 'Migration', 'Compatibility support', 'Rollback']));
    expect(tables('defects')[0]?.columns).toEqual(['Aspect', 'Urgent defect', 'Scheduled contribution']);

    const maturity = tables('releases').find((table) => table.columns[0] === 'Label');
    expect(maturity?.evidence).toBe('implemented');
    expect(maturity?.rows.map((row) => [row[0], row[1], row[3]])).toEqual(
      maturities.map((level) => [maturityLabels[level], maturityDefinitions[level].promise, maturityDefinitions[level].change]),
    );

    const [measures, adoption, illustration] = tables('measures');
    for (const column of ['Unit', 'Scope', 'Baseline definition', 'Measured baseline', 'How to collect', 'Owner', 'Review', 'Could mislead because', 'If the result is worrying']) {
      expect(measures?.columns, column).toContain(column);
    }
    const measured = measures?.columns.indexOf('Measured baseline') ?? -1;
    for (const row of measures?.rows ?? []) {
      expect(row.every((cell) => cell.trim().length > 0), row[0]).toBe(true);
      expect(row[measured], row[0]).toMatch(/^Not measured/);
    }
    const cases = (adoption?.rows ?? []).map((row) => row[0] ?? '').join(' ');
    for (const kind of [/wrapper/, /native element/, /System internals/, /logged exception/, /past its review date/]) expect(cases).toMatch(kind);
    expect(illustration?.evidence).toBe('hypothetical');
    expect(illustration?.caption).toMatch(/^Illustrative only/);
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
      ['Previous Quality and release decisions', '/decisions/quality'],
      ['Back to Decisions overview', '/decisions'],
      ['Next Planning a system', '/decisions/planning'],
    ]);
    unmount();
    render(<DecisionPager id="implementation" />);
    expect(screen.queryByRole('link', { name: /^Previous/ })).not.toBeInTheDocument();
  });

  it('leads with this repository’s own decisions, each opening with one screen before the scenario', () => {
    const own = decisions.filter((decision) => decision.project);
    expect(own.map((decision) => decision.id)).toEqual(['implementation', 'component-apis', 'alignment', 'quality', 'sharing']);
    expect(decisions.slice(0, own.length)).toEqual(own);
    expect(entriesOfKind('decision').map((entry) => entry.id)).toEqual(decisions.map((decision) => decision.id));

    for (const decision of decisions) {
      const topic = decisionTopics.find((candidate) => candidate.id === decision.id);
      const ids = topic?.sections.map((section) => section.id) ?? [];
      const { project } = decision;
      if (!project) {
        expect(ids[0], decision.id).toBe('record');
        continue;
      }
      const lead = project.lead ?? [];
      expect(ids.slice(0, lead.length + 2), decision.id).toEqual(['project', ...lead, 'record']);
      const parts = [project.choice, project.constraint, project.tryIt.text, project.tradeoff, project.evidence];
      for (const part of parts) expect(part.trim().length, decision.id).toBeGreaterThan(0);
      expect(parts.join(' ').split(/\s+/).length, decision.id).toBeLessThanOrEqual(200);
      expect(project.tryIt.links.length, decision.id).toBeGreaterThan(0);
      for (const link of project.tryIt.links) expect(link.href, decision.id).toMatch(/^\//);
    }
  });

  it('groups the overview into this project’s decisions and the product-team scenario', () => {
    render(<DecisionsIndex />);
    const own = within(screen.getByRole('list', { name: 'Decisions in this project' })).getAllByRole('listitem');
    const team = within(screen.getByRole('list', { name: 'Applying the approach to a product team' })).getAllByRole('listitem');
    expect(own.length + team.length).toBe(decisionTopics.length);
    for (const [index, card] of own.entries()) {
      const topic = decisionTopics[index];
      expect(within(card).getByRole('link', { name: findEntry(topic?.id ?? '')?.name })).toHaveAttribute('href', `/decisions/${topic?.id ?? ''}`);
      for (const link of topic?.project?.tryIt.links ?? []) expect(within(card).getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
    const firstTeam = decisionTopics[own.length];
    expect(within(team[0] as HTMLElement).getByText(firstTeam?.choice ?? '')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Products in the scenario' })).getAllByRole('listitem')).toHaveLength(2);
    for (const label of ['Implemented', 'Hypothetical', 'Proposed', 'Conceptual']) expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });
});
