// Hypothetical: Harbor's old button API, kept working on the shared Button while call sites move over.
import { Button, type ButtonProps } from '@/design-system/primitives';

type Kind = 'primary' | 'default' | 'link';

export interface HbButtonProps extends Omit<ButtonProps, 'appearance' | 'size' | 'loading'> {
  kind?: Kind;
  small?: boolean;
  /** The old name for an operation in progress. It used to set `disabled`. */
  busy?: boolean;
}

const appearanceFor = { primary: 'primary', default: 'secondary', link: 'ghost' } as const satisfies Record<Kind, ButtonProps['appearance']>;

/** Deprecated: use Button. Delete this file when no call site imports it (MIG-12). */
export function HbButton({ kind = 'default', small = false, busy = false, type = 'submit', ...rest }: HbButtonProps) {
  // The old button set no type, so inside a form it submitted. Keep that until each call site says what it means.
  return <Button appearance={appearanceFor[kind]} size={small ? 'small' : 'medium'} loading={busy} type={type} {...rest} />;
}
