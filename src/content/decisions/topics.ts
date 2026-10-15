import type { ComponentType } from 'react';
import { adoption } from './articles/adoption';
import { alignment } from './articles/alignment';
import { componentApis } from './articles/componentApis';
import { implementation } from './articles/implementation';
import { operating } from './articles/operating';
import { planning } from './articles/planning';
import { quality } from './articles/quality';
import { sharing } from './articles/sharing';
import { decisionContent, decisionSections } from './DecisionArticle';
import type { Decision, ProjectOpening } from './types';

export interface DecisionTopic {
  /** Catalog id; the title and summary come from the catalog entry. */
  id: string;
  stage: string;
  question: string;
  /** The decision in one sentence. */
  choice: string;
  matters: string;
  /** Present when the page is about this repository's own choice. */
  project?: ProjectOpening;
  sections: readonly { id: string; label: string }[];
  Content: ComponentType;
}

/** Reading order: this repository's own decisions first, then applying the approach to a product team. */
export const decisions: readonly Decision[] = [implementation, componentApis, alignment, quality, sharing, planning, adoption, operating];

export const decisionTopics: readonly DecisionTopic[] = decisions.map((decision) => ({
  id: decision.id,
  stage: decision.stage,
  question: decision.question,
  choice: decision.record.choice[0]?.text ?? '',
  matters: decision.matters,
  project: decision.project,
  sections: decisionSections(decision),
  Content: decisionContent(decision),
}));

export function findDecisionTopic(id: string): DecisionTopic | undefined {
  return decisionTopics.find((topic) => topic.id === id);
}
