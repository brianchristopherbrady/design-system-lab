import { useState } from 'react';
import { Field, Tabs } from '@/design-system/composites';
import { Stack } from '@/design-system/layout';
import { Select, Text } from '@/design-system/primitives';

const items = [
  { id: 'overview', label: 'Overview', content: <Text variant="bodySmall">Status, owner and last change for the record.</Text> },
  { id: 'tokens', label: 'Tokens', content: <Text variant="bodySmall">The tokens this record reads.</Text> },
  { id: 'history', label: 'History', content: <Text variant="bodySmall">Every change, newest first.</Text> },
];

const labels = { overview: 'Overview', tokens: 'Tokens', history: 'History' } as const;

/** The shared Tabs in either writing direction, so the mirrored arrow keys can be tried. */
export function DirectionTabs() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [selected, setSelected] = useState<keyof typeof labels>('overview');
  return (
    <Stack gap="medium">
      <Field label="Writing direction" description="Right to left mirrors the layout, so ArrowLeft moves to the next tab.">
        {(control) => (
          <Select {...control} value={direction} onChange={(event) => setDirection(event.target.value as 'ltr' | 'rtl')}>
            <option value="ltr">Left to right</option>
            <option value="rtl">Right to left</option>
          </Select>
        )}
      </Field>
      <div dir={direction}>
        <Tabs label="Record details" items={items} onSelectedChange={(id) => setSelected(id as keyof typeof labels)} />
      </div>
      <Text variant="bodySmall" tone="muted" aria-live="polite">
        Selected: {labels[selected]}
      </Text>
    </Stack>
  );
}
