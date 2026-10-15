import { Link } from '@/design-system/primitives';
import { OverviewActions, OverviewContent, overviewSections } from '@/content/overview';
import { appName, author } from '../paths';
import { DocPage } from './DocPage';

export function OverviewPage() {
  return (
    <DocPage
      title={appName}
      eyebrow="Overview"
      description={
        <>
          I’m <Link href={author.portfolio}>{author.name}</Link>, a design engineer. I built this site to show how I turn
          design decisions into reusable components, accessible interactions and tools that keep implementation and
          documentation aligned. The site uses the same tokens and components it documents.
        </>
      }
      actions={<OverviewActions author={author} />}
      sections={overviewSections}
    >
      <OverviewContent author={author} />
    </DocPage>
  );
}
