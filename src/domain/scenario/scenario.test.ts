import { describe, expect, it } from 'vitest';
import { appointmentRequests, appointmentStatuses, appointmentStatusLabels, appointmentStatusTones, productExampleIds, productExamples } from './scenario';

describe('the shared scenario', () => {
  it('describes each product example with a name, one-sentence task and setting', () => {
    for (const id of productExampleIds) {
      const example = productExamples[id];
      expect(example.id).toBe(id);
      expect(example.name.length, id).toBeGreaterThan(0);
      for (const sentence of [example.task, example.setting]) expect(sentence.split(/(?<=\.)\s/), id).toHaveLength(1);
    }
  });

  it('labels every status, gives it a tone, and uses only those statuses in the requests', () => {
    for (const status of appointmentStatuses) {
      expect(appointmentStatusLabels[status].length, status).toBeGreaterThan(0);
      expect(appointmentStatusTones[status], status).toBeDefined();
    }
    expect(new Set(Object.values(appointmentStatusTones)).size).toBe(appointmentStatuses.length);
    for (const request of appointmentRequests) expect(appointmentStatuses, request.id).toContain(request.status);
    expect(new Set(appointmentRequests.map((request) => request.id)).size).toBe(appointmentRequests.length);
  });
});
