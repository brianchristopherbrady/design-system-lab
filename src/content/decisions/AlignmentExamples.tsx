import { ScrollRegion } from '@/design-system/layout';
import { badgeAppearances, badgeDefaults, badgeSizes } from '@/design-system/primitives';
import { radiusScale, toneScale } from '@/design-system/tokens';
import styles from './decisions.module.css';

export interface PropertyMapping {
  /** The property as a hypothetical design-tool library names it today. */
  designProperty: string;
  /** Its values in that library, each paired with the code value it should become. Empty for slots and text. */
  designValues: Readonly<Record<string, string>>;
  prop: string;
  /** The values the component accepts, read from its exported option arrays. */
  codeValues: readonly string[];
  codeDefault: string;
  /** Whether the design property should offer every code value. */
  complete: boolean;
  action: string;
}

/** Badge's design-tool properties (invented) beside its real props, values and defaults. */
export const badgeMapping: readonly PropertyMapping[] = [
  {
    designProperty: 'Tone',
    designValues: { Neutral: 'neutral', Brand: 'brand', Success: 'success', Warning: 'warning', Error: 'danger', Info: 'info' },
    prop: 'tone',
    codeValues: toneScale,
    codeDefault: badgeDefaults.tone,
    complete: true,
    action: 'Rename the property to tone and each value to the code value.',
  },
  {
    designProperty: 'Style',
    designValues: { Solid: 'filled', Light: 'subtle', Outline: 'outlined' },
    prop: 'appearance',
    codeValues: badgeAppearances,
    codeDefault: badgeDefaults.appearance,
    complete: true,
    action: 'Rename the property to appearance and each value to the code value.',
  },
  {
    designProperty: 'Size',
    designValues: { S: 'small', M: 'medium', L: 'large' },
    prop: 'size',
    codeValues: badgeSizes,
    codeDefault: badgeDefaults.size,
    complete: true,
    action: 'Use the full size names.',
  },
  {
    designProperty: 'Corner',
    designValues: { Rounded: 'medium', Pill: 'full' },
    prop: 'radius',
    codeValues: radiusScale,
    codeDefault: 'unset: the badge.radius token',
    complete: false,
    action: 'Remove the variant. Each product’s shape sets the corner through badge.radius; the prop is an exception for single uses.',
  },
  {
    designProperty: 'Has icon, Icon',
    designValues: {},
    prop: 'icon',
    codeValues: ['any Icon'],
    codeDefault: 'none',
    complete: false,
    action: 'Replace the boolean and the instance swap with one optional icon slot.',
  },
  {
    designProperty: 'Label',
    designValues: {},
    prop: 'children',
    codeValues: ['text'],
    codeDefault: 'none',
    complete: false,
    action: 'Keep the readable name, and record that it maps to children.',
  },
];

/** Differences a reviewer would raise, computed from the names and value pairs above. */
export function differences(mapping: PropertyMapping): string[] {
  const name = mapping.designProperty === mapping.prop ? [] : [`property ${mapping.designProperty} → ${mapping.prop}`];
  const renamed = Object.entries(mapping.designValues)
    .filter(([design, code]) => design !== code)
    .map(([design, code]) => `${design} → ${code}`);
  const covered = new Set(Object.values(mapping.designValues));
  const missing = mapping.complete ? mapping.codeValues.filter((value) => !covered.has(value)).map((value) => `no ${value}`) : [];
  return [...name, ...renamed, ...missing];
}

export function BadgeMapping() {
  return (
    <ScrollRegion axis="inline" aria-label="Badge: design-tool properties and props in code">
      <table className={styles.table} data-wide>
        <caption>Badge: design-tool properties and props in code</caption>
        <thead>
          <tr>
            <th scope="col">Design-tool property (hypothetical)</th>
            <th scope="col">Prop in code</th>
            <th scope="col">Values in code</th>
            <th scope="col">Default</th>
            <th scope="col">Differences</th>
            <th scope="col">To align</th>
          </tr>
        </thead>
        <tbody>
          {badgeMapping.map((mapping) => (
            <tr key={mapping.prop}>
              <th scope="row">{mapping.designProperty}</th>
              <td>
                <code>{mapping.prop}</code>
              </td>
              <td>{mapping.codeValues.join(', ')}</td>
              <td>{mapping.codeDefault}</td>
              <td>{differences(mapping).join('; ')}</td>
              <td>{mapping.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}
