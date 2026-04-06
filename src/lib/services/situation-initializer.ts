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
import { updateSituation } from '@/lib/firebase/situations-service';
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

// Additional schemas for expanded tool seeding
const PowerMapSeedSchema = z.object({
  actors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    shortName: z.string().optional(),
    type: z.enum(['state', 'non_state_armed', 'international', 'regional', 'civil_society', 'private_sector', 'media']),
    power: z.number().min(1).max(10),
    interest: z.number().min(1).max(10),
    stance: z.enum(['supporter', 'opponent', 'neutral', 'spoiler', 'mediator']),
    color: z.string(),
    keyLeverage: z.string(),
    engagementStrategy: z.string(),
  })).min(2).max(12),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['alliance', 'rivalry', 'diplomatic', 'support', 'dependency', 'proxy']),
    strength: z.number().min(1).max(10),
    description: z.string(),
  })),
  quadrantSummary: z.object({
    keyPlayers: z.array(z.string()),
    keepSatisfied: z.array(z.string()),
    keepInformed: z.array(z.string()),
    monitor: z.array(z.string()),
  }),
  coalitionDynamics: z.string(),
  spoilerRisks: z.string(),
  engagementPriorities: z.array(z.string()).min(3),
});

const NegotiationSeedSchema = z.object({
  parties: z.array(z.object({
    name: z.string(),
    corePosition: z.string(),
    underlyingInterests: z.array(z.string()),
    batna: z.string(),
    redLines: z.array(z.string()),
  })),
  zopaExists: z.boolean(),
  zopaDescription: z.string(),
  keyIssues: z.array(z.object({
    issue: z.string(),
    positions: z.string(),
    interests: z.string(),
    possiblePackage: z.string(),
  })),
  ripeness: z.object({
    mutuallyHurtingStalemate: z.boolean(),
    wayOutVisible: z.boolean(),
    assessment: z.string(),
  }),
  recommendedApproach: z.string(),
});

const TalkingPointsSeedSchema = z.object({
  audience: z.string(),
  keyMessages: z.array(z.object({
    message: z.string(),
    rationale: z.string(),
    evidence: z.string(),
  })),
  anticipatedQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  thingsToAvoid: z.array(z.string()),
  framing: z.string(),
});

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
  {
    toolId: 'power-map',
    schema: PowerMapSeedSchema,
    extractionPrompt: 'Extract a power/interest map for all actors. For each actor: assign a short kebab-case id, type (state/non_state_armed/international/regional/civil_society/private_sector/media), power score 1-10, interest score 1-10, stance (supporter/opponent/neutral/spoiler/mediator), a hex color, key leverage phrase, and engagement strategy. Also extract relationships between actors (alliance/rivalry/diplomatic/support/dependency/proxy) with strength 1-10. Assign actors to quadrants: keyPlayers (high power+interest), keepSatisfied (high power, low interest), keepInformed (low power, high interest), monitor (both low). Provide coalition dynamics summary, spoiler risks, and 3-5 engagement priorities.',
  },
  {
    toolId: 'negotiation-prep',
    schema: NegotiationSeedSchema,
    extractionPrompt: 'Extract negotiation analysis. For each major party: their core position, underlying interests (3-5), BATNA, and red lines. Assess whether a ZOPA (Zone of Possible Agreement) exists and describe it. List 3-5 key issues with each party\'s position and interests. Assess Zartman ripeness: is there a mutually hurting stalemate? Is a way out visible? Recommend a negotiation approach.',
  },
  {
    toolId: 'talking-points',
    schema: TalkingPointsSeedSchema,
    extractionPrompt: 'Extract key messaging and talking points for a neutral mediator or analyst audience. Identify 4-6 key messages with rationale and supporting evidence. List 3-5 anticipated questions with concise answers. Identify 3-5 things to avoid saying. Describe the overall framing strategy.',
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

  // Patch situation with AI-derived risk fields (if not already set by user)
  // This ensures buildToolContext has real values immediately after initialization
  try {
    const riskToolData = seeded.includes('risk-monitor')
      ? await import('@/lib/firebase/tool-data-service').then((m) =>
          m.getToolData(uid, situationId, 'risk-monitor')
        ).catch(() => null)
      : null;

    if (riskToolData?.data) {
      const riskData = riskToolData.data as {
        riskScore?: number;
        glaslStage?: number | null;
        escalationTrend?: string;
      };

      const patchFields: Record<string, unknown> = {};
      if (riskData.riskScore && situation.riskScore === 0) {
        patchFields.riskScore = riskData.riskScore;
      }
      if (riskData.glaslStage && !situation.glaslStage) {
        patchFields.glaslStage = riskData.glaslStage;
      }
      if (riskData.escalationTrend && situation.escalationTrend === 'stable') {
        patchFields.escalationTrend = riskData.escalationTrend;
      }
      if (Object.keys(patchFields).length > 0) {
        await updateSituation(uid, situationId, patchFields).catch(() => {});
        console.log(`[situation-init] Patched situation risk fields:`, patchFields);
      }
    }
  } catch {
    // Non-fatal — situation fields remain at defaults
  }

  // Save dashboard snapshot — drives the health semaphores in sidebar + dashboard
  try {
    await saveToolData(uid, situationId, 'dashboard-snapshot', {
      situationName: situation.name,
      riskScore: situation.riskScore,
      glaslStage: situation.glaslStage,
      escalationTrend: situation.escalationTrend,
      actorCount: situation.actorCount,
      seededTools: seeded,
      toolTimestamps: Object.fromEntries(
        seeded.map((toolId) => [toolId, new Date().toISOString()])
      ),
      initializedAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical
  }

  console.log(`[situation-init] Seeded ${seeded.length} tools, ${failed.length} failed for ${situationId}`);
  return { seeded, failed };
}
