import { DecisionsIndex } from '@/content/decisions';
import { DocPage } from './DocPage';

export function DecisionsIndexPage() {
  return (
    <DocPage
      title="Design decisions"
      eyebrow="Reasoning"
      description="These pages explain choices behind this project: how I structured the tokens, designed component APIs, kept documentation close to the code and checked interaction behavior. Start with a working example, then follow the reasoning. The broader product scenarios show how I would approach problems beyond this site."
    >
      <DecisionsIndex />
    </DocPage>
  );
}
