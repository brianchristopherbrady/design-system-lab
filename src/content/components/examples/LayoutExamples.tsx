import { Box, Container, Grid, Inline, ScrollRegion, Stack } from '@/design-system/layout';
import { Badge, Button, Icon, Text } from '@/design-system/primitives';
import { surfaceScale, toneScale } from '@/design-system/tokens';
import { LiveExample } from '@/features/docs';
import { Labelled, NarrowAndWide } from './frames';
import styles from './examples.module.css';

const source = 'src/content/components/examples/LayoutExamples.tsx';

function Tile({ children }: { children: string }) {
  return (
    <Box padding="small" background="accent" border="default" radius="medium">
      <Text variant="bodySmall">{children}</Text>
    </Box>
  );
}

const tileLabels = ['Tokens', 'A tile with a much longer label that wraps', 'Patterns', 'Themes', 'Motion', 'Spacing'];

export function BoxExample() {
  return (
    <LiveExample
      title="Surfaces, borders and radii"
      kind="recommended"
      sourcePath={source}
      description="Every value comes from a scale: there is no way to pass an arbitrary padding or color."
    >
      <Grid minColumnWidth="extraSmall" gap="medium">
        {surfaceScale.map((surface) => (
          <Box key={surface} padding="medium" background={surface} border="default" radius="large">
            <Text variant="label">background="{surface}"</Text>
          </Box>
        ))}
      </Grid>
    </LiveExample>
  );
}

export function StackExample() {
  return (
    <LiveExample
      title="Gap vocabulary"
      kind="recommended"
      sourcePath={source}
      description="The same named gaps work on Stack, Inline and Grid. Compare small and extraLarge."
    >
      <Grid columns={2} minColumnWidth="extraSmall" gap="large">
        {(['small', 'extraLarge'] as const).map((gap) => (
          <Labelled key={gap} label={`gap="${gap}"`}>
            <Stack gap={gap}>
              <Tile>First</Tile>
              <Tile>Second</Tile>
              <Tile>Third</Tile>
            </Stack>
          </Labelled>
        ))}
      </Grid>
    </LiveExample>
  );
}

export function InlineExample() {
  return (
    <LiveExample
      title="Wrapping clusters and toolbars"
      kind="recommended"
      sourcePath={source}
      description="Inline wraps by default, so a cluster of tags never overflows a narrow container."
    >
      <NarrowAndWide>
        <Stack gap="medium">
          <Inline gap="extraSmall">
            {toneScale.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Inline>
          <Inline justify="between" gap="small">
            <Text variant="label">3 selected</Text>
            <Inline gap="extraSmall">
              <Button size="small" iconStart={<Icon name="download" />}>
                Export
              </Button>
              <Button size="small" appearance="danger" iconStart={<Icon name="trash" />}>
                Delete
              </Button>
            </Inline>
          </Inline>
        </Stack>
      </NarrowAndWide>
    </LiveExample>
  );
}

export function GridExample() {
  const items = tileLabels.map((label) => <Tile key={label}>{label}</Tile>);
  return (
    <>
      <LiveExample
        title="Three column modes"
        kind="recommended"
        sourcePath={source}
        description="Each frame holds the same six tiles. Fixed keeps three columns even when they get cramped; responsive fits as many small columns as possible; capped fits as many as possible but never more than three."
      >
        <Stack gap="large">
          <Labelled label='Fixed: columns={3}'>
            <Grid columns={3} gap="small">
              {items}
            </Grid>
          </Labelled>
          <Labelled label='Responsive: minColumnWidth="small"'>
            <Grid minColumnWidth="small" gap="small">
              {items}
            </Grid>
          </Labelled>
          <Labelled label='Capped: columns={3} minColumnWidth="extraSmall"'>
            <Grid columns={3} minColumnWidth="extraSmall" gap="small">
              {items}
            </Grid>
          </Labelled>
        </Stack>
      </LiveExample>
      <LiveExample
        title="Row and column gaps"
        kind="recommended"
        sourcePath={source}
        description="rowGap and columnGap each override gap on one axis. Here gap is extraLarge, but rowGap brings rows close together."
      >
        <Grid minColumnWidth="extraSmall" gap="extraLarge" rowGap="extraSmall">
          {items}
        </Grid>
      </LiveExample>
      <LiveExample
        title="Container-relative wrapping"
        kind="recommended"
        sourcePath={source}
        description="The responsive grid responds to the space it is given, not to the viewport: the narrow frame gets one column on any screen."
      >
        <NarrowAndWide>
          <Grid minColumnWidth="extraSmall" gap="small">
            {items.slice(0, 4)}
          </Grid>
        </NarrowAndWide>
      </LiveExample>
    </>
  );
}

export function ContainerExample() {
  return (
    <LiveExample
      title="Readable width with fluid gutters"
      kind="recommended"
      sourcePath={source}
      description="Container centers content at a token-defined maximum and adds gutters that grow with the viewport."
    >
      <Box background="sunken" radius="medium">
        <Container width="narrow">
          <Box padding="medium" background="panel" border="subtle">
            <Text>Content capped at size.container.narrow (48rem).</Text>
          </Box>
        </Container>
      </Box>
    </LiveExample>
  );
}

const releases = [
  { version: '0.4.0', date: '8 Oct 2026', change: 'Adds Disclosure and ScrollRegion; docs disclosures meet the 24px target size.' },
  { version: '0.3.0', date: '7 Oct 2026', change: 'Adds Dialog and Tabs, and renames Button variant to appearance.' },
  { version: '0.2.0', date: '6 Oct 2026', change: 'Adds the Harbor and Meadow products and the compact density.' },
];

export function ScrollRegionExample() {
  return (
    <LiveExample
      title="A wide table inside a narrow column"
      kind="recommended"
      sourcePath={source}
      description="The table keeps its columns and scrolls on its own; the page never scrolls sideways. Tab to the region and use the arrow keys to scroll it."
    >
      <NarrowAndWide>
        {(frame) => (
          <ScrollRegion aria-label={`Release history, ${frame === 'narrow' ? 'narrow' : 'full-width'} container`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Date</th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.version}>
                    <th scope="row">{release.version}</th>
                    <td>{release.date}</td>
                    <td>{release.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        )}
      </NarrowAndWide>
    </LiveExample>
  );
}
