import { describe, it, expect } from 'vitest';
import { AdvisorConfigSchema, ADVISOR_IDS } from '@/types/advisor';

describe('AdvisorConfig', () => {
  it('accepts a fully formed config', () => {
    const parsed = AdvisorConfigSchema.parse({
      id: 'adeyemi',
      name: 'Dr. Ngozi Adeyemi',
      title: 'Senior Political Affairs Advisor',
      bio: 'Governance, elections, civil society, state-building.',
      headshotUrl: null,
      persona: 'You are Dr. Ngozi Adeyemi with twenty years in political affairs, elections observation, and governance. You apply Putnam two-level game and Fisher-Ury framing. Measured register, 3-5 paragraphs.',
      modelTier: 'gemini-3-pro-deepthink',
      sourceCategories: ['multilateral-political', 'democracy-indices'],
      allowedTools: ['webSearch', 'knowledgeCore'],
      greeting: 'Hello — how can I help?',
      memoryPolicy: { lastTurns: 8, rollingSummary: true },
      version: 1,
      updatedAt: null,
    });
    expect(parsed.id).toBe('adeyemi');
  });

  it('lists exactly 4 advisor ids', () => {
    expect(ADVISOR_IDS).toEqual(['adeyemi', 'reyes', 'vanderberg', 'takeda']);
  });
});
