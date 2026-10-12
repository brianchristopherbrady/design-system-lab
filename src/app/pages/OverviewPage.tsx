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
          A working design system, designed and built by <Link href={author.portfolio}>{author.name}</Link>. Its tokens,
          components and interface patterns are documented here, and this website is built from them.
        </>
      }
      actions={<OverviewActions author={author} />}
      sections={overviewSections}
    >
      <OverviewContent author={author} />
    </DocPage>
  );
}
