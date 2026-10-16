import { useId, type ReactNode } from 'react';
import { modifierDefaults, themeNames, tokenValueIn, type TokenPath } from '@/design-system/tokens';
import { tokenManifest } from '@/design-system/tokens/manifest';
import { ScrollRegion, useThemeScope } from '@/design-system/layout';
import { densityLabels, productProfiles } from '@/domain/system';
import { TokenSwatch } from '@/features/docs';
import styles from './foundations.module.css';

const byPath = new Map(tokenManifest.map((record) => [record.path, record]));

export function tokenRecord(path: string) {
  return byPath.get(path);
}

export interface TokenTableProps {
  caption: string;
  paths: readonly TokenPath[];
  /** Renders a live sample that uses the token through its CSS variable. */
  preview?: (cssVar: string, path: TokenPath) => ReactNode;
}

/**
 * Tokens with their authored and resolved values, read from the generated manifest for the product and
 * density in effect, which the caption names inside a scope other than the site's own. Light and Dark
 * columns appear only when a token in the table varies by theme.
 */
export function TokenTable({ caption, paths, preview }: TokenTableProps) {
  const captionId = useId();
  const scope = useThemeScope();
  const records = paths.flatMap((path) => byPath.get(path) ?? []);
  const themes = records.some((record) => record.dependsOn.includes('theme')) ? themeNames : null;
  const scoped = scope.product !== modifierDefaults.product || scope.density !== modifierDefaults.density;
  const contextual = scoped && records.some((record) => record.dependsOn.some((name) => name !== 'theme'));
  return (
    <ScrollRegion aria-labelledby={captionId}>
      <table className={styles.table}>
        <caption id={captionId} className={styles.caption}>
          {caption}
          {contextual && `, for ${productProfiles[scope.product].name} at ${densityLabels[scope.density].toLowerCase()} density`}
        </caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            {themes ? (
              themes.map((theme) => (
                <th key={theme} scope="col">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </th>
              ))
            ) : (
              <th scope="col">Value</th>
            )}
            {preview && <th scope="col">Sample</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.path}>
              <th scope="row">
                <code>{record.path}</code>
                <br />
                <code className={styles.muted}>{record.cssVar}</code>
              </th>
              {(themes ?? [scope.theme]).map((theme) => {
                const value = tokenValueIn(record, { ...scope, theme });
                return (
                  <td key={theme}>
                    <span className={styles.value}>
                      <TokenSwatch type={record.type} value={value.resolved} />
                      <code>{value.authored}</code>
                    </span>
                  </td>
                );
              })}
              {preview && <td>{preview(`var(${record.cssVar})`, record.path as TokenPath)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}
