import { z } from 'zod';

export const CanonicalPersonaIdSchema = z.enum([
  'political-analyst',
  'security-analyst',
  'humanitarian-analyst',
  'legal-adviser',
  'mediation-strategist',
  'media-analyst',
  'economist',
  'regional-expert',
  'devils-advocate',
  'synthesis-lead',
]);

export const PersonaIdSchema = z.string().min(1);
export const DeliberationPhaseSchema = z.enum([
  'configure',
  'opening',
  'initial_takes',
  'disagreement',
  'deepening',
  'red_team_challenge',
  'ach_scoring',
  'synthesis',
  'closed',
  'aborted',
]);

export const PersonaFrameworkSchema = z.object({
  name: z.string().min(1),
  note: z.string().min(1),
});

export const CitationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sourceType: z.enum(['corpus', 'graph', 'tool', 'opinion']),
  sourceRef: z.string().optional(),
  excerpt: z.string().optional(),
});

export const PersonaSpecSchema = z.object({
  id: PersonaIdSchema,
  version: z.string().min(1),
  displayName: z.string().min(1),
  shortRole: z.string().min(1),
  avatar: z.object({
    kind: z.literal('geometric'),
    shape: z.enum(['circle', 'square', 'triangle', 'diamond', 'hexagon']),
    color: z.string().min(1),
  }),
  background: z.object({
    professionalProfile: z.string().min(120),
    credentials: z.array(z.string().min(1)).min(1),
    yearsOfExperience: z.number().int().min(1),
    languages: z.array(z.string().min(1)).min(1),
  }),
  expertise: z.object({
    domains: z.array(z.string().min(1)).min(1),
    frameworks: z.array(PersonaFrameworkSchema).min(1),
    signatureQuestions: z.array(z.string().min(1)).min(2),
    signatureBlindSpots: z.array(z.string().min(1)).min(1),
    confidenceProfile: z.enum(['cautious', 'measured', 'assertive']),
  }),
  voice: z.object({
    register: z.enum(['formal', 'professional', 'plainspoken']),
    typicalUtteranceLength: z.object({
      min: z.number().int().positive(),
      median: z.number().int().positive(),
      max: z.number().int().positive(),
    }),
    formPreferences: z.array(z.enum(['prose', 'bullets', 'questions', 'caveats'])).min(1),
    signaturePhrases: z.array(z.string().min(1)).min(1),
    avoidPhrases: z.array(z.string().min(1)).min(1),
  }),
  tools: z.object({
    proficientToolIds: z.array(z.string().min(1)),
    canInvokeTools: z.boolean(),
  }),
  corpus: z.object({
    namespace: z.string().min(1),
    version: z.string().min(1),
    manifest: z.array(z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      citation: z.string().min(1),
      license: z.string().min(1),
    })).min(1),
  }),
});

export const PersonaContributionSchema = z.object({
  id: z.string().min(1),
  personaId: PersonaIdSchema,
  personaName: z.string().min(1),
  phase: DeliberationPhaseSchema,
  contributionType: z.enum(['opening', 'initial_take', 'reaction', 'challenge', 'deepening', 'synthesis', 'close']),
  text: z.string().min(1),
  citations: z.array(CitationSchema).min(1),
  toolUses: z.array(z.object({
    toolId: z.string().min(1),
    label: z.string().min(1),
    status: z.enum(['planned', 'running', 'completed', 'skipped']),
    summary: z.string().optional(),
  })).default([]),
  wordCount: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(0.6),
  synthesized: z.literal(true),
  createdAt: z.string().min(1),
});

export const DeliberationSynthesisSchema = z.object({
  bluf: z.string().min(1),
  consensusClaims: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    confidence: z.number().min(0).max(0.6),
    citations: z.array(CitationSchema).min(1),
    synthesized: z.literal(true),
  })),
  dissentingViews: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  confidence: z.number().min(0).max(0.6),
  synthesized: z.literal(true),
});

export const DeliberationConfigSchema = z.object({
  question: z.string().min(5).max(1200),
  participantIds: z.array(PersonaIdSchema).min(3).max(7),
  rounds: z.number().int().min(1).max(8),
  moderatorStyle: z.enum(['concise', 'standard', 'deep']).default('standard'),
  satIntegration: z.object({
    redTeamRound: z.boolean().default(false),
    achScoring: z.boolean().default(false),
    kacAnnex: z.boolean().default(false),
    premortemRound: z.boolean().default(false),
  }).default({
    redTeamRound: false,
    achScoring: false,
    kacAnnex: false,
    premortemRound: false,
  }),
});

export const DeliberationArtifactSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  ownerUid: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['configured', 'running', 'synthesized', 'closed', 'aborted']),
  phase: DeliberationPhaseSchema,
  config: DeliberationConfigSchema,
  participants: z.array(PersonaSpecSchema).min(1),
  contributions: z.array(PersonaContributionSchema),
  synthesis: DeliberationSynthesisSchema.optional(),
  cost: z.object({
    ceilingUsd: z.number().positive(),
    estimatedUsd: z.number().min(0),
    ceilingReached: z.boolean(),
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CanonicalPersonaId = z.infer<typeof CanonicalPersonaIdSchema>;
export type PersonaId = z.infer<typeof PersonaIdSchema>;
export type DeliberationPhase = z.infer<typeof DeliberationPhaseSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type PersonaSpec = z.infer<typeof PersonaSpecSchema>;
export type PersonaContribution = z.infer<typeof PersonaContributionSchema>;
export type DeliberationConfig = z.infer<typeof DeliberationConfigSchema>;
export type DeliberationSynthesis = z.infer<typeof DeliberationSynthesisSchema>;
export type DeliberationArtifact = z.infer<typeof DeliberationArtifactSchema>;
