import type { ComponentType, ReactNode } from 'react';
import type { TokenPath } from '@/design-system/tokens';

export interface PropDoc {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description: string;
}

type PropEntry = Omit<PropDoc, 'name'>;

/**
 * Builds a props table from one entry per own prop. Typed against the component's
 * own-props interface, so adding, renaming or removing a prop without updating the
 * docs is a compile error.
 */
export function propsTable<Props extends object>(entries: { [Key in keyof Required<Props>]: PropEntry }): PropDoc[] {
  return Object.entries(entries).map(([name, entry]) => ({ name, ...(entry as PropEntry) }));
}

/** One step from a prop value to the token that styles it. */
export interface PropTokenTrace {
  /** The prop as written in JSX, such as `appearance="primary"`. */
  prop: string;
  /** The CSS property it sets. */
  property: string;
  /** The first token the CSS reads. Its alias chain is shown from the manifest. */
  token: TokenPath;
  /** Catalog id of the component that reads the token, when this component passes the prop down to it. */
  readBy?: string;
}

export interface ComponentDoc {
  /** Catalog id. Name, layer and summary come from the catalog entry. */
  id: string;
  purpose: string;
  whenToUse: string[];
  whenNotToUse: string[];
  props: PropDoc[];
  /** What happens to attributes not listed in `props`. */
  nativeProps: string;
  /** Defaults, valid combinations and which prop wins when two affect the same style. */
  precedence: string[];
  propTokens: PropTokenTrace[];
  composition: ReactNode[];
  states: string[];
  accessibility: string[];
  responsive: string[];
  /** Specific behavior that is unverified or undecided, beyond the site-wide limits stated on the Components index. */
  knownGaps?: ReactNode[];
  mistakes: string[];
  tradeoffs: string[];
  /** Implementation files, shown as source. */
  sourcePaths: string[];
  /** Renders the live examples. */
  Example: ComponentType;
}
