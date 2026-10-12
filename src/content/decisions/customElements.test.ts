import { render } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

/** A minimal element with a `checked` property, standing in for the switch sketch (jsdom has no form-associated custom elements). */
class Probe extends HTMLElement {
  #checked = false;
  get checked() {
    return this.#checked;
  }
  set checked(value: boolean) {
    this.#checked = value;
  }
}
customElements.define('x-probe', Probe);

describe('React 19 and custom elements, as the implementation page describes them', () => {
  it('sets a prop as a property when the element defines one', () => {
    const { container } = render(createElement('x-probe', { checked: true, name: 'updates' }));
    const element = container.querySelector('x-probe') as Probe;
    expect(element.checked).toBe(true);
    expect(element.hasAttribute('checked')).toBe(false);
    expect(element.getAttribute('name')).toBe('updates');
  });

  it('falls back to attributes before the element is defined, turning objects into strings', () => {
    const { container } = render(createElement('x-not-defined', { checked: true, hidden: false, label: 'Updates', options: { a: 1 } }));
    const element = container.querySelector('x-not-defined') as HTMLElement & { options?: unknown };
    expect(element.getAttribute('checked')).toBe('');
    expect(element.hasAttribute('hidden')).toBe(false);
    expect(element.getAttribute('label')).toBe('Updates');
    expect(element.getAttribute('options')).toBe('[object Object]');
    expect(element.options).toBeUndefined();
  });

  it('listens with on plus the exact event name, and runs onChange only for a bubbling change', () => {
    const exact = vi.fn();
    const react = vi.fn();
    const custom = vi.fn();
    const { container } = render(createElement('x-probe', { onchange: exact, onChange: react, 'onsay-hi': custom }));
    const element = container.querySelector('x-probe') as Probe;

    element.dispatchEvent(new Event('change', { bubbles: true }));
    expect([exact.mock.calls.length, react.mock.calls.length]).toEqual([1, 1]);

    element.dispatchEvent(new Event('change'));
    expect([exact.mock.calls.length, react.mock.calls.length]).toEqual([2, 1]);

    element.dispatchEvent(new CustomEvent('say-hi'));
    expect(custom).toHaveBeenCalledTimes(1);
  });

  it('renders strings, numbers and true as attributes on the server, and omits false, objects and functions', () => {
    const html = renderToString(createElement('x-probe', { checked: true, hidden: false, name: 'updates', count: 3, options: { a: 1 }, onchange: () => undefined }));
    expect(html).toBe('<x-probe checked="" name="updates" count="3"></x-probe>');
  });
});
