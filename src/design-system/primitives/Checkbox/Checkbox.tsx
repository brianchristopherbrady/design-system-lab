import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxOwnProps {
  /** Visible label. Clicking it toggles the box. */
  label: ReactNode;
  /** Hint announced with the checkbox. */
  description?: ReactNode;
}

export type CheckboxProps = CheckboxOwnProps & Omit<ComponentPropsWithRef<'input'>, keyof CheckboxOwnProps | 'type'>;

/** A native checkbox with its label. For an immediate on/off setting, use Switch. */
export function Checkbox({ label, description, required, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  return (
    <div className={[styles.checkbox, className].filter(Boolean).join(' ')}>
      <input id={inputId} type="checkbox" className={styles.input}       aria-describedby={descriptionId} required={required} {...rest} />
      <label htmlFor={inputId} className={styles.label}>
        {label}
              {required && (
                <span className={styles.required} aria-hidden="true">
                  {' '}
                  (required)
                </span>
              )}
            </label>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
    </div>
  );
}
