/**
 * Situation Initialization Service
 *
 * Runs after auto-structure completes. Parses the AI-generated markdown
 * output and seeds tool-data subcollections so that every tool page has
 * initial data immediately after situation creation.
 *
 * Firestore path: users/{uid}/situations/{situationId}/tool-data/{toolId}
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { saveToolData } from '@/lib/firebase/tool-data-service';
import type { Situation } from '@/types/situation';

// ---------------------------------------------------------------------------
// Schemas for each tool's expected data shape
// ---------------------------------------------------------------------------

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
// Tool initialization map
// ---------------------------------------------------------------------------

interface ToolSeed {
  toolId: string;
  schema: z.ZodType;
  extractionPrompt: string;
}

const TOOL_SEEDS: ToolSeed[] = [
  {
    toolId: 'actor-profiles',
    schema: ActorSeedSchema,
    extractionPrompt: 'Extract all actors mentioned. For each, provide name, type (State/Armed Group/International Org/Civil Society/External Power), position, interests, leverage, and constraints.',
  },
  {
    toolId: 'risk-monitor',
    schema: RiskSeedSchema,
    extractionPrompt: 'Extract the risk assessment: risk score (scale 1 to 10), Glasl escalation stage (scale 1 to 9, or null if unknown), escalation trend, key risk factors with severity, and any window of opportunity.',
  },
  {
    toolId: 'early-warning',
    schema: TimelineEventSchema,
    extractionPrompt: 'Extract all timeline events mentioned. For each, provide date, title, description, and significance level (critical/high/medium/low).',
  },
  {
    toolId: 'conflict-graph',
    schema: GraphSeedSchema,
    extractionPrompt: 'Extract entities and relationships as a knowledge graph. Create nodes for actors, events, claims, and interests. Create edges for relationships (alliance, rivalry, dependency, supports, opposes, patron-client). Use kebab-case IDs derived from names.',
  },
  {
    toolId: 'stakeholder-map',
    schema: StakeholderSeedSchema,
    extractionPrompt: 'Extract stakeholders with their power level (scale 1 to 10), interest level (scale 1 to 10), alignment (supportive/neutral/opposed/ambiguous), and category.',
  },
];

// ---------------------------------------------------------------------------
// Main initialization function
// ---------------------------------------------------------------------------

/**
 * Parse auto-structure output and seed tool-data for every tool page.
 * Called from the auto-structure onFinish callback.
 *
 * Uses a lightweight model (flash) to parse the already-generated markdown
 * into structured JSON matching each tool's expected schema.
 */
export async function initializeSituationTools(
  uid: string,
  situationId: string,
  situation: Situation,
  autoStructureResult: string
): Promise<{ seeded: string[]; failed: string[] }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  // Process all tool seeds in parallel
  const promises = TOOL_SEEDS.map(async ({ toolId, schema, extractionPrompt }) => {
    try {
      const result = await generateText({
        model: getModel(), // flash — fast and cheap for extraction
        output: Output.object({ schema }),
        prompt: `You are a data extraction engine. Given the following intelligence briefing about "${situation.name}", extract structured data.

INSTRUCTION: ${extractionPrompt}

INTELLIGENCE BRIEFING:
${autoStructureResult.slice(0, 30000)}

Extract the data precisely. Do not invent information not present in the briefing.`,
      });

      await saveToolData(uid, situationId, toolId, result.output);
      seeded.push(toolId);
    } catch (err) {
      console.error(`[situation-init] Failed to seed ${toolId}:`, err);
      failed.push(toolId);
    }
  });

  await Promise.all(promises);

  // Also save a dashboard snapshot combining key data
  try {
    await saveToolData(uid, situationId, 'dashboard-snapshot', {
      situationName: situation.name,
      riskScore: situation.riskScore,
      glaslStage: situation.glaslStage,
      escalationTrend: situation.escalationTrend,
      actorCount: situation.actorCount,
      seededTools: seeded,
      initializedAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical
  }

  console.log(`[situation-init] Seeded ${seeded.length} tools, ${failed.length} failed for ${situationId}`);
  return { seeded, failed };
}
