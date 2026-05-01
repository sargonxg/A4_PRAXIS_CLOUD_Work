import { describe, expect, it } from 'vitest';
import { advisors, advisorCapabilityById } from '@/lib/constants/advisors';
import { ADVISOR_IDS } from '@/types/advisor';

describe('flagship advisor capability registry', () => {
  it('keeps the public four-advisor surface aligned with the server ids', () => {
    expect(advisors.map((advisor) => advisor.id)).toEqual(ADVISOR_IDS);
  });

  it('defines real agent capabilities for every flagship advisor', () => {
    for (const advisor of advisors) {
      expect(advisor.method.length).toBeGreaterThan(80);
      expect(advisor.boardroomRole.length).toBeGreaterThan(60);
      expect(advisor.toolAccess.length).toBeGreaterThanOrEqual(3);
      expect(advisor.dataAccess.length).toBeGreaterThanOrEqual(4);
      expect(advisor.dialecticaLayer.length).toBeGreaterThan(70);
      expect(advisorCapabilityById[advisor.id]).toBe(advisor);
    }
  });
});
