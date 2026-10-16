import type { DensityName, ProductName, Tone } from '@/design-system/tokens';

/**
 * One fictional healthcare organization with two products. They are examples of how one system
 * serves different tasks, shown in scoped demonstrations, never identities of this site.
 */
export const productExampleIds = ['patient', 'provider'] as const;
export type ProductExampleId = (typeof productExampleIds)[number];

export interface ProductExample {
  id: ProductExampleId;
  name: string;
  /** The task the example demonstrates, in one sentence. */
  task: string;
  /** Mobile-first or desktop-oriented: a scenario constraint, not a research finding. */
  setting: string;
  /** The appearance profile its examples are shown in. */
  profile: ProductName;
  density: DensityName;
}

export const productExamples: Record<ProductExampleId, ProductExample> = {
  patient: {
    id: 'patient',
    name: 'Patient app',
    task: 'A patient requests an appointment and chooses how to hear back.',
    setting: 'Mobile-first, used a few times a year.',
    profile: 'patient',
    density: 'comfortable',
  },
  provider: {
    id: 'provider',
    name: 'Provider workspace',
    task: 'A provider reviews appointment requests, filters the queue and acts on a request.',
    setting: 'Desktop-oriented, used throughout the working day.',
    profile: 'provider',
    density: 'compact',
  },
};

/** One status vocabulary for appointment requests, so both products use the same words and meanings. */
export const appointmentStatuses = ['requested', 'needs-details', 'confirmed', 'declined'] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  requested: 'Requested',
  'needs-details': 'Needs details',
  confirmed: 'Confirmed',
  declined: 'Declined',
};

/** The status meaning as a tone, shared by badges and alerts in both products. */
export const appointmentStatusTones: Record<AppointmentStatus, Tone> = {
  requested: 'info',
  'needs-details': 'warning',
  confirmed: 'success',
  declined: 'danger',
};

export interface AppointmentRequest {
  id: string;
  patient: string;
  reason: string;
  preferredTime: string;
  status: AppointmentStatus;
}

/** Synthetic requests shared by the examples. No real people, schedules or clinical logic. */
export const appointmentRequests: readonly AppointmentRequest[] = [
  { id: 'R-2041', patient: 'Sam K.', reason: 'Annual check-up', preferredTime: 'Weekday mornings', status: 'requested' },
  { id: 'R-2042', patient: 'Priya N.', reason: 'Follow-up visit', preferredTime: 'Any afternoon', status: 'needs-details' },
  { id: 'R-2045', patient: 'Jordan L.', reason: 'Vaccination', preferredTime: 'Tuesday or Thursday', status: 'requested' },
  { id: 'R-2047', patient: 'Maria G.', reason: 'Prescription review', preferredTime: 'Weekday mornings', status: 'confirmed' },
  { id: 'R-2050', patient: 'Chen W.', reason: 'New patient visit', preferredTime: 'Any time', status: 'declined' },
];
