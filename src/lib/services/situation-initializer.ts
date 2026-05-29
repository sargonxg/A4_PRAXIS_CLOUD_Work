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
import { updateSituationAdmin } from '@/lib/firebase/situations';
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
    type: z.enum(['actor', 'event', 'claim', 'interest', 'constraint', 'leverage', 'commitment', 'narrative', 'institution', 'norm', 'resource', 'risk', 'policy', 'grievance']),
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

// ---------------------------------------------------------------------------
// Additional schemas for expanded seeding (Tier 2 & 3)
// ---------------------------------------------------------------------------

const InfoEnvironmentSeedSchema = z.object({
  narratives: z.array(z.object({
    title: z.string(),
    description: z.string(),
    actors: z.array(z.string()),
    reach: z.enum(['local', 'national', 'regional', 'international']),
    credibility: z.enum(['verified', 'partially-verified', 'unverified', 'disinformation']),
  })),
  dominantFramings: z.array(z.string()),
  disinformationRisks: z.array(z.string()),
});

const SanctionsSeedSchema = z.object({
  sanctionedEntities: z.array(z.object({
    name: z.string(),
    type: z.enum(['individual', 'entity', 'vessel', 'aircraft']),
    regimes: z.array(z.string()),
    reason: z.string(),
  })),
  complianceRisks: z.array(z.string()),
  activeMeasures: z.array(z.string()),
});

const CommitmentsSeedSchema = z.object({
  commitments: z.array(z.object({
    title: z.string(),
    parties: z.array(z.string()),
    type: z.enum(['ceasefire', 'peace_agreement', 'diplomatic', 'humanitarian', 'political']),
    status: z.enum(['active', 'violated', 'expired', 'suspended']),
    date: z.string(),
    keyProvisions: z.array(z.string()),
  })),
});

const ScenarioSeedSchema = z.object({
  scenarios: z.array(z.object({
    name: z.string(),
    description: z.string(),
    probability: z.number().min(0).max(1),
    impact: z.enum(['catastrophic', 'severe', 'moderate', 'minor']),
    drivers: z.array(z.string()),
    indicators: z.array(z.string()),
  })),
  baselineAssumptions: z.array(z.string()),
});

const GameTheorySeedSchema = z.object({
  players: z.array(z.object({
    name: z.string(),
    strategies: z.array(z.string()),
    preferences: z.string(),
  })),
  dominantStrategy: z.string().nullable(),
  nashEquilibrium: z.string().nullable(),
  cooperativeOutcome: z.string(),
  analysis: z.string(),
});

const MediationSeedSchema = z.object({
  processDesign: z.object({
    format: z.string(),
    venue: z.string(),
    timeline: z.string(),
    mediatorRole: z.string(),
  }),
  confidenceBuildingMeasures: z.array(z.object({
    measure: z.string(),
    parties: z.array(z.string()),
    timeline: z.string(),
  })),
  trackOnePriorities: z.array(z.string()),
  trackTwoPriorities: z.array(z.string()),
  spoilerManagement: z.string(),
});

const HumanitarianSeedSchema = z.object({
  overview: z.string(),
  displacement: z.object({ idps: z.number(), refugees: z.number(), source: z.string() }).nullable(),
  foodSecurity: z.object({ phase: z.string(), affectedPopulation: z.number(), source: z.string() }).nullable(),
  fundingGap: z.object({ required: z.number(), funded: z.number(), pctFunded: z.number() }).nullable(),
  priorities: z.array(z.string()),
});

const CalendarSeedSchema = z.object({
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    type: z.enum(['diplomatic', 'election', 'military', 'humanitarian', 'legal', 'anniversary']),
    riskLevel: z.enum(['high', 'medium', 'low']),
    description: z.string(),
  })),
});

const DossierSeedSchema = z.object({
  subject: z.string(),
  type: z.enum(['actor', 'topic', 'region']),
  summary: z.string(),
  keyFacts: z.array(z.object({ fact: z.string(), source: z.string(), confidence: z.enum(['high', 'medium', 'low']) })),
  timeline: z.array(z.object({ date: z.string(), event: z.string() })),
  connections: z.array(z.string()),
  assessment: z.string(),
});

const BriefingSeedSchema = z.object({
  title: z.string(),
  classification: z.string(),
  keyDevelopments: z.array(z.object({ headline: z.string(), detail: z.string(), significance: z.string() })),
  assessment: z.string(),
  recommendations: z.array(z.string()),
  speakerNotes: z.string(),
});

const PolicyMemoSeedSchema = z.object({
  title: z.string(),
  issueStatement: z.string(),
  background: z.string(),
  options: z.array(z.object({
    option: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    feasibility: z.enum(['high', 'medium', 'low']),
  })),
  recommendation: z.string(),
  riskAssessment: z.string(),
});

// ---------------------------------------------------------------------------
// Tier 1: Immediate seeding (critical tools — from auto-structure markdown)
// ---------------------------------------------------------------------------

const TIER1_SEEDS: ToolSeed[] = [
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
// Tier 2: Secondary seeding (extracted from auto-structure, runs after Tier 1)
// ---------------------------------------------------------------------------

const TIER2_SEEDS: ToolSeed[] = [
  {
    toolId: 'info-environment',
    schema: InfoEnvironmentSeedSchema,
    extractionPrompt: 'Extract the information environment: active narratives (title, description, actors promoting them, reach, credibility), dominant framings used by media and actors, and disinformation risks.',
  },
  {
    toolId: 'sanctions',
    schema: SanctionsSeedSchema,
    extractionPrompt: 'Extract any sanctioned entities mentioned (individuals, organizations, vessels). For each: name, type, which sanctions regimes apply (UN/EU/US/OFAC), reason. List compliance risks and active measures.',
  },
  {
    toolId: 'commitments',
    schema: CommitmentsSeedSchema,
    extractionPrompt: 'Extract all commitments, agreements, and ceasefires mentioned. For each: title, parties involved, type (ceasefire/peace/diplomatic/humanitarian/political), current status, date, key provisions.',
  },
  {
    toolId: 'scenarios',
    schema: ScenarioSeedSchema,
    extractionPrompt: 'Generate 3-5 plausible future scenarios. For each: name, description, probability (0-1), impact level, key drivers, and early warning indicators. List baseline assumptions.',
  },
  {
    toolId: 'game-theory',
    schema: GameTheorySeedSchema,
    extractionPrompt: 'Model the conflict as a game. Identify 2-4 key players with their available strategies and preferences. Determine if a dominant strategy exists, identify Nash equilibrium, and describe the cooperative outcome. Provide strategic analysis.',
  },
  {
    toolId: 'mediation-design',
    schema: MediationSeedSchema,
    extractionPrompt: 'Design a mediation process. Specify format, venue, timeline, and mediator role. List 3-5 confidence-building measures with parties and timelines. Identify Track 1 and Track 2 priorities. Describe spoiler management strategy.',
  },
  {
    toolId: 'humanitarian',
    schema: HumanitarianSeedSchema,
    extractionPrompt: 'Extract humanitarian situation: overview, displacement numbers (IDPs, refugees), food security phase and affected population, funding requirements and gap, and top humanitarian priorities.',
  },
  {
    toolId: 'calendar',
    schema: CalendarSeedSchema,
    extractionPrompt: 'Extract upcoming critical dates and events. For each: date, title, type (diplomatic/election/military/humanitarian/legal/anniversary), risk level, and description.',
  },
  {
    toolId: 'dossier',
    schema: DossierSeedSchema,
    extractionPrompt: 'Generate an intelligence dossier on the primary subject of the situation. Include: subject name, type (actor/topic/region), executive summary, key verified facts with sources and confidence, timeline, connections to other entities, and overall assessment.',
  },
  {
    toolId: 'briefing',
    schema: BriefingSeedSchema,
    extractionPrompt: 'Generate an intelligence briefing. Include: title, classification, 3-5 key developments (headline, detail, significance), overall assessment, 3-5 recommendations, and speaker notes.',
  },
  {
    toolId: 'policy-memo',
    schema: PolicyMemoSeedSchema,
    extractionPrompt: 'Generate a policy memo. Include: title, issue statement, background context, 3-4 policy options (with pros, cons, feasibility), recommended option with justification, and risk assessment.',
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
/**
 * Seed a single tool from auto-structure markdown.
 */
async function seedTool(
  uid: string,
  situationId: string,
  situationName: string,
  autoStructureResult: string,
  seed: ToolSeed
): Promise<boolean> {
  try {
    const result = await generateText({
      model: getModel(), // flash — fast and cheap for extraction
      output: Output.object({ schema: seed.schema }),
      prompt: `You are a data extraction engine. Given the following intelligence briefing about "${situationName}", extract structured data.

INSTRUCTION: ${seed.extractionPrompt}

INTELLIGENCE BRIEFING:
${autoStructureResult.slice(0, 30000)}

Extract the data precisely. Do not invent information not present in the briefing.`,
    });

    await saveToolData(uid, situationId, seed.toolId, result.output);

    // Ingest tool output into SKC vector layer (best-effort, non-blocking)
    try {
      const { SituationKnowledgeCore } = await import('@/lib/knowledge');
      const skc = new SituationKnowledgeCore(uid, situationId);
      const summary = JSON.stringify(result.output).slice(0, 2000);
      await skc.ingestToolOutput(seed.toolId, summary);
    } catch {
      // Non-critical — SKC ingestion failure doesn't break tool seeding
    }

    return true;
  } catch (err) {
    console.error(`[situation-init] Failed to seed ${seed.toolId}:`, err);
    return false;
  }
}

/**
 * Parse auto-structure output and seed tool-data for every tool page.
 * Called from the auto-structure onFinish callback.
 *
 * Three-tier initialization:
 *   Tier 1 (immediate): 8 critical tools — actors, risk, graph, etc.
 *   Tier 2 (secondary): 11 additional tools — scenarios, sanctions, briefing, etc.
 *   Tier 3 (background): Live data research for 15 intelligence tools
 *
 * Tier 1 runs synchronously (user waits).
 * Tier 2 runs after Tier 1 completes (still within the same request).
 * Tier 3 triggers background research via the research service (returns immediately).
 */
export async function initializeSituationTools(
  uid: string,
  situationId: string,
  situation: Situation,
  autoStructureResult: string
): Promise<{ seeded: string[]; failed: string[] }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  // ── Tier 1: Critical tools (parallel) ──────────────────────────────────
  const tier1Results = await Promise.all(
    TIER1_SEEDS.map(async (seed) => {
      const ok = await seedTool(uid, situationId, situation.name, autoStructureResult, seed);
      if (ok) seeded.push(seed.toolId); else failed.push(seed.toolId);
      return ok;
    })
  );

  console.log(`[situation-init] Tier 1: ${tier1Results.filter(Boolean).length}/${TIER1_SEEDS.length} seeded`);

  // Patch situation with AI-derived risk fields immediately
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
        await updateSituationAdmin(uid, situationId, patchFields).catch(() => {});
        console.log(`[situation-init] Patched situation risk fields:`, patchFields);
      }
    }
  } catch {
    // Non-fatal — situation fields remain at defaults
  }

  // Save interim dashboard snapshot so sidebar shows Tier 1 tools immediately
  const now = new Date().toISOString();
  try {
    await saveToolData(uid, situationId, 'dashboard-snapshot', {
      situationName: situation.name,
      riskScore: situation.riskScore,
      glaslStage: situation.glaslStage,
      escalationTrend: situation.escalationTrend,
      actorCount: situation.actorCount,
      seededTools: [...seeded],
      toolTimestamps: Object.fromEntries(seeded.map((id) => [id, now])),
      initializedAt: now,
    });
  } catch {
    // Non-critical
  }

  // ── Tier 2: Secondary tools (parallel, non-blocking for dashboard) ─────
  const tier2Results = await Promise.all(
    TIER2_SEEDS.map(async (seed) => {
      const ok = await seedTool(uid, situationId, situation.name, autoStructureResult, seed);
      if (ok) seeded.push(seed.toolId); else failed.push(seed.toolId);
      return ok;
    })
  );

  console.log(`[situation-init] Tier 2: ${tier2Results.filter(Boolean).length}/${TIER2_SEEDS.length} seeded`);

  // Update dashboard snapshot with all seeded tools
  try {
    await saveToolData(uid, situationId, 'dashboard-snapshot', {
      situationName: situation.name,
      riskScore: situation.riskScore,
      glaslStage: situation.glaslStage,
      escalationTrend: situation.escalationTrend,
      actorCount: situation.actorCount,
      seededTools: [...seeded],
      toolTimestamps: Object.fromEntries(seeded.map((id) => [id, now])),
      initializedAt: now,
      tier2CompletedAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical
  }

  console.log(`[situation-init] Total: ${seeded.length} seeded, ${failed.length} failed for ${situationId}`);
  return { seeded, failed };
}
