import { describe, expect, it } from 'vitest';
import { advisors, advisorCapabilityById } from '@/lib/constants/advisors';
import { FALLBACK_ADVISOR_CONFIGS } from '@/lib/constants/advisor-configs';
import { ADVISOR_IDS } from '@/types/advisor';

describe('flagship advisor capability registry', () => {
  it('keeps the public four-advisor surface aligned with the server ids', () => {
    expect(advisors.map((advisor) => advisor.id)).toEqual(ADVISOR_IDS);
  });

  it('defines real agent capabilities for every flagship advisor', () => {
    for (const advisor of advisors) {
      expect(advisor.method.length).toBeGreaterThan(80);
      expect(advisor.deliberationRole.length).toBeGreaterThan(60);
      expect(advisor.toolAccess.length).toBeGreaterThanOrEqual(3);
      expect(advisor.dataAccess.length).toBeGreaterThanOrEqual(4);
      expect(advisor.dialecticaLayer.length).toBeGreaterThan(70);
      expect(advisorCapabilityById[advisor.id]).toBe(advisor);
    }
  });

  it('keeps fallback runtime configs available for routed policy lenses', () => {
    expect(FALLBACK_ADVISOR_CONFIGS.map((advisor) => advisor.id)).toEqual(ADVISOR_IDS);
    for (const advisor of FALLBACK_ADVISOR_CONFIGS) {
      expect(advisor.persona.length).toBeGreaterThan(300);
      expect(advisor.allowedTools).toContain('knowledgeCore');
      expect(advisor.greeting.length).toBeGreaterThan(40);
    }
  });
});
