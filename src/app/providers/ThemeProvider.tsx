import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ThemeScopeProvider } from '@/design-system/layout';
import { modifierDefaults, type ModifierInput, type ThemeName } from '@/design-system/tokens';

export type ThemePreference = 'system' | ThemeName;

const themeKey = 'system-lab:theme';
/** Saved when the header also chose a product and density; removed so an old choice cannot restyle the site. */
const retiredKeys = ['system-lab:product', 'system-lab:density'] as const;

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(themeKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function writePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') window.localStorage.removeItem(themeKey);
    else window.localStorage.setItem(themeKey, preference);
  } catch {
    // Storage unavailable: the choice still applies for this visit.
  }
}

function forgetRetiredSettings() {
  try {
    for (const key of retiredKeys) window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}

const darkQuery = '(prefers-color-scheme: dark)';
function subscribeToScheme(onChange: () => void) {
  const query = window.matchMedia?.(darkQuery);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}
const systemTheme = (): ThemeName => (window.matchMedia?.(darkQuery).matches ? 'dark' : 'light');

interface ThemeValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** The site always uses its own product profile and documentation density; examples scope their own. */
const { product, density } = modifierDefaults;

/**
 * The site's theme preference, resolving "system" through prefers-color-scheme. Writes all three
 * modifier attributes on `<html>` (the generated CSS needs every modifier present on a scope) and
 * publishes them to ThemeScope so nested scopes can inherit.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const system = useSyncExternalStore(subscribeToScheme, systemTheme, () => modifierDefaults.theme);
  const theme = preference === 'system' ? system : preference;

  useEffect(forgetRetiredSettings, []);

  // Layout effect: apply before the browser paints, so the page never flashes another theme.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.product = product;
    root.dataset.density = density;
    writePreference(preference);
  }, [theme, preference]);

  const resolved = useMemo<ModifierInput>(() => ({ theme, product, density }), [theme]);
  const value = useMemo(() => ({ preference, setPreference }), [preference]);
  return (
    <ThemeContext value={value}>
      <ThemeScopeProvider value={resolved}>{children}</ThemeScopeProvider>
    </ThemeContext>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return value;
}
