import { z } from 'zod';
import { AGENT_REGISTRY, type AgentPersonaId } from '@/lib/agents/registry';

export type BrainstormingPersonaId = Extract<
  AgentPersonaId,
  'mediator' | 'humanitarian' | 'legal' | 'media' | 'security' | 'red-team'
>;

export const BRAINSTORMING_PERSONA_IDS = [
  'mediator',
  'humanitarian',
  'legal',
  'media',
  'security',
  'red-team',
] as const satisfies readonly BrainstormingPersonaId[];

export const BRAINSTORMING_PERSONAS = BRAINSTORMING_PERSONA_IDS.map((id) => {
  const persona = AGENT_REGISTRY[id];
  return { id: persona.id as BrainstormingPersonaId, label: persona.label, rolePrompt: persona.rolePrompt };
}) as ReadonlyArray<{ id: BrainstormingPersonaId; label: string; rolePrompt: string }>;

const TurnSchema = z.object({
  turnId: z.string(),
  persona: z.enum(BRAINSTORMING_PERSONA_IDS),
  claim: z.string().min(10),
  evidence: z
    .array(
      z.object({
        sourceType: z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output', 'situation', 'web', 'reasoning']),
        sourceId: z.string().optional(),
        excerpt: z.string(),
      }),
    )
    .min(0),
  critique: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  status: z.enum(['proposed', 'challenged', 'accepted', 'rejected']),
});

const SynthesisSchema = z.object({
  bluf: z.string().min(20),
  consensusPoints: z.array(z.string()),
  divergences: z.array(z.string()),
  optionsForDecision: z.array(
    z.object({
      label: z.string(),
      tradeoffs: z.string(),
      preferredBy: z.array(z.enum(BRAINSTORMING_PERSONA_IDS)).optional(),
    }),
  ),
  openQuestions: z.array(z.string()),
  nextActions: z.array(
    z.object({
      action: z.string(),
      owner: z.enum(['analyst', 'mission', 'donor', 'cluster-lead', 'red-team', 'researcher']).optional(),
      urgency: z.enum(['immediate', 'short-term', 'medium-term']),
    }),
  ),
});

export const BrainstormingTableSchema = z.object({
  question: z.string(),
  generatedAt: z.string(),
  personas: z.array(z.enum(BRAINSTORMING_PERSONA_IDS)),
  turns: z.array(TurnSchema).min(2),
  synthesis: SynthesisSchema,
  retrievalTrace: z.object({
    layersSearched: z.array(z.string()),
    itemCount: z.number().nonnegative(),
    durationMs: z.number().nonnegative(),
  }).optional(),
});
