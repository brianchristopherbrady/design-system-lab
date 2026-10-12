import { DecisionsIndex } from '@/content/decisions';
import { DocPage } from './DocPage';

export function DecisionsIndexPage() {
  return (
    <DocPage
      title="Design decisions"
      eyebrow="Reasoning"
      description="Four engineering decisions, from requirements to operation, followed through one hypothetical scenario."
    >
      <DecisionsIndex />
    </DocPage>
  );
}
