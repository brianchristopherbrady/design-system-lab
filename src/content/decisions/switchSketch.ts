/**
 * The conceptual custom element on the implementation page. Plain JavaScript and HTML, so the
 * browser test in e2e/switch-sketch.spec.ts runs exactly what the page shows.
 */
export const switchElement = `// Conceptual sketch, not shipped: a form-associated switch.
class DsSwitch extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['checked'];

  #internals = this.attachInternals();
  #checked = false;
  // As with a native checkbox, the checked attribute is the default
  // and stops driving the state once the state has been changed.
  #dirty = false;

  constructor() {
    super();
    this.#internals.role = 'switch';
    this.#internals.ariaChecked = 'false';
    // Added once, on the element itself: moving it cannot add duplicates.
    this.addEventListener('click', () => this.#toggle());
    this.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.#toggle();
      }
    });
  }

  connectedCallback() {
    // A constructor may not add attributes, so focusability is set here.
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  attributeChangedCallback() {
    if (!this.#dirty) this.#update(this.hasAttribute('checked'));
  }

  get checked() {
    return this.#checked;
  }

  set checked(value) {
    this.#dirty = true;
    this.#update(Boolean(value));
  }

  get defaultChecked() {
    return this.hasAttribute('checked');
  }

  set defaultChecked(value) {
    this.toggleAttribute('checked', Boolean(value));
  }

  formResetCallback() {
    this.#dirty = false;
    this.#update(this.defaultChecked);
  }

  formStateRestoreCallback(state) {
    this.checked = state === 'checked';
  }

  #toggle() {
    if (this.matches(':disabled')) return;
    this.checked = !this.#checked;
    this.dispatchEvent(new Event('input', { bubbles: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #update(checked) {
    this.#checked = checked;
    this.#internals.setFormValue(checked ? 'on' : null, checked ? 'checked' : 'unchecked');
    this.#internals.ariaChecked = String(checked);
  }
}

customElements.define('ds-switch', DsSwitch);`;

export const switchUsage = `<form>
  <label for="updates">Email me updates</label>
  <ds-switch id="updates" name="updates" checked></ds-switch>
  <button type="reset">Reset</button>
</form>`;

export const switchInReact = `// React 19, directly: no wrapper component.
<label htmlFor="updates">Email me updates</label>
<ds-switch
  id="updates"
  name="updates"
  checked={enabled}
  onchange={(event) => setEnabled((event.target as DsSwitchElement).checked)}
/>`;

export const switchTypes = `// Optional: declarations so TypeScript checks the JSX above.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface DsSwitchElement extends HTMLElement {
  checked: boolean;
  defaultChecked: boolean;
}

interface DsSwitchProps
  extends DetailedHTMLProps<HTMLAttributes<DsSwitchElement>, DsSwitchElement> {
  name?: string;
  checked?: boolean;
  onchange?: (event: Event) => void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ds-switch': DsSwitchProps;
    }
  }
}`;
