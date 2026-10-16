import type { ReactElement, ReactNode } from 'react';
import type { IconName } from '@/design-system/primitives';
import type { DensityName, ProductName } from '@/design-system/tokens';

type Keys<P> = Extract<keyof P, string>;

interface BaseControl<K extends string> {
  /** The public prop this control sets. */
  prop: K;
  description: string;
}

/**
 * What an unset prop falls back to: a component token, the surrounding scope, or behavior the
 * component defines itself (such as "derived from level").
 */
export type UnsetKind = 'token' | 'inherit' | 'default';

/**
 * Offer an option that omits the prop, and say what applies instead. Props without one have no
 * unset value in the Playground.
 */
type Unset = { unsetLabel?: undefined; unsetKind?: undefined } | { unsetLabel: string; unsetKind: UnsetKind };

/** Enumerated prop. Options should be the component's exported option array. */
export type SelectControl<K extends string, V extends string | number = string | number> = BaseControl<K> &
  Unset & {
    kind: 'select';
    options: readonly V[];
    /** Initial value. `undefined` means the prop starts unset. */
    defaultValue: V | undefined;
  };

export interface SwitchControl<K extends string> extends BaseControl<K> {
  kind: 'switch';
  defaultValue: boolean;
}

/** Content prop. `wrap` turns the text into the element the prop expects, in preview and snippet alike. */
export interface TextControl<K extends string> extends BaseControl<K> {
  kind: 'text';
  defaultValue: string;
  wrap?: { render: (text: string) => ReactNode; snippet: (text: string) => string };
}

/** A ReactNode slot filled with an Icon, or left empty. */
export interface IconControl<K extends string> extends BaseControl<K> {
  kind: 'icon';
  defaultValue: IconName | undefined;
}

type ControlFor<P, K extends Keys<P>> =
  | (NonNullable<P[K]> extends string | number ? SelectControl<K, NonNullable<P[K]>> : never)
  | (NonNullable<P[K]> extends boolean ? SwitchControl<K> : never)
  | (string extends NonNullable<P[K]> ? TextControl<K> : never)
  | (ReactElement extends NonNullable<P[K]> ? IconControl<K> : never);

/**
 * A control for one prop of `P`. The prop name must exist on the component's props type and
 * the control kind must fit the prop's type, so a control cannot exercise a prop that is not there.
 */
export type ControlSpec<P> = { [K in Keys<P>]-?: ControlFor<P, K> }[Keys<P>];

export type ControlValue = string | number | boolean | undefined;
export type ControlValues = Record<string, ControlValue>;

/** Documented facts about one prop, from the component reference. */
export interface PropApi {
  name: string;
  type: string;
  /** The component's own default, as documented. */
  defaultValue?: string;
}

/** The product profile and density a product example is shown in. */
export interface PresetScope {
  product: ProductName;
  density: DensityName;
}

export interface Preset<P> {
  name: string;
  values: Partial<Record<Keys<P>, ControlValue>>;
  /** Makes the preset a product example: the preview takes this scope, and the selector lists it apart. */
  scope?: PresetScope;
}

export interface PlaygroundStory<P> {
  /** Matches the catalog id, so docs and playground link to each other. */
  id: string;
  /** Component name as written in JSX. */
  component: string;
  summary: string;
  imports: readonly string[];
  controls: readonly ControlSpec<P>[];
  presets: readonly Preset<P>[];
  /** Renders the live component from props built out of the control values. */
  render: (props: P) => ReactNode;
  /** Lines before the JSX in the snippet, such as a useState call. */
  setup?: readonly string[];
  /** Attributes that are not controlled but always present, written as JSX. */
  fixedAttributes?: readonly string[];
  /** Snippet children when no control sets `children`. */
  snippetChildren?: string;
  /** Note under the preview, for stories whose preview needs explaining. */
  previewNote?: string;
  /** The component's unset theme, product and density inherit from the scope around it; show where each comes from. */
  inheritsScope?: boolean;
}

type AnyControl =
  | SelectControl<string>
  | SwitchControl<string>
  | TextControl<string>
  | IconControl<string>;

/** A story with its props type erased, so stories for different components share one list. */
export interface AnyStory extends Omit<PlaygroundStory<Record<string, unknown>>, 'controls' | 'presets' | 'render'> {
  controls: readonly AnyControl[];
  presets: readonly { name: string; values: ControlValues; scope?: PresetScope }[];
  render: (props: Record<string, unknown>) => ReactNode;
}

/** Type-checks a story against its component's props, then erases the type for the story list. */
export function defineStory<P>(story: PlaygroundStory<P>): AnyStory {
  return story as unknown as AnyStory;
}

export type { AnyControl };
