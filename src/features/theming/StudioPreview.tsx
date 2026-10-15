import { Card, Field } from '@/design-system/composites';
import { Grid, Inline, Stack, ThemeScope } from '@/design-system/layout';
import { Badge, Button, Checkbox, Heading, Input, Link, Switch, Text } from '@/design-system/primitives';
import styles from './ThemeStudio.module.css';
import { previewProduct, type ThemeStudioState } from './useThemeStudio';

function Specimen({ studio, theme }: { studio: ThemeStudioState; theme: 'light' | 'dark' }) {
  return (
    <ThemeScope
      as="section"
      theme={theme}
      product={previewProduct}
      className={styles.preview}
      style={studio.previewStyle(theme)}
      aria-label={`${studio.name}, ${theme} theme`}
    >
      <Stack gap="medium">
        <div className={styles.previewBar}>
          <span className={styles.previewMark} aria-hidden="true" />
          <span className={styles.caption}>
            {studio.name} · {theme}
          </span>
        </div>
        <Card
          header={
            <Inline gap="extraSmall" justify="between">
              <Heading level={3} size="small">
                Quarterly report
              </Heading>
              <Badge tone="brand" appearance="filled">
                New
              </Badge>
            </Inline>
          }
          footer={
            <Inline gap="small">
              <Button appearance="primary">Publish</Button>
              <Button>Preview</Button>
            </Inline>
          }
        >
          <Stack gap="medium">
            <Text>
              Revenue grew 12% on the quarter. <Link href="#preview">See the breakdown</Link>.
            </Text>
            <Field label="Report title">{(control) => <Input {...control} defaultValue="Q3 close" />}</Field>
            <Inline gap="extraSmall">
              <Badge tone="brand">Subtle</Badge>
              <Badge tone="brand" appearance="outlined">
                Outlined
              </Badge>
              <Text as="span" tone="brand" variant="label">
                Brand text
              </Text>
            </Inline>
            <Checkbox label="Include forecasts" defaultChecked />
            <Switch label="Email me updates" defaultChecked />
          </Stack>
        </Card>
        <ul className={styles.states} aria-label="Primary button states">
          <li className={styles.state} data-state="rest">
            Rest
          </li>
          <li className={styles.state} data-state="hover">
            Hover
          </li>
          <li className={styles.state} data-state="pressed">
            Pressed
          </li>
          <li className={styles.state} data-state="focus">
            Focus
          </li>
        </ul>
      </Stack>
    </ThemeScope>
  );
}

/**
 * The generated roles and shape on real components, in real theme scopes. Only the brand roles
 * and corner radii change; surfaces, text and status colors come from the system.
 */
export function StudioPreview({ studio }: { studio: ThemeStudioState }) {
  return (
    <Stack gap="small">
      <Text variant="bodySmall" tone="muted">
        Visual specimens: Publish and Preview show the generated styles and do not do anything.
      </Text>
      <Grid minColumnWidth="medium" gap="medium">
        <Specimen studio={studio} theme="light" />
        <Specimen studio={studio} theme="dark" />
      </Grid>
    </Stack>
  );
}
