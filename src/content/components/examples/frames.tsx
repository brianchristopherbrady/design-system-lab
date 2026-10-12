import type { ReactNode } from 'react';
import styles from './examples.module.css';

/** Renders the same content in a narrow and a full-width container, labelled. */
export function NarrowAndWide({
  children,
  narrowLabel = 'Narrow container (18rem)',
}: {
  /** Pass a function when the content needs a unique name per copy, such as a named region. */
  children: ReactNode | ((frame: 'narrow' | 'wide') => ReactNode);
  narrowLabel?: string;
}) {
  const render = (frame: 'narrow' | 'wide') => (typeof children === 'function' ? children(frame) : children);
  return (
    <div className={styles.frames}>
      <div className={styles.frame}>
        <span className={styles.frameLabel}>{narrowLabel}</span>
        <div className={`${styles.frameBody} ${styles.narrow}`}>{render('narrow')}</div>
      </div>
      <div className={styles.frame}>
        <span className={styles.frameLabel}>Full width</span>
        <div className={`${styles.frameBody} ${styles.wide}`}>{render('wide')}</div>
      </div>
    </div>
  );
}

/** A labelled frame for one case in a comparison. */
export function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <span className={styles.frameLabel}>{label}</span>
      <div className={styles.frameBody}>{children}</div>
    </div>
  );
}
