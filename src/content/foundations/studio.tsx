import { Stack } from '@/design-system/layout';
import { Link } from '@/design-system/primitives';
import { DocSection, Note, Prose, SourceList } from '@/features/docs';
import {
  ContrastPanel,
  ExportPanel,
  RampChart,
  RampStrip,
  RoleMap,
  StudioControls,
  StudioPreview,
  StudioReadouts,
  VisionPanel,
  useThemeStudio,
} from '@/features/theming';

function StudioContent() {
  const studio = useThemeStudio();
  return (
    <Stack gap="extraExtraLarge">
      <DocSection id="studio" title="Generate a product theme">
        <Prose>
          <p>
            Start from a preset, or choose a brand color, an id and a shape. The studio builds a 12-step OKLCH ramp, gives
            each brand role the first step that passes WCAG 2 against this system’s real surfaces, checks the result against
            the status colors and simulated color vision, and writes every source file a new product needs. The live result
            under the controls changes as you do; the sections below show the detail. Choices are kept in the address, so a
            theme can be bookmarked or sent for review.
          </p>
        </Prose>
        <StudioControls studio={studio} />
        <StudioReadouts studio={studio} />
      </DocSection>

      <DocSection id="ramp" title="Ramp and roles">
        <Prose>
          <p>
            Every step has a fixed OKLCH lightness, so the ramp looks evenly spaced whatever the hue. Chroma follows the
            brand color and is reduced only where sRGB cannot show it, which keeps hue and lightness exact.
          </p>
        </Prose>
        <RampChart studio={studio} />
        <RampStrip studio={studio} label={`${studio.name} ramp, 12 steps`} />
        <RoleMap studio={studio} />
      </DocSection>

      <DocSection id="preview" title="Live preview">
        <Prose>
          <p>
            Real components in real theme scopes. Only the brand roles and corner radii change; surfaces, text and status
            colors come from the system. The last row shows the primary button’s rest, hover, pressed and focus colors,
            which an interactive preview can only show one at a time.
          </p>
        </Prose>
        <StudioPreview studio={studio} />
      </DocSection>

      <DocSection id="contrast" title="Contrast">
        <ContrastPanel studio={studio} />
        <Note title="How roles are chosen">
          <p>
            Each role tries ramp steps in a fixed order of preference and takes the first that passes against the theme’s
            canvas, panel and sunken surfaces. A bright yellow brand therefore gets a darker strong step than a violet one.
            APCA Lc is shown for information: it is the WCAG 3 draft method and not a WCAG 2 requirement.
          </p>
        </Note>
      </DocSection>

      <DocSection id="vision" title="Status colors and color vision">
        <Prose>
          <p>
            A brand that resembles danger makes every primary action look destructive, and one that resembles success
            blurs confirmation. The studio measures the distance between the brand’s strong fill and each status fill in
            OKLab, with typical vision and with simulated protanopia, deuteranopia and tritanopia.
          </p>
        </Prose>
        <VisionPanel studio={studio} />
      </DocSection>

      <DocSection id="export" title="Token files">
        <ExportPanel studio={studio} />
        <Note title="Shipping the product">
          <p>
            Add the pieces, then run <code>npm run tokens</code> and <code>npm test</code>. The pipeline generates the
            product’s CSS, types and manifest, and the contrast suite covers it in both themes without a test change. The
            full sequence is in <Link href="/foundations/products#adding">Adding a product</Link>.
          </p>
        </Note>
      </DocSection>

      <DocSection id="method" title="Method and limits">
        <Prose>
          <ul>
            <li>Lightness is fixed per step in OKLCH; chroma is reduced only as far as sRGB requires, keeping hue and lightness.</li>
            <li>Roles are chosen by contrast, not by step number, and every choice is listed with its checks.</li>
            <li>WCAG 2 ratios decide pass or fail. APCA Lc values are shown for comparison and treat polarity differently.</li>
            <li>
              Color-vision simulation uses the Machado, Oliveira and Fernandes (2009) model at full severity. It is an
              approximation; perception varies between people, and anomalous trichromacy is milder.
            </li>
            <li>
              The status distance threshold of 0.1 ΔEOK is a review heuristic, not a standard. In this system status is
              never conveyed by color alone, so a close pair is a design warning rather than a WCAG failure.
            </li>
            <li>
              The preview re-points one existing product’s brand roles and radii inline on a ThemeScope, and keeps the
              system’s typefaces, which a generated product inherits. To give a product its own typefaces, set{' '}
              <code>typeface.display</code> and <code>typeface.text</code> in its product file. Shipping still goes
              through the token files and the pipeline.
            </li>
          </ul>
        </Prose>
        <SourceList
          sources={[
            { path: 'src/features/theming/color.ts', note: 'OKLCH, gamut ceiling, ΔEOK, WCAG, APCA and color-vision simulation' },
            { path: 'src/features/theming/brand.ts', note: 'Ramp, contrast-driven roles, shapes, status checks and export' },
            { path: 'src/features/theming/useThemeStudio.ts', note: 'Studio state, URL persistence and derived results' },
          ]}
        />
      </DocSection>
    </Stack>
  );
}

export const studioTopic = {
  id: 'theme-studio',
  sections: [
    { id: 'studio', label: 'Generate' },
    { id: 'ramp', label: 'Ramp and roles' },
    { id: 'preview', label: 'Live preview' },
    { id: 'contrast', label: 'Contrast' },
    { id: 'vision', label: 'Color vision' },
    { id: 'export', label: 'Token files' },
    { id: 'method', label: 'Method and limits' },
  ],
  Content: StudioContent,
} as const;
