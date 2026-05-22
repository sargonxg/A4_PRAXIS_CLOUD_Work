import { z } from 'zod';

// ---------------------------------------------------------------------------
// Message content — handles both plain string and AI SDK multi-part arrays
// ---------------------------------------------------------------------------

export const messageContentSchema = z.union([
  z.string(),
  z.array(
    z.object({
      type: z.string(),
      text: z.string().optional(),
      toolCallId: z.string().optional(),
      toolName: z.string().optional(),
      result: z.unknown().optional(),
      args: z.unknown().optional(),
    })
  ),
]);

// ---------------------------------------------------------------------------
// Situation context — subset of the Situation type sent by the client.
// Uses .passthrough() so extra fields from the full Situation type are
// forwarded without being stripped (e.g. sourceUrls, conflictClassification).
// ---------------------------------------------------------------------------

export const situationContextSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
    region: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    actors: z
      .array(z.union([z.string(), z.object({ name: z.string() }).passthrough()]))
      .optional(),
    userRole: z.string().optional(),
    riskScore: z.number().min(0).max(100).optional(),
    glaslStage: z.number().min(1).max(9).nullable().optional(),
    escalationTrend: z.string().optional(),
    sourceUrls: z.array(z.string()).optional(),
    contextNotes: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// AI settings — client-provided model/temperature overrides
// ---------------------------------------------------------------------------

export const aiSettingsSchema = z
  .object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    analysisDepth: z.enum(['standard', 'deep']).optional(),
    provider: z.string().optional(),
    agenticSearchPremium: z.boolean().optional(),
    researchGraphExtra: z.boolean().default(false),
  })
  .optional();
