import { Inline } from '@/design-system/layout';
import { Icon, Link } from '@/design-system/primitives';
import { findComponentDoc, playgroundStories } from '@/content/components';
import { findEntry } from '@/domain/system';
import { Playground, usePlaygroundConfig } from '@/features/playground';
import { paths } from '../paths';
import { DocPage } from './DocPage';

/** Opens on a familiar component; ThemeScope and the others stay one choice away. */
const defaultStoryId = playgroundStories.some((story) => story.id === 'button') ? 'button' : (playgroundStories[0]?.id ?? '');

export function PlaygroundPage() {
  const playground = usePlaygroundConfig(playgroundStories, defaultStoryId);

  return (
    <DocPage
      title="Playground"
      eyebrow="Design system"
      width="wide"
      description="Choose a component, edit its props and copy the code. The header’s theme applies to the whole site; preview settings change only the example."
    >
      {playground.config && (
        <Playground
          stories={playgroundStories}
          config={playground.config}
          onConfigChange={playground.update}
          onStoryChange={playground.selectStory}
          linkFor={playground.linkFor}
          apiFor={(story) => findComponentDoc(story.id)?.props}
          renderLinks={(story) => (
            <Inline gap="medium">
              <Link href={paths.component(story.id)} variant="standalone">
                {findEntry(story.id)?.name ?? story.component} documentation <Icon name="arrowRight" />
              </Link>
              <Link href={`${paths.component(story.id)}#source`} variant="standalone">
                Source <Icon name="arrowRight" />
              </Link>
            </Inline>
          )}
        />
      )}
    </DocPage>
  );
}
