import type { DensityName, ProductName } from '@/design-system/tokens';

export interface ProductProfile {
  id: ProductName;
  name: string;
  /** Who the product serves; explains why its brand, typefaces and shape differ. */
  audience: string;
  /** What the product context overrides. Everything else is inherited from the system. */
  overrides: string;
}

/** The products themed from this one system. Ids are the product modifier's contexts. */
export const productProfiles: Record<ProductName, ProductProfile> = {
  'system-lab': {
    id: 'system-lab',
    name: 'Design System Lab',
    audience: 'The design system itself and its documentation.',
    overrides: 'Nothing: the base mappings.',
  },
  patient: {
    id: 'patient',
    name: 'Patient app',
    audience: 'Patients requesting an appointment, mostly on phones, a few times a year.',
    overrides: 'The shared care brand roles and IBM Plex Sans; the system’s own corner shapes.',
  },
  provider: {
    id: 'provider',
    name: 'Provider workspace',
    audience: 'Providers reviewing appointment requests at a desk throughout the working day.',
    overrides: 'The shared care brand roles and IBM Plex Sans, with tighter corners on controls, badges, cards and dialogs to suit compact rows.',
  },
};

export const densityLabels: Record<DensityName, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
};
