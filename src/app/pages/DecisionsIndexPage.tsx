import { DecisionsIndex } from '@/content/decisions';
import { DocPage } from './DocPage';

export function DecisionsIndexPage() {
  return (
    <DocPage
      title="Design decisions"
      eyebrow="Reasoning"
      description="Engineering decisions, from requirements to operation, followed through one hypothetical scenario."
    >
      <DecisionsIndex />
    </DocPage>
  );
}
