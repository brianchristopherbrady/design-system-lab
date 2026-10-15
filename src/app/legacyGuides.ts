/**
 * Where links to the retired Wiki/Guides section now lead. Articles that only repeated the
 * reference sections point at those sections; strategy articles point at Design decisions.
 */
export const legacyGuideTargets: Readonly<Record<string, string>> = {
  start: '/decisions/planning',
  plan: '/decisions/planning',
  principles: '/decisions/planning#principles',
  'design-language': '/foundations',
  'design-tokens': '/foundations/tokens',
  primitives: '/components',
  composites: '/components',
  patterns: '/patterns',
  documentation: '/#site',
  governance: '/decisions/operating#ownership',
  migration: '/decisions/adoption',
  measure: '/decisions/operating#measures',
  sharing: '/decisions/sharing',
  frameworks: '/decisions/implementation',
};

export const legacyGuideTarget = (id: string | undefined) => (id && legacyGuideTargets[id]) || '/decisions';
