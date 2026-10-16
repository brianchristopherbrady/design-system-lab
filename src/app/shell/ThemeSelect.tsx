import { useId } from 'react';
import { Select } from '@/design-system/primitives';
import { useTheme, type ThemePreference } from '../providers/ThemeProvider';
import styles from './AppShell.module.css';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** The site's only appearance setting. Products and densities are scoped to the examples that show them. */
export function ThemeSelect() {
  const { preference, setPreference } = useTheme();
  const id = useId();
  return (
    <div className={styles.themeSelect}>
      <label htmlFor={id} className={styles.themeLabel}>
        Theme
      </label>
      <Select id={id} className={styles.themeControl} value={preference} onChange={(event) => setPreference(event.target.value as ThemePreference)}>
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
