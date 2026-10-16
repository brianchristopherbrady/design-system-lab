import type { ComponentType } from 'react';
import type { SourceId } from '@/domain/decisions';

/** Whether material is built in this repository, part of the patient app and provider workspace scenario, proposed reasoning or a sketch. */
export type Evidence = 'implemented' | 'hypothetical' | 'proposed' | 'conceptual';

/** A labelled statement. Implemented statements name the working example that supports them. */
export interface Statement {
  evidence: Evidence;
  text?: string;
  items?: readonly string[];
  example?: { label: string; href: string };
}

/** Text may use `code`, **strong** and Markdown-style links. */
export type Block =
  | { kind: 'text'; evidence?: Evidence; paragraphs: readonly string[] }
  | { kind: 'list'; ordered?: boolean; items: readonly string[] }
  | { kind: 'steps'; items: readonly { title: string; text: string; output?: string; note?: Statement }[] }
  | {
      kind: 'table';
      caption: string;
      evidence?: Evidence | readonly Evidence[];
      /** Scroll sideways with readable columns. */
      wide?: boolean;
      /** Show each row as a card, so no column is hidden off-screen. */
      stacked?: boolean;
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    }
  | { kind: 'note'; title: string; text: string }
  | { kind: 'visual'; evidence?: Evidence | readonly Evidence[]; caption?: string; Visual: ComponentType }
  | { kind: 'code'; evidence: Evidence; caption: string; language: string; code: string }
  | { kind: 'details'; items: readonly { summary: string; blocks: readonly Block[] }[] }
  | { kind: 'record'; caption: string; fields: readonly RecordField[] }
  | { kind: 'evidence'; items: readonly { label: string; href: string; shows: string }[] };

export interface RecordField {
  label: string;
  statements: readonly Statement[];
}

export interface DecisionSection {
  id: string;
  title: string;
  blocks: readonly Block[];
}

/** A short decision record: what was decided for the scenario, and the evidence behind it. */
export interface DecisionRecord {
  context: readonly Statement[];
  /** The first statement is the decision in one sentence; the overview card shows it. */
  choice: readonly Statement[];
  alternatives: readonly Statement[];
  consequences: readonly Statement[];
  validation: readonly Statement[];
  reconsider: readonly Statement[];
}

/** How a page opens when the decision is one this repository made: one screen, before the scenario. */
export interface ProjectOpening {
  /** What this repository chose. The overview card shows it. */
  choice: string;
  constraint: string;
  /** Something to do with a working example, and where to do it. */
  tryIt: { text: string; links: readonly { label: string; href: string }[] };
  tradeoff: string;
  /** What the checks establish, and what they leave open. */
  evidence: string;
  /** Ids of sections about this repository that come before the scenario's decision record. */
  lead?: readonly string[];
}

export interface Decision {
  /** Catalog id; the page title and summary come from the catalog entry. */
  id: string;
  /** The stage of the scenario the decision belongs to. */
  stage: string;
  question: string;
  /** Why the decision matters, in one sentence. */
  matters: string;
  /** Present on pages about this repository's own choices, which lead the section. */
  project?: ProjectOpening;
  record: DecisionRecord;
  sections: readonly DecisionSection[];
  sources?: readonly SourceId[];
}
