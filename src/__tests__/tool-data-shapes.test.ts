import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the Zod schemas from situation-initializer.ts so we can test
// their parsing behaviour without importing server-only code that pulls in AI SDK.

const ActorSeedSchema = z.object({
  actors: z.array(z.object({
    name: z.string(),
    type: z.string(),
    position: z.string(),
    interests: z.string(),
    leverage: z.string(),
    constraints: z.string(),
  })),
});

const RiskSeedSchema = z.object({
  riskScore: z.number().min(0).max(10),
  glaslStage: z.number().min(1).max(9).nullable(),
  escalationTrend: z.enum(['stable', 'escalating', 'de-escalating', 'volatile']),
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    description: z.string(),
  })),
  windowOfOpportunity: z.string().nullable(),
});

const TimelineEventSchema = z.object({
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
    significance: z.enum(['critical', 'high', 'medium', 'low']),
  })),
});

const GraphSeedSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['actor', 'event', 'claim', 'interest', 'constraint', 'leverage', 'commitment', 'narrative']),
    description: z.string().optional(),
  })),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    type: z.string(),
    label: z.string(),
  })),
});

const StakeholderSeedSchema = z.object({
  stakeholders: z.array(z.object({
    name: z.string(),
    power: z.number().min(1).max(10),
    interest: z.number().min(1).max(10),
    alignment: z.enum(['supportive', 'neutral', 'opposed', 'ambiguous']),
    category: z.string(),
  })),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tool Data Shapes — ActorSeedSchema', () => {
  it('parses a minimal valid object', () => {
    const result = ActorSeedSchema.safeParse({
      actors: [{
        name: 'Government',
        type: 'State',
        position: 'Maintain sovereignty',
        interests: 'Territorial integrity',
        leverage: 'Military force',
        constraints: 'International law',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = ActorSeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Tool Data Shapes — RiskSeedSchema', () => {
  it('parses a minimal valid object', () => {
    const result = RiskSeedSchema.safeParse({
      riskScore: 7,
      glaslStage: 3,
      escalationTrend: 'escalating',
      riskFactors: [{
        factor: 'Arms proliferation',
        severity: 'high',
        description: 'Weapons flowing into the region',
      }],
      windowOfOpportunity: 'Upcoming elections',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = RiskSeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Tool Data Shapes — TimelineEventSchema', () => {
  it('parses a minimal valid object', () => {
    const result = TimelineEventSchema.safeParse({
      events: [{
        date: '2024-01-15',
        title: 'Ceasefire declared',
        description: 'Both parties agreed to a 48-hour ceasefire',
        significance: 'critical',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = TimelineEventSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Tool Data Shapes — GraphSeedSchema', () => {
  it('parses a minimal valid object', () => {
    const result = GraphSeedSchema.safeParse({
      nodes: [{
        id: 'actor-government',
        name: 'Government',
        type: 'actor',
      }],
      edges: [{
        source: 'actor-government',
        target: 'actor-rebels',
        type: 'rivalry',
        label: 'Armed conflict',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = GraphSeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Tool Data Shapes — StakeholderSeedSchema', () => {
  it('parses a minimal valid object', () => {
    const result = StakeholderSeedSchema.safeParse({
      stakeholders: [{
        name: 'UN Security Council',
        power: 9,
        interest: 7,
        alignment: 'neutral',
        category: 'International Organization',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = StakeholderSeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
