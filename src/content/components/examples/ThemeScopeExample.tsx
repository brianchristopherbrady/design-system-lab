import { Card } from '@/design-system/composites';
import { Grid, Inline, Stack, ThemeScope, useThemeScope } from '@/design-system/layout';
import { Badge, Button, Text } from '@/design-system/primitives';
import { LiveExample } from '@/features/docs';
import styles from './examples.module.css';

const source = 'src/content/components/examples/ThemeScopeExample.tsx';

function ScopeReport() {
  const scope = useThemeScope();
  return (
    <Text variant="bodySmall" tone="muted">
      theme={scope.theme} · product={scope.product} · density={scope.density}
    </Text>
  );
}

function Sample() {
  return (
    <Card padding="medium">
      <Stack gap="small">
        <ScopeReport />
        <Inline gap="small">
          <Button appearance="primary" size="small">
            Primary
          </Button>
          <Badge tone="brand">Brand</Badge>
        </Inline>
      </Stack>
    </Card>
  );
}

export function ThemeScopeExample() {
  return (
    <>
      <LiveExample
        title="Override one modifier, inherit the rest"
        kind="recommended"
        sourcePath={source}
        description="Each scope sets only what it changes. The text inside reports the full context it received, and the scope element carries all three data attributes."
      >
        <Grid minColumnWidth="small" gap="medium">
          <ThemeScope theme="dark" className={styles.frameBody}>
            <Sample />
          </ThemeScope>
          <ThemeScope product="provider" className={styles.frameBody}>
            <Sample />
          </ThemeScope>
          <ThemeScope product="patient" density="compact" className={styles.frameBody}>
            <Sample />
          </ThemeScope>
        </Grid>
      </LiveExample>
      <LiveExample
        title="Nested scopes"
        kind="recommended"
        sourcePath={source}
        description="An inner scope inherits from the outer one, not from the page: here the inner region keeps the patient app’s profile and changes only the theme."
      >
        <ThemeScope product="patient" className={styles.frameBody}>
          <Stack gap="small">
            <ScopeReport />
            <ThemeScope theme="dark" className={styles.frameBody}>
              <Sample />
            </ThemeScope>
          </Stack>
        </ThemeScope>
      </LiveExample>
    </>
  );
}
