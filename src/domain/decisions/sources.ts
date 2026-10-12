/** Published sources the design-decision pages cite. Living documents carry no year. */
export const sources = [
  { id: 'inventory', short: 'Frost 2013', author: 'Brad Frost', title: 'Interface Inventory', year: 2013, href: 'https://bradfrost.com/blog/post/interface-inventory/' },
  { id: 'atomic', short: 'Frost 2016', author: 'Brad Frost', title: 'Atomic Design, chapter 4: The Atomic Workflow', year: 2016, href: 'https://atomicdesign.bradfrost.com/chapter-4/' },
  { id: 'tokens', short: 'Curtis 2016', author: 'Nathan Curtis', title: 'Tokens in Design Systems', year: 2016, href: 'https://medium.com/eightshapes-llc/tokens-in-design-systems-25dd82d58421' },
  { id: 'teams', short: 'Curtis 2015', author: 'Nathan Curtis', title: 'Team Models for Scaling a Design System', year: 2015, href: 'https://medium.com/eightshapes-llc/team-models-for-scaling-a-design-system-2cf9d03be6a0' },
  { id: 'dtcg', short: 'DTCG 2025', author: 'Design Tokens Community Group (W3C)', title: 'Design Tokens Format Module, first stable version 2025.10', year: 2025, href: 'https://www.designtokens.org/' },
  { id: 'criteria', short: 'GOV.UK criteria', author: 'GOV.UK Design System', title: 'Contribution criteria', year: null, href: 'https://design-system.service.gov.uk/community/contribution-criteria/' },
  { id: 'lifecycle', short: 'GOV.UK lifecycle', author: 'GOV.UK Design System', title: 'Component lifecycle statuses', year: null, href: 'https://design-system.service.gov.uk/community/component-lifecycle-statuses/' },
  { id: 'wcag', short: 'WCAG 2.2', author: 'W3C', title: 'Web Content Accessibility Guidelines (WCAG) 2.2', year: 2023, href: 'https://www.w3.org/TR/WCAG22/' },
  { id: 'apg', short: 'ARIA APG', author: 'W3C Web Accessibility Initiative', title: 'ARIA Authoring Practices Guide', year: null, href: 'https://www.w3.org/WAI/ARIA/apg/' },
  { id: 'semver', short: 'SemVer', author: 'Tom Preston-Werner', title: 'Semantic Versioning 2.0.0', year: null, href: 'https://semver.org/' },
  { id: 'custom-elements', short: 'HTML Standard', author: 'WHATWG', title: 'HTML Standard: Custom elements', year: null, href: 'https://html.spec.whatwg.org/multipage/custom-elements.html' },
  { id: 'declarative-shadow-dom', short: 'HTML template', author: 'WHATWG', title: 'HTML Standard: The template element and declarative shadow roots', year: null, href: 'https://html.spec.whatwg.org/multipage/scripting.html#the-template-element' },
  { id: 'react-custom-elements', short: 'React DOM', author: 'React', title: 'React DOM components: Custom HTML elements', year: null, href: 'https://react.dev/reference/react-dom/components#custom-html-elements' },
  { id: 'vue-custom-elements', short: 'Vue', author: 'Vue.js', title: 'Vue and Web Components', year: null, href: 'https://vuejs.org/guide/extras/web-components.html' },
  { id: 'angular-custom-elements-schema', short: 'Angular schema', author: 'Angular', title: 'CUSTOM_ELEMENTS_SCHEMA', year: null, href: 'https://angular.dev/api/core/CUSTOM_ELEMENTS_SCHEMA' },
  { id: 'angular-control-value-accessor', short: 'Angular forms', author: 'Angular', title: 'ControlValueAccessor', year: null, href: 'https://angular.dev/api/forms/ControlValueAccessor' },
] as const;

export type SourceId = (typeof sources)[number]['id'];
