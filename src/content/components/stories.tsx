import { useState } from 'react';
import {
  Alert,
  alertTones,
  Card,
  Dialog,
  dialogSizes,
  Disclosure,
  disclosureAppearances,
  EmptyState,
  type AlertProps,
  type CardProps,
  type DialogProps,
  type DisclosureProps,
  type EmptyStateProps,
} from '@/design-system/composites';
import {
  Box,
  Grid,
  gridAlignments,
  gridColumnCounts,
  Inline,
  inlineAlignments,
  inlineJustifications,
  Stack,
  stackAlignments,
  ThemeScope,
  type BoxProps,
  type GridProps,
  type InlineProps,
  type StackProps,
  type ThemeScopeProps,
} from '@/design-system/layout';
import {
  Badge,
  badgeAppearances,
  badgeSizes,
  Button,
  buttonAppearances,
  buttonBorders,
  buttonSizes,
  Checkbox,
  Heading,
  headingAlignments,
  headingLevels,
  headingSizes,
  headingTones,
  Icon,
  iconNames,
  iconSizes,
  Input,
  Link,
  linkVariants,
  Progress,
  Skeleton,
  skeletonShapes,
  skeletonSizes,
  Switch,
  Text,
  textAlignments,
  textElements,
  textTones,
  textVariants,
  type BadgeProps,
  type ButtonProps,
  type CheckboxProps,
  type HeadingProps,
  type IconProps,
  type InputProps,
  type LinkProps,
  type ProgressProps,
  type SkeletonProps,
  type SwitchProps,
  type TextProps,
} from '@/design-system/primitives';
import {
  borderScale,
  columnWidthScale,
  densityNames,
  elevationScale,
  productNames,
  radiusScale,
  spaceScale,
  surfaceScale,
  themeNames,
  toneScale,
} from '@/design-system/tokens';
import { productExamples } from '@/domain/scenario';
import { defineStory, type AnyStory } from '@/features/playground';

const importFrom = (path: string) => (...names: string[]) => `import { ${names.join(', ')} } from '@/design-system/${path}';`;
const primitives = importFrom('primitives');
const layout = importFrom('layout');
const composites = importFrom('composites');

const patientScope = { product: productExamples.patient.profile, density: productExamples.patient.density };
const providerScope = { product: productExamples.provider.profile, density: productExamples.provider.density };

/** Sample content for layout stories: varied lengths make alignment and wrapping visible. */
const tileText = ['Tokens', 'Components with a longer label', 'Patterns', 'Themes', 'Responsive layout behavior', 'Motion'];

function Tile({ children }: { children: string }) {
  return (
    <Box padding="small" background="accent" border="default" radius="medium">
      <Text variant="bodySmall">{children}</Text>
    </Box>
  );
}

const tiles = (count = tileText.length) => tileText.slice(0, count).map((text) => <Tile key={text}>{text}</Tile>);

function DialogPreview(props: Omit<DialogProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const playgroundStories: readonly AnyStory[] = [
  defineStory<ThemeScopeProps>({
    id: 'theme-scope',
    component: 'ThemeScope',
    summary: 'Re-theme a region. Unset modifiers inherit from the scope around it: here the preview, which follows the site unless a preview setting overrides it.',
    imports: [layout('ThemeScope')],
    snippetChildren: '{children}',
    inheritsScope: true,
    controls: [
      { kind: 'select', prop: 'product', options: productNames, defaultValue: 'provider', unsetLabel: 'parent scope', unsetKind: 'inherit', description: 'Brand roles, typefaces and shape.' },
      { kind: 'select', prop: 'theme', options: themeNames, defaultValue: undefined, unsetLabel: 'parent scope', unsetKind: 'inherit', description: 'Color theme.' },
      { kind: 'select', prop: 'density', options: densityNames, defaultValue: undefined, unsetLabel: 'parent scope', unsetKind: 'inherit', description: 'Control size and spacing.' },
    ],
    presets: [
      { name: 'Patient app, dark', values: { product: 'patient', theme: 'dark' } },
      { name: 'Provider workspace, compact', values: { product: 'provider', density: 'compact' } },
    ],
    render: (props) => (
      <ThemeScope {...props}>
        <Card padding="medium" header={<Heading level={3} size="small">Pending approvals</Heading>}>
          <Stack gap="small">
            <Inline gap="small">
              <Badge tone="brand">Brand</Badge>
              <Badge tone="success">Paid</Badge>
            </Inline>
            <Inline gap="small">
              <Button appearance="primary">Approve</Button>
              <Button>Later</Button>
            </Inline>
          </Stack>
        </Card>
      </ThemeScope>
    ),
  }),
  defineStory<ButtonProps>({
    id: 'button',
    component: 'Button',
    summary: 'Appearance and size use Button’s component tokens; border and an explicit radius read fixed reference scales. Native button behavior is untouched.',
    imports: [primitives('Button', 'Icon')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'Save changes', description: 'Visible label and accessible name.' },
      { kind: 'select', prop: 'appearance', options: buttonAppearances, defaultValue: 'secondary', description: 'Background treatment and emphasis.' },
      { kind: 'select', prop: 'size', options: buttonSizes, defaultValue: 'medium', description: 'Height, inline padding and font size.' },
      { kind: 'select', prop: 'border', options: buttonBorders, defaultValue: 'thin', description: 'Border width; the color comes from the appearance.' },
      { kind: 'select', prop: 'radius', options: radiusScale, defaultValue: undefined, unsetLabel: 'button.radius token', unsetKind: 'token', description: 'Corner radius from the radius scale.' },
      { kind: 'icon', prop: 'iconStart', defaultValue: undefined, description: 'Decorative icon before the label.' },
      { kind: 'icon', prop: 'iconEnd', defaultValue: undefined, description: 'Decorative icon after the label.' },
      { kind: 'switch', prop: 'fullWidth', defaultValue: false, description: 'Fill the container width.' },
      { kind: 'switch', prop: 'loading', defaultValue: false, description: 'Show progress and ignore activation; keeps focus.' },
      { kind: 'switch', prop: 'disabled', defaultValue: false, description: 'Native disabled: not focusable, not submitted.' },
    ],
    presets: [
      { name: 'Primary action', values: { appearance: 'primary', children: 'Publish release', iconEnd: 'arrowRight' } },
      { name: 'Destructive', values: { appearance: 'danger', children: 'Delete entry', iconStart: 'trash' } },
      { name: 'Toolbar', values: { appearance: 'ghost', size: 'small', border: 'none', children: 'Refresh', iconStart: 'refresh' } },
      { name: 'Loading', values: { appearance: 'primary', loading: true, children: 'Saving' } },
      { name: 'Pill', values: { radius: 'full', size: 'large', border: 'thick', children: 'Get started' } },
    ],
    render: (props) => <Button {...props} />,
  }),
  defineStory<BadgeProps>({
    id: 'badge',
    component: 'Badge',
    summary: 'Background, text and border come from one tone; the appearance decides which tone roles apply.',
    imports: [primitives('Badge', 'Icon')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'In review', description: 'The label. It must state the meaning on its own.' },
      { kind: 'select', prop: 'tone', options: toneScale, defaultValue: 'neutral', description: 'Color role.' },
      { kind: 'select', prop: 'appearance', options: badgeAppearances, defaultValue: 'subtle', description: 'Solid fill, tinted fill or outline.' },
      { kind: 'select', prop: 'size', options: badgeSizes, defaultValue: 'medium', description: 'Height, padding and font size.' },
      { kind: 'select', prop: 'radius', options: radiusScale, defaultValue: undefined, unsetLabel: 'badge.radius token (full)', unsetKind: 'token', description: 'Corner radius.' },
      { kind: 'icon', prop: 'icon', defaultValue: undefined, description: 'Decorative icon before the label.' },
    ],
    presets: [
      { name: 'Success', values: { tone: 'success', children: 'Passed', icon: 'check' } },
      { name: 'Danger filled', values: { tone: 'danger', appearance: 'filled', children: 'Blocked', icon: 'danger' } },
      { name: 'Info outlined', values: { tone: 'info', appearance: 'outlined', children: 'Beta' } },
      { name: 'Square tag', values: { tone: 'brand', radius: 'small', size: 'small', children: 'tokens' } },
    ],
    render: (props) => <Badge {...props} />,
  }),
  defineStory<CardProps>({
    id: 'card',
    component: 'Card',
    summary: 'Unset styling props fall back to the card component tokens; set props override them one by one.',
    imports: [composites('Card'), primitives('Heading', 'Text')],
    controls: [
      { kind: 'text', prop: 'header', defaultValue: 'Release 4.2', description: 'Header region; here a heading.', wrap: { render: (text) => <Heading level={3} size="small">{text}</Heading>, snippet: (text) => `<Heading level={3} size="small">${text}</Heading>` } },
      { kind: 'text', prop: 'children', defaultValue: 'Adds Dialog and Tabs, and renames Button variant to appearance.', description: 'Body content.' },
      { kind: 'text', prop: 'footer', defaultValue: 'Updated 7 Oct 2026', description: 'Footer region; here muted text.', wrap: { render: (text) => <Text variant="bodySmall" tone="muted">{text}</Text>, snippet: (text) => `<Text variant="bodySmall" tone="muted">${text}</Text>` } },
      { kind: 'select', prop: 'surface', options: surfaceScale, defaultValue: undefined, unsetLabel: 'card.background (panel)', unsetKind: 'token', description: 'Background role.' },
      { kind: 'select', prop: 'padding', options: spaceScale, defaultValue: undefined, unsetLabel: 'card.padding (large)', unsetKind: 'token', description: 'Padding on every side.' },
      { kind: 'select', prop: 'radius', options: radiusScale, defaultValue: undefined, unsetLabel: 'card.radius (large)', unsetKind: 'token', description: 'Corner radius.' },
      { kind: 'select', prop: 'border', options: borderScale, defaultValue: undefined, unsetLabel: 'card.border (subtle)', unsetKind: 'token', description: 'Border color strength.' },
      { kind: 'select', prop: 'elevation', options: elevationScale, defaultValue: undefined, unsetLabel: 'card.elevation (low)', unsetKind: 'token', description: 'Shadow depth.' },
    ],
    presets: [
      { name: 'Flat', values: { elevation: 'none', border: 'default' } },
      { name: 'Raised', values: { elevation: 'high', border: 'none' } },
      { name: 'Inset panel', values: { surface: 'sunken', elevation: 'none', border: 'none', radius: 'medium' } },
      { name: 'Compact', values: { padding: 'small', radius: 'small', footer: '' } },
      {
        name: 'Patient app: appointment',
        scope: patientScope,
        values: {
          header: 'Annual check-up',
          children: 'Your request for weekday mornings is with the clinic. You will hear back by email within two working days.',
          footer: 'Request R-2041 · Requested',
          surface: 'accent',
        },
      },
      {
        name: 'Provider workspace: review',
        scope: providerScope,
        values: {
          header: 'R-2042 · Priya N.',
          children: 'Follow-up visit, any afternoon. Needs a contact phone number before it can be confirmed.',
          footer: 'Needs details · Received 14 Oct 2026',
          padding: 'medium',
          elevation: 'none',
          border: 'default',
        },
      },
    ],
    render: (props) => <Card {...props} />,
  }),
  defineStory<DialogProps>({
    id: 'dialog',
    component: 'Dialog',
    summary: 'A native modal dialog. The preview opens it in the top layer, inheriting the preview theme.',
    imports: ["import { useState } from 'react';", composites('Dialog'), primitives('Badge', 'Text')],
    setup: ['const [open, setOpen] = useState(false);'],
    fixedAttributes: ['open={open}', 'onClose={() => setOpen(false)}'],
    previewNote: 'A modal dialog covers the whole viewport, so the preview width does not constrain it; size does. Close it with Escape or the close button, or by clicking the backdrop when dismissOnBackdrop is on.',
    controls: [
      { kind: 'text', prop: 'title', defaultValue: 'Archive this entry?', description: 'Visible title and accessible name.' },
      { kind: 'text', prop: 'description', defaultValue: 'It will be hidden from the directory.', description: 'Accessible description.' },
      { kind: 'text', prop: 'children', defaultValue: 'Archived entries can be restored from settings.', description: 'Body content.' },
      { kind: 'text', prop: 'header', defaultValue: '', description: 'Extra header content; here a badge.', wrap: { render: (text) => <Badge tone="warning" size="small">{text}</Badge>, snippet: (text) => `<Badge tone="warning" size="small">${text}</Badge>` } },
      { kind: 'text', prop: 'footer', defaultValue: 'Changes apply immediately.', description: 'Footer region; here muted text.', wrap: { render: (text) => <Text variant="bodySmall" tone="muted">{text}</Text>, snippet: (text) => `<Text variant="bodySmall" tone="muted">${text}</Text>` } },
      { kind: 'select', prop: 'size', options: dialogSizes, defaultValue: 'medium', description: 'Maximum width from dialog.width tokens.' },
      { kind: 'select', prop: 'surface', options: surfaceScale, defaultValue: undefined, unsetLabel: 'dialog.background (panel)', unsetKind: 'token', description: 'Background role.' },
      { kind: 'select', prop: 'padding', options: spaceScale, defaultValue: undefined, unsetLabel: 'dialog.padding (large)', unsetKind: 'token', description: 'Padding.' },
      { kind: 'select', prop: 'radius', options: radiusScale, defaultValue: undefined, unsetLabel: 'dialog.radius (extraLarge)', unsetKind: 'token', description: 'Corner radius.' },
      { kind: 'select', prop: 'border', options: borderScale, defaultValue: undefined, unsetLabel: 'dialog.border (subtle)', unsetKind: 'token', description: 'Border color strength.' },
      { kind: 'select', prop: 'elevation', options: elevationScale, defaultValue: undefined, unsetLabel: 'dialog.elevation (high)', unsetKind: 'token', description: 'Shadow depth.' },
      { kind: 'switch', prop: 'dismissOnBackdrop', defaultValue: false, description: 'Close on a backdrop click. Escape and the close button work either way.' },
    ],
    presets: [
      { name: 'Small confirm', values: { size: 'small', children: '', header: 'Irreversible', dismissOnBackdrop: false } },
      { name: 'Large form', values: { size: 'large', title: 'Edit entry', description: 'Change the name and summary.', footer: '' } },
      { name: 'Flat', values: { elevation: 'none', border: 'strong', radius: 'small' } },
      { name: 'Dismiss on backdrop', values: { size: 'small', title: 'Keyboard shortcuts', description: 'Press ? to open this list.', children: '', footer: 'Click outside to close.', dismissOnBackdrop: true } },
      {
        name: 'Patient app: send request',
        scope: patientScope,
        values: {
          size: 'small',
          title: 'Send your appointment request?',
          description: 'Annual check-up, weekday mornings.',
          children: 'The clinic confirms a time by email. You can change or cancel the request until then.',
          footer: 'Requests are answered within two working days.',
        },
      },
      {
        name: 'Provider workspace: confirm',
        scope: providerScope,
        values: {
          title: 'Confirm 2 requests?',
          description: 'R-2041 and R-2045 move to Confirmed.',
          children: 'Each patient hears back by the method they chose. Confirmed requests leave the queue.',
          header: 'Notifies patients',
          footer: 'Selected in the request queue.',
        },
      },
    ],
    render: (props) => <DialogPreview {...props} />,
  }),
  defineStory<GridProps>({
    id: 'grid',
    component: 'Grid',
    summary: 'columns alone is fixed, minColumnWidth alone fits as many as possible, both together cap the count.',
    imports: [layout('Grid')],
    snippetChildren: '{items}',
    controls: [
      { kind: 'select', prop: 'gap', options: spaceScale, defaultValue: 'medium', description: 'Gap between rows and columns.' },
      { kind: 'select', prop: 'rowGap', options: spaceScale, defaultValue: undefined, unsetLabel: 'uses gap', unsetKind: 'default', description: 'Overrides gap between rows.' },
      { kind: 'select', prop: 'columnGap', options: spaceScale, defaultValue: undefined, unsetLabel: 'uses gap', unsetKind: 'default', description: 'Overrides gap between columns.' },
      { kind: 'select', prop: 'columns', options: gridColumnCounts, defaultValue: undefined, unsetLabel: 'as many as fit', unsetKind: 'default', description: 'Fixed count, or the maximum when minColumnWidth is set.' },
      { kind: 'select', prop: 'minColumnWidth', options: columnWidthScale, defaultValue: undefined, unsetLabel: 'small when responsive, ignored when fixed', unsetKind: 'default', description: 'Narrowest column before wrapping.' },
      { kind: 'select', prop: 'align', options: gridAlignments, defaultValue: 'stretch', description: 'Block alignment within each row.' },
    ],
    presets: [
      { name: 'Fixed 3 columns', values: { columns: 3 } },
      { name: 'Responsive cards', values: { minColumnWidth: 'medium' } },
      { name: 'Capped at 4', values: { columns: 4, minColumnWidth: 'extraSmall' } },
      { name: 'Tight rows', values: { minColumnWidth: 'small', rowGap: 'extraSmall', columnGap: 'large' } },
    ],
    render: (props) => <Grid {...props}>{tiles()}</Grid>,
  }),
  defineStory<StackProps>({
    id: 'stack',
    component: 'Stack',
    summary: 'Vertical flow with one gap from the shared spacing vocabulary.',
    imports: [layout('Stack')],
    snippetChildren: '{items}',
    controls: [
      { kind: 'select', prop: 'gap', options: spaceScale, defaultValue: 'medium', description: 'Space between children.' },
      { kind: 'select', prop: 'align', options: stackAlignments, defaultValue: 'stretch', description: 'Inline alignment of children.' },
    ],
    presets: [
      { name: 'Form rhythm', values: { gap: 'large' } },
      { name: 'Centered', values: { align: 'center', gap: 'small' } },
    ],
    render: (props) => <Stack {...props}>{tiles(4)}</Stack>,
  }),
  defineStory<InlineProps>({
    id: 'inline',
    component: 'Inline',
    summary: 'Horizontal flow that wraps by default; narrow the preview to see wrapping.',
    imports: [layout('Inline')],
    snippetChildren: '{items}',
    controls: [
      { kind: 'select', prop: 'gap', options: spaceScale, defaultValue: 'small', description: 'Space between items and wrapped lines.' },
      { kind: 'select', prop: 'align', options: inlineAlignments, defaultValue: 'center', description: 'Block alignment.' },
      { kind: 'select', prop: 'justify', options: inlineJustifications, defaultValue: 'start', description: 'Inline distribution.' },
      { kind: 'switch', prop: 'wrap', defaultValue: true, description: 'Wrap when space runs out.' },
    ],
    presets: [
      { name: 'Toolbar', values: { justify: 'between' } },
      { name: 'No wrap', values: { wrap: false, gap: 'extraSmall' } },
    ],
    render: (props) => (
      <Inline {...props}>
        {toneScale.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
        <Button size="small">Action</Button>
      </Inline>
    ),
  }),
  defineStory<BoxProps>({
    id: 'box',
    component: 'Box',
    summary: 'Token-based padding, background, border and radius around any content.',
    imports: [layout('Box')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'Box content', description: 'Content.' },
      { kind: 'select', prop: 'padding', options: spaceScale, defaultValue: 'medium', description: 'Padding on every side.' },
      { kind: 'select', prop: 'background', options: surfaceScale, defaultValue: 'panel', unsetLabel: 'transparent', unsetKind: 'default', description: 'Surface role.' },
      { kind: 'select', prop: 'border', options: borderScale, defaultValue: 'subtle', description: 'Border strength.' },
      { kind: 'select', prop: 'radius', options: radiusScale, defaultValue: 'medium', description: 'Corner radius.' },
    ],
    presets: [
      { name: 'Callout', values: { background: 'accent', border: 'none', padding: 'large', radius: 'large' } },
      { name: 'Well', values: { background: 'sunken', border: 'none' } },
    ],
    render: (props) => <Box {...props} />,
  }),
  defineStory<TextProps>({
    id: 'text',
    component: 'Text',
    summary: 'The element is chosen for meaning; variant, tone and align control appearance.',
    imports: [primitives('Text')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'Tokens give every visual decision a name, so it can be reused and changed in one place.', description: 'Content.' },
      { kind: 'select', prop: 'as', options: textElements, defaultValue: 'p', description: 'Rendered element.' },
      { kind: 'select', prop: 'variant', options: textVariants, defaultValue: 'body', description: 'Typography style.' },
      { kind: 'select', prop: 'tone', options: textTones, defaultValue: 'default', description: 'Text color role.' },
      { kind: 'select', prop: 'align', options: textAlignments, defaultValue: 'start', description: 'Alignment; start and end follow writing direction.' },
    ],
    presets: [
      { name: 'Lead', values: { variant: 'lead', tone: 'muted' } },
      { name: 'Caption', values: { variant: 'caption', as: 'span', children: 'Foundations' } },
      { name: 'Error message', values: { tone: 'danger', variant: 'bodySmall', children: 'Enter a name.' } },
    ],
    render: (props) => <Text {...props} />,
  }),
  defineStory<HeadingProps>({
    id: 'heading',
    component: 'Heading',
    summary: 'level sets the outline; size sets the look. They are independent on purpose.',
    imports: [primitives('Heading')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'Component reference', description: 'Content.' },
      { kind: 'select', prop: 'level', options: headingLevels, defaultValue: 2, description: 'Outline level: h1 to h6.' },
      { kind: 'select', prop: 'size', options: headingSizes, defaultValue: undefined, unsetLabel: 'derived from level', unsetKind: 'default', description: 'Typography style.' },
      { kind: 'select', prop: 'tone', options: headingTones, defaultValue: 'default', description: 'Text color role.' },
      { kind: 'select', prop: 'align', options: headingAlignments, defaultValue: 'start', description: 'Alignment.' },
    ],
    presets: [
      { name: 'Display', values: { level: 1, size: 'display' } },
      { name: 'Small h2', values: { level: 2, size: 'small', tone: 'muted' } },
    ],
    render: (props) => <Heading {...props} />,
  }),
  defineStory<AlertProps>({
    id: 'alert',
    component: 'Alert',
    summary: 'Tone sets surface, border, icon and title color together; the title states the meaning.',
    imports: [composites('Alert'), primitives('Button')],
    controls: [
      { kind: 'select', prop: 'tone', options: alertTones, defaultValue: 'info', description: 'Status role.' },
      { kind: 'text', prop: 'title', defaultValue: 'Tokens regenerated', description: 'Short summary.' },
      { kind: 'text', prop: 'children', defaultValue: '293 tokens resolved for the light and dark themes.', description: 'Detail and guidance.' },
      { kind: 'text', prop: 'actions', defaultValue: '', description: 'Recovery action; here a button.', wrap: { render: (text) => <Button size="small">{text}</Button>, snippet: (text) => `<Button size="small">${text}</Button>` } },
    ],
    presets: [
      { name: 'Operation failed', values: { tone: 'danger', title: 'Could not load entries', children: 'The server responded with 503.', actions: 'Retry' } },
      { name: 'Warning', values: { tone: 'warning', title: 'Deprecated prop', children: 'variant was renamed to appearance.' } },
    ],
    render: (props) => <Alert {...props} />,
  }),
  defineStory<SkeletonProps>({
    id: 'skeleton',
    component: 'Skeleton',
    summary: 'Placeholder shapes from skeleton tokens; always hidden from assistive technology.',
    imports: [primitives('Skeleton')],
    controls: [
      { kind: 'select', prop: 'shape', options: skeletonShapes, defaultValue: 'text', description: 'Lines, a block or a circle.' },
      { kind: 'select', prop: 'lines', options: [1, 2, 3, 4, 5], defaultValue: 3, description: 'Line count for text.' },
      { kind: 'select', prop: 'size', options: skeletonSizes, defaultValue: 'medium', description: 'Block height or circle diameter.' },
    ],
    presets: [
      { name: 'Avatar', values: { shape: 'circle', size: 'small' } },
      { name: 'Image', values: { shape: 'block', size: 'large' } },
    ],
    render: (props) => <Skeleton {...props} />,
  }),
  defineStory<IconProps>({
    id: 'icon',
    component: 'Icon',
    summary: 'Decorative by default; a label makes it an image with an accessible name.',
    imports: [primitives('Icon')],
    controls: [
      { kind: 'select', prop: 'name', options: iconNames, defaultValue: 'star', description: 'Icon from the fixed set.' },
      { kind: 'select', prop: 'size', options: iconSizes, defaultValue: undefined, unsetLabel: '1em, follows text', unsetKind: 'default', description: 'Size token.' },
      { kind: 'text', prop: 'label', defaultValue: '', description: 'Accessible name. Leave empty for decorative icons.' },
    ],
    presets: [{ name: 'Meaningful', values: { name: 'warning', size: 'large', label: 'Warning' } }],
    render: (props) => <Icon {...props} />,
  }),
  defineStory<SwitchProps>({
    id: 'switch',
    component: 'Switch',
    summary: 'A native checkbox with role="switch"; toggle it in the preview.',
    imports: [primitives('Switch')],
    controls: [
      { kind: 'text', prop: 'label', defaultValue: 'Compact rows', description: 'Names the setting.' },
      { kind: 'text', prop: 'description', defaultValue: 'Shows more entries per screen.', description: 'Announced hint.' },
      { kind: 'switch', prop: 'disabled', defaultValue: false, description: 'Native disabled.' },
    ],
    presets: [{ name: 'Disabled', values: { disabled: true } }],
    render: (props) => <Switch {...props} />,
  }),
  defineStory<CheckboxProps>({
    id: 'checkbox',
    component: 'Checkbox',
    summary: 'A native checkbox with its label; toggle it in the preview.',
    imports: [primitives('Checkbox')],
    controls: [
      { kind: 'text', prop: 'label', defaultValue: 'Email me a weekly summary', description: 'Visible label.' },
      { kind: 'text', prop: 'description', defaultValue: '', description: 'Announced hint.' },
      { kind: 'switch', prop: 'disabled', defaultValue: false, description: 'Native disabled.' },
    ],
    presets: [{ name: 'With hint', values: { description: 'Sent every Monday morning.' } }],
    render: (props) => <Checkbox {...props} />,
  }),
  defineStory<InputProps>({
    id: 'input',
    component: 'Input',
    summary: 'A styled native input. Pair it with Field for a label; here aria-label stands in.',
    imports: [primitives('Input')],
    fixedAttributes: ['aria-label="Example input"'],
    controls: [
      { kind: 'select', prop: 'type', options: ['text', 'search', 'email', 'url', 'password'], defaultValue: 'text', description: 'Native input type.' },
      { kind: 'text', prop: 'placeholder', defaultValue: 'Search components', description: 'Example value, never a label.' },
      { kind: 'switch', prop: 'disabled', defaultValue: false, description: 'Native disabled.' },
      { kind: 'switch', prop: 'readOnly', defaultValue: false, description: 'Focusable but not editable.' },
    ],
    presets: [{ name: 'Search', values: { type: 'search', placeholder: 'Name or tag' } }],
    render: (props) => <Input aria-label="Example input" {...props} />,
  }),
  defineStory<ProgressProps>({
    id: 'progress',
    component: 'Progress',
    summary: 'A native progress element with a visible, associated label.',
    imports: [primitives('Progress')],
    controls: [
      { kind: 'text', prop: 'label', defaultValue: 'Tokens migrated', description: 'Label and accessible name.' },
      { kind: 'select', prop: 'value', options: [0, 25, 50, 75, 100], defaultValue: 50, description: 'Current value.' },
      { kind: 'text', prop: 'valueText', defaultValue: '', description: 'Visible value summary. Empty shows a percentage.' },
    ],
    presets: [{ name: 'Count', values: { value: 75, valueText: '18 of 24 components' } }],
    render: (props) => <Progress {...props} />,
  }),
  defineStory<EmptyStateProps>({
    id: 'empty-state',
    component: 'EmptyState',
    summary: 'Explains an empty region and offers a way forward.',
    imports: [composites('EmptyState'), primitives('Button')],
    controls: [
      { kind: 'text', prop: 'title', defaultValue: 'No pinned entries', description: 'What is missing.' },
      { kind: 'text', prop: 'description', defaultValue: 'Pin components you use often to find them here.', description: 'Why, and what to do.' },
      { kind: 'select', prop: 'headingLevel', options: [2, 3, 4], defaultValue: 2, description: 'Heading level for the outline.' },
      { kind: 'text', prop: 'action', defaultValue: 'Browse components', description: 'Next step; here a button.', wrap: { render: (text) => <Button appearance="primary">{text}</Button>, snippet: (text) => `<Button appearance="primary">${text}</Button>` } },
    ],
    presets: [{ name: 'No action', values: { action: '' } }],
    render: (props) => <EmptyState {...props} />,
  }),
  defineStory<DisclosureProps>({
    id: 'disclosure',
    component: 'Disclosure',
    summary: 'Native details and summary with the system target size, marker and surfaces.',
    imports: [composites('Disclosure')],
    controls: [
      { kind: 'text', prop: 'summary', defaultValue: 'Which tokens does it read?', description: 'Always-visible label.' },
      { kind: 'text', prop: 'children', defaultValue: 'button.primary.background → action.primary.background', description: 'Content shown while open.' },
      { kind: 'select', prop: 'appearance', options: disclosureAppearances, defaultValue: 'bordered', description: 'Standalone panel or flush row.' },
      { kind: 'switch', prop: 'defaultOpen', defaultValue: false, description: 'Initial state only.' },
      { kind: 'switch', prop: 'lazy', defaultValue: false, description: 'Render content only while open.' },
    ],
    presets: [{ name: 'Open, flush', values: { appearance: 'flush', defaultOpen: true } }],
    // defaultOpen is read once, so remount when it changes for the preview to follow the control.
    render: (props) => <Disclosure key={String(props.defaultOpen)} {...props} />,
  }),
  defineStory<LinkProps>({
    id: 'link',
    component: 'Link',
    summary: 'A real anchor. App paths route client-side through LinkProvider.',
    imports: [primitives('Link')],
    controls: [
      { kind: 'text', prop: 'children', defaultValue: 'Read the Button reference', description: 'Link text; describes the destination.' },
      { kind: 'text', prop: 'href', defaultValue: '/components/button', description: 'Destination.' },
      { kind: 'select', prop: 'variant', options: linkVariants, defaultValue: 'inline', description: 'Inline links are always underlined.' },
    ],
    presets: [{ name: 'Standalone', values: { variant: 'standalone', children: 'All components' } }],
    render: (props) => <Link {...props} href={props.href || '/components/button'} />,
  }),
];

export function findStory(id: string): AnyStory | undefined {
  return playgroundStories.find((story) => story.id === id);
}
