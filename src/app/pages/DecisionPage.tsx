import { useParams } from 'react-router';
import { Link } from '@/design-system/primitives';
import { DecisionPager, decisionTopics, findDecisionTopic, type DecisionTopic } from '@/content/decisions';
import { findEntry, type CatalogEntry } from '@/domain/system';
import { paths } from '../paths';
import { DocPage } from './DocPage';
import { NotFoundPage } from './NotFoundPage';

function DecisionView({ entry, topic }: { entry: CatalogEntry; topic: DecisionTopic }) {
  const position = decisionTopics.indexOf(topic) + 1;
  const eyebrow = (
    <>
      <Link href={paths.decisions}>Design decisions</Link> · {position} of {decisionTopics.length} · {topic.stage}
    </>
  );
  return (
    <DocPage title={entry.name} eyebrow={eyebrow} description={topic.question} sections={topic.sections}>
      <topic.Content />
      <DecisionPager id={topic.id} />
    </DocPage>
  );
}

export function DecisionPage() {
  const { decisionId = '' } = useParams();
  const topic = findDecisionTopic(decisionId);
  const entry = findEntry(decisionId);
  return topic && entry?.kind === 'decision' ? <DecisionView key={topic.id} entry={entry} topic={topic} /> : <NotFoundPage kind="design decision" />;
}
