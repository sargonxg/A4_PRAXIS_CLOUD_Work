import { z } from 'zod';

export const ADVISOR_IDS = ['adeyemi', 'reyes', 'vanderberg', 'takeda'] as const;
export type AdvisorId = typeof ADVISOR_IDS[number];

export const ADVISOR_MODEL_TIERS = [
  'gemini-3-flash',
  'gemini-3-pro',
  'gemini-3-pro-deepthink',
  'claude-sonnet-4',
] as const;
export type AdvisorModelTier = typeof ADVISOR_MODEL_TIERS[number];

export const ADVISOR_TOOLS = ['webSearch', 'firecrawlScrape', 'knowledgeCore'] as const;

export const AdvisorConfigSchema = z.object({
  id: z.enum(ADVISOR_IDS),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().max(500),
  headshotUrl: z.string().url().nullable(),
  persona: z.string().min(100),
  modelTier: z.enum(ADVISOR_MODEL_TIERS),
  sourceCategories: z.array(z.string()).min(1).max(12),
  allowedTools: z.array(z.enum(ADVISOR_TOOLS)),
  greeting: z.string().min(1).max(400),
  memoryPolicy: z.object({
    lastTurns: z.number().int().min(0).max(32),
    rollingSummary: z.boolean(),
  }),
  version: z.number().int().positive(),
  updatedAt: z.any().nullable(),
});
export type AdvisorConfig = z.infer<typeof AdvisorConfigSchema>;

export interface AdvisorFrame {
  advisorId: AdvisorId;
  rollingSummary: string;
  lastTurnAt: string;
}
