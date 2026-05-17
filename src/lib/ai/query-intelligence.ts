/**
 * Query Intelligence Service — AI-Crafted Search Queries per Tool
 *
 * Instead of generic "situation + country" searches, this service uses AI
 * to craft precise, contextual search queries tailored to each tool's:
 *   - Analytical methodology (e.g., INFORM Risk, Glasl, Fisher-Ury)
 *   - Purpose (what the tool needs to find)
 *   - Situation context (actors, region, conflict type, risk level)
 *   - User profile (role, location, analytical framework preference)
 *   - Time sensitivity (breaking news vs. historical analysis)
 *
 * Example: For "media-roundup" on the selected situation with a NYC-based analyst:
 *   → "the selected situation conflict media coverage analysis past 24 hours"
 *   → "site:reuters.com OR site:aljazeera.com the selected situation developments today"
 *   → "the selected situation humanitarian situation international response April 2026"
 *
 * For "stakeholder-map" on the same situation:
 *   → "the selected situation conflict key actors power dynamics 2026"
 *   → "the selected situation armed groups alliances opposition government backers"
 *   → "site:expert-analysis.org the selected situation stakeholder analysis"
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryContext {
  toolId: string;
  situationName: string;
  country: string;
  region?: string;
  actors: string[];
  conflictType?: string;
  riskScore?: number;
  glaslStage?: number;
  escalationTrend?: string;
  description?: string;
  userRole?: string;
  userLocation?: string;
  favoriteSources?: string[];
  analyticalFramework?: string;
}

export interface CraftedQueries {
  primary: string;          // Main search query
  focused: string[];        // Source-focused variants
  temporal: string;         // Time-sensitive query
  methodology: string;      // Framework-specific query
  actorSpecific: string[];  // Per-actor queries
  reasoning: string;        // Why these queries were chosen
}

// ---------------------------------------------------------------------------
// Per-tool query templates (pre-defined, no AI call needed for speed)
// These are the "fast path" — used when we want instant queries.
// ---------------------------------------------------------------------------

interface ToolQueryTemplate {
  purpose: string;
  timeWindow: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'historical';
  queryPatterns: string[];
  actorQueryPattern?: string;
  methodologyTerms: string[];
  sourceHints: string[];     // Preferred source types for this tool
}

const TOOL_QUERY_TEMPLATES: Record<string, ToolQueryTemplate> = {
  // ── CONTEXT ────────────────────────────────────────────────────────────
  'dashboard': {
    purpose: 'Overall situation assessment and risk snapshot',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} conflict situation overview {year}',
      '{situation} {country} risk assessment latest developments',
      '{situation} escalation de-escalation indicators',
    ],
    methodologyTerms: ['INFORM risk index', 'conflict escalation', 'early warning indicators'],
    sourceHints: ['expert-analysis', 'source_linked_events', 'humanitarian_web', 'un'],
  },
  'documents': {
    purpose: 'Find primary source documents for ingestion',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} official reports documents {year}',
      '{situation} UN Security Council resolution report',
      '{situation} peace agreement ceasefire text',
    ],
    methodologyTerms: ['primary sources', 'official documents', 'UN reports'],
    sourceHints: ['un', 'statedept', 'academic'],
  },
  'sources-library': {
    purpose: 'Discover and evaluate intelligence sources',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} {country} conflict analysis sources organizations',
      '{situation} think tank research institute coverage',
      '{situation} journalism media coverage quality assessment',
    ],
    methodologyTerms: ['source credibility', 'media reliability', 'CRAAP test'],
    sourceHints: ['academic', 'expert-analysis', 'chathamhouse'],
  },
  'timeline': {
    purpose: 'Chronological event mapping and escalation tracking',
    timeWindow: 'historical',
    queryPatterns: [
      '{situation} timeline key events chronology',
      '{situation} {country} conflict history escalation triggers',
      '{situation} major developments {actors} clashes negotiations',
    ],
    methodologyTerms: ['Glasl escalation stages', 'trigger events', 'conflict chronology'],
    sourceHints: ['source_linked_events', 'wikipedia', 'expert-analysis'],
  },
  'humanitarian': {
    purpose: 'Humanitarian situation assessment',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} {country} humanitarian crisis situation update',
      '{situation} displacement refugees IDPs food insecurity',
      '{situation} humanitarian funding gap OCHA flash appeal',
    ],
    methodologyTerms: ['OCHA humanitarian needs', 'IPC food security', 'displacement statistics'],
    sourceHints: ['ocha', 'displacement_reporting', 'humanitarian_web'],
  },
  'calendar': {
    purpose: 'Upcoming diplomatic events and risk windows',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} upcoming elections diplomatic meetings negotiations',
      '{situation} UN Security Council scheduled debate vote',
      '{situation} peace process next steps timeline deadlines',
    ],
    methodologyTerms: ['diplomatic calendar', 'risk windows', 'political milestones'],
    sourceHints: ['un', 'statedept', 'reuters'],
  },

  // ── ANALYSIS ───────────────────────────────────────────────────────────
  'risk-monitor': {
    purpose: 'Multi-dimensional risk assessment using INFORM methodology',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} {country} security risk assessment {year}',
      '{situation} INFORM risk score vulnerability coping capacity',
      '{situation} conflict intensity fatalities trend analysis',
    ],
    actorQueryPattern: '{actor} military capability threat assessment {country}',
    methodologyTerms: ['INFORM risk index', 'hazard exposure', 'vulnerability', 'coping capacity'],
    sourceHints: ['source_linked_events', 'expert-analysis', 'economic_institution'],
  },
  'early-warning': {
    purpose: 'Escalation indicators and de-escalation windows',
    timeWindow: 'daily',
    queryPatterns: [
      '{situation} escalation warning signs indicators today',
      '{situation} violence spike trend ceasefire violation',
      '{situation} de-escalation opportunity diplomatic window',
    ],
    methodologyTerms: ['Glasl 9-stage model', 'early warning', 'trigger events', 'tipping points'],
    sourceHints: ['grounded_search', 'expert-analysis', 'reuters'],
  },
  'actor-profiles': {
    purpose: 'Deep intelligence on conflict actors',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} key actors leaders organizations profiles',
      '{situation} armed groups political parties capabilities',
      '{situation} external powers involvement interests',
    ],
    actorQueryPattern: '{actor} leadership structure capabilities interests alliances {country}',
    methodologyTerms: ['Stedman spoiler theory', 'actor mapping', 'interest analysis'],
    sourceHints: ['expert-analysis', 'isw', 'reuters', 'wikipedia'],
  },
  'stakeholder-map': {
    purpose: 'Power-legitimacy-urgency network mapping',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} stakeholder analysis power dynamics influence',
      '{situation} key players supporters opponents mediators',
      '{situation} political alliances coalitions opposition blocs',
    ],
    actorQueryPattern: '{actor} political power influence legitimacy {country}',
    methodologyTerms: ['Mitchell-Agle-Wood salience', 'power mapping', 'stakeholder quadrant'],
    sourceHints: ['expert-analysis', 'chathamhouse', 'brookings'],
  },
  'power-map': {
    purpose: 'Power asymmetry analysis using Barnett-Duvall taxonomy',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} power asymmetry military economic diplomatic leverage',
      '{situation} arms supplies military aid foreign support',
      '{situation} economic sanctions trade dependency power dynamics',
    ],
    actorQueryPattern: '{actor} military economic power resources {country}',
    methodologyTerms: ['Barnett-Duvall power taxonomy', 'compulsory structural productive institutional power'],
    sourceHints: ['security_research', 'economic_institution', 'expert-analysis'],
  },
  'compare': {
    purpose: 'Cross-conflict comparative analysis',
    timeWindow: 'historical',
    queryPatterns: [
      '{situation} compared to similar conflicts lessons learned',
      '{situation} conflict resolution precedents comparative cases',
      'conflicts similar to {situation} outcomes analysis',
    ],
    methodologyTerms: ['comparative conflict analysis', 'lessons learned', 'conflict typology'],
    sourceHints: ['academic', 'expert-analysis', 'brookings'],
  },
  'info-environment': {
    purpose: 'Narrative mapping and disinformation assessment',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} narrative propaganda disinformation media analysis',
      '{situation} information warfare social media influence operations',
      '{situation} media framing competing narratives fact-checking',
    ],
    methodologyTerms: ['Galtung cultural violence', 'narrative analysis', 'disinformation detection'],
    sourceHints: ['bbc', 'aljazeera', 'reuters'],
  },

  // ── DRAFTING ───────────────────────────────────────────────────────────
  'assistant': {
    purpose: 'General research and analysis assistance',
    timeWindow: 'realtime',
    queryPatterns: ['{situation} latest news developments today'],
    methodologyTerms: [],
    sourceHints: ['reuters', 'bbc', 'un'],
  },
  'report-studio': {
    purpose: 'Situation report generation with UN templates',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} situation report key developments this week',
      '{situation} UN Secretary-General report latest',
      '{situation} political military humanitarian assessment',
    ],
    methodologyTerms: ['UN DPPA briefing format', 'situation reporting'],
    sourceHints: ['un', 'humanitarian_web', 'expert-analysis'],
  },
  'dossier': {
    purpose: 'Comprehensive actor or topic intelligence dossier',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} intelligence dossier background comprehensive',
      '{situation} {actors} biography profile history activities',
      '{situation} detailed background analysis chronology',
    ],
    actorQueryPattern: '{actor} biography profile activities connections background',
    methodologyTerms: ['intelligence assessment', 'biographical intelligence', 'network analysis'],
    sourceHints: ['wikipedia', 'expert-analysis', 'reuters', 'academic'],
  },
  'talking-points': {
    purpose: 'Audience-tailored messaging and Q&A preparation',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} key messages talking points policy positions',
      '{situation} diplomatic language framing guidance',
      '{situation} frequently asked questions public statements',
    ],
    methodologyTerms: ['diplomatic communication', 'strategic messaging'],
    sourceHints: ['un', 'statedept'],
  },
  'briefing': {
    purpose: 'Intelligence briefing with speaker notes',
    timeWindow: 'daily',
    queryPatterns: [
      '{situation} latest intelligence briefing developments today',
      '{situation} security briefing key events past 48 hours',
      '{situation} political military developments analysis',
    ],
    methodologyTerms: ['intelligence briefing', 'operational assessment'],
    sourceHints: ['reuters', 'bbc', 'expert-analysis', 'un'],
  },
  'auto-briefing': {
    purpose: 'Daily automated intelligence digest',
    timeWindow: 'daily',
    queryPatterns: [
      '{situation} news developments past 24 hours',
      '{situation} overnight events incidents reports today',
      '{situation} daily situation update',
    ],
    methodologyTerms: ['daily intelligence digest', 'morning brief'],
    sourceHints: ['reuters', 'bbc', 'aljazeera', 'un'],
  },
  'policy-memo': {
    purpose: 'Policy options analysis and recommendation',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} policy options analysis recommendations',
      '{situation} diplomatic strategy intervention options',
      '{situation} sanctions peace process governance reform proposals',
    ],
    methodologyTerms: ['Putnam two-level game', 'policy analysis', 'options assessment'],
    sourceHints: ['brookings', 'expert-analysis', 'chathamhouse', 'carnegie'],
  },
  'un-toolkit': {
    purpose: 'UN terminology, resolution drafting, diplomatic tone',
    timeWindow: 'historical',
    queryPatterns: [
      '{situation} UN resolution language precedent',
      '{situation} Security Council draft resolution text',
      'UN diplomatic terminology conventions {situation}',
    ],
    methodologyTerms: ['UN diplomatic protocol', 'Security Council procedures'],
    sourceHints: ['un'],
  },

  // ── SIMULATION ─────────────────────────────────────────────────────────
  'scenarios': {
    purpose: 'Probability-weighted future scenario planning',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} future scenarios outlook forecast analysis',
      '{situation} best case worst case likely outcome projections',
      '{situation} risk scenarios escalation de-escalation pathways',
    ],
    methodologyTerms: ['scenario planning', 'probabilistic assessment', 'futures analysis'],
    sourceHints: ['expert-analysis', 'rand', 'chathamhouse'],
  },
  'negotiation-prep': {
    purpose: 'ZOPA/BATNA analysis with Harvard PON framework',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} negotiation positions interests red lines',
      '{situation} peace talks agenda preconditions demands',
      '{situation} BATNA alternatives negotiation leverage',
    ],
    actorQueryPattern: '{actor} negotiation position demands interests {situation}',
    methodologyTerms: ['Fisher-Ury principled negotiation', 'ZOPA BATNA', 'Zartman ripeness'],
    sourceHints: ['expert-analysis', 'un', 'chathamhouse'],
  },
  'concordia': {
    purpose: 'Live AI mediation simulation',
    timeWindow: 'realtime',
    queryPatterns: ['{situation} mediation dialogue positions'],
    methodologyTerms: ['mediation simulation', 'dialogue facilitation'],
    sourceHints: ['expert-analysis', 'un'],
  },
  'mediation-design': {
    purpose: 'Full mediation process architecture with CBMs',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} mediation process design framework',
      '{situation} confidence building measures track one track two',
      '{situation} peace process architecture inclusive dialogue',
    ],
    methodologyTerms: ['Lederach multi-level peacebuilding', 'Berghof mediation', 'CBMs'],
    sourceHints: ['un', 'expert-analysis', 'chathamhouse'],
  },
  'game-theory': {
    purpose: 'Strategic interaction modeling with Nash equilibria',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} game theory strategic interaction incentives',
      '{situation} prisoner dilemma cooperation defection dynamics',
      '{situation} rational actor analysis payoff structure',
    ],
    methodologyTerms: ['Nash equilibrium', 'Fearon rationalist war', 'strategic interaction'],
    sourceHints: ['academic', 'rand'],
  },

  // ── INTELLIGENCE ───────────────────────────────────────────────────────
  'deep-search-agent': {
    purpose: 'Multi-agent deep research pipeline',
    timeWindow: 'realtime',
    queryPatterns: ['{situation} comprehensive research analysis'],
    methodologyTerms: ['deep research', 'multi-source intelligence'],
    sourceHints: ['reuters', 'expert-analysis', 'un', 'academic'],
  },
  'argus': {
    purpose: 'Deep web intelligence with source triangulation',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} intelligence analysis deep dive investigation',
      '{situation} open source intelligence OSINT findings',
      '{situation} verified facts cross-referenced sources',
    ],
    methodologyTerms: ['OSINT', 'source triangulation', 'intelligence analysis'],
    sourceHints: ['reuters', 'bbc', 'expert-analysis', 'academic'],
  },
  'media-compass': {
    purpose: 'Media bias and reliability spectrum analysis',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} media coverage bias analysis comparison',
      '{situation} news framing perspective different outlets',
      '{situation} media reliability fact-checking assessment',
    ],
    methodologyTerms: ['media bias', 'framing analysis', 'Ad Fontes reliability'],
    sourceHints: ['bbc', 'aljazeera', 'reuters', 'guardian', 'nyt'],
  },
  'media-roundup': {
    purpose: 'Daily media digest with narrative comparison',
    timeWindow: 'daily',
    queryPatterns: [
      '{situation} news coverage today media roundup',
      '{situation} headlines reactions international media past 24 hours',
      '{situation} press coverage editorial opinion analysis today',
    ],
    methodologyTerms: ['daily media digest', 'press review', 'narrative comparison'],
    sourceHints: ['reuters', 'bbc', 'aljazeera', 'guardian', 'ft'],
  },
  'sanctions': {
    purpose: 'Sanctions compliance monitoring',
    timeWindow: 'monthly',
    queryPatterns: [
      '{situation} sanctions list UN OFAC EU updates',
      '{situation} designated entities individuals sanctions regime',
      '{situation} sanctions evasion enforcement compliance',
    ],
    actorQueryPattern: '{actor} sanctions designation OFAC SDN list',
    methodologyTerms: ['sanctions compliance', 'designation criteria', 'enforcement'],
    sourceHints: ['statedept', 'un'],
  },
  'commitments': {
    purpose: 'Ceasefire and agreement compliance monitoring',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} ceasefire agreement compliance violations',
      '{situation} peace accord implementation status monitoring',
      '{situation} commitment tracker verified breaches',
    ],
    methodologyTerms: ['agreement compliance', 'ceasefire monitoring', 'implementation tracking'],
    sourceHints: ['un', 'source_linked_events', 'humanitarian_web'],
  },
  'treaty-analyzer': {
    purpose: 'Legal clause analysis and ambiguity detection',
    timeWindow: 'historical',
    queryPatterns: [
      '{situation} peace agreement treaty text legal analysis',
      '{situation} agreement clauses provisions ambiguities',
      '{situation} international law applicable legal framework',
    ],
    methodologyTerms: ['legal analysis', 'treaty interpretation', 'IHL'],
    sourceHints: ['un', 'academic'],
  },
  'alert-center': {
    purpose: 'Real-time anomaly detection and alert generation',
    timeWindow: 'realtime',
    queryPatterns: [
      '{situation} breaking news alert incident report',
      '{situation} sudden escalation violence spike anomaly',
      '{situation} emergency update critical development',
    ],
    methodologyTerms: ['anomaly detection', 'early warning alert', 'threshold monitoring'],
    sourceHints: ['reuters', 'bbc', 'grounded_search'],
  },
  'deep-research': {
    purpose: 'Google-grounded real-time research',
    timeWindow: 'realtime',
    queryPatterns: [
      '{situation} latest verified information analysis',
      '{situation} current state comprehensive research',
    ],
    methodologyTerms: ['grounded research', 'verified information'],
    sourceHints: ['reuters', 'expert-analysis', 'un'],
  },
  'geospatial-monitor': {
    purpose: 'Geographic event mapping and hotspot clustering',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} geographic distribution violence hotspots map',
      '{situation} conflict zones geographic spread movement',
      '{situation} regional spillover cross-border incidents',
    ],
    methodologyTerms: ['DBSCAN clustering', 'geographic spread index', 'hotspot analysis'],
    sourceHints: ['source_linked_events'],
  },
  'source-monitor': {
    purpose: 'Track and evaluate new intelligence sources',
    timeWindow: 'weekly',
    queryPatterns: [
      '{situation} new reports analysis publications this week',
      '{situation} research institute think tank new publication',
    ],
    methodologyTerms: ['source monitoring', 'publication tracking'],
    sourceHints: ['expert-analysis', 'chathamhouse', 'academic'],
  },
};

// ---------------------------------------------------------------------------
// Fast path: Template-based query generation (no AI call)
// ---------------------------------------------------------------------------

/**
 * Generate search queries using pre-defined templates.
 * Fast, no API call needed. Good for most cases.
 */
export function craftQueriesFromTemplate(ctx: QueryContext): CraftedQueries {
  const template = TOOL_QUERY_TEMPLATES[ctx.toolId];
  if (!template) {
    // Fallback for unknown tools
    return {
      primary: `${ctx.situationName} ${ctx.country} latest analysis`,
      focused: [],
      temporal: `${ctx.situationName} news today`,
      methodology: `${ctx.situationName} conflict analysis`,
      actorSpecific: ctx.actors.slice(0, 3).map((a) => `${a} ${ctx.country} role activities`),
      reasoning: 'Generic query — no template defined for this tool',
    };
  }

  const year = new Date().getFullYear();
  const vars: Record<string, string> = {
    '{situation}': ctx.situationName,
    '{country}': ctx.country || '',
    '{year}': String(year),
    '{actors}': ctx.actors.slice(0, 3).join(', '),
  };

  function fill(pattern: string): string {
    let result = pattern;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replaceAll(k, v);
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  const primary = fill(template.queryPatterns[0] ?? `${ctx.situationName} ${ctx.country}`);

  const focused = template.queryPatterns.slice(1).map(fill);

  // Temporal query based on time window
  const temporalSuffix =
    template.timeWindow === 'realtime' ? 'breaking news today' :
    template.timeWindow === 'daily' ? 'past 24 hours' :
    template.timeWindow === 'weekly' ? 'this week' :
    template.timeWindow === 'monthly' ? String(year) :
    'history chronology';
  const temporal = `${ctx.situationName} ${ctx.country} ${temporalSuffix}`;

  // Methodology query
  const methodology = template.methodologyTerms.length > 0
    ? `${ctx.situationName} ${template.methodologyTerms[0]} analysis`
    : `${ctx.situationName} ${ctx.country} analysis`;

  // Actor-specific queries
  const actorSpecific = ctx.actors.slice(0, 4).map((actor) =>
    template.actorQueryPattern
      ? fill(template.actorQueryPattern.replaceAll('{actor}', actor))
      : `${actor} ${ctx.situationName} ${ctx.country} role activities`
  );

  // Build reasoning
  const reasoning = `Tool "${ctx.toolId}" focuses on ${template.purpose}. ` +
    `Time window: ${template.timeWindow}. ` +
    `Methodology: ${template.methodologyTerms.join(', ') || 'general'}. ` +
    `Preferred sources: ${template.sourceHints.join(', ')}.`;

  return { primary, focused, temporal, methodology, actorSpecific, reasoning };
}

// ---------------------------------------------------------------------------
// AI-enhanced path: LLM crafts optimal queries (slower but smarter)
// ---------------------------------------------------------------------------

const CraftedQueriesSchema = z.object({
  primary: z.string().describe('Main search query — broad but precise'),
  focused: z.array(z.string()).describe('3 source-focused queries using site: operators'),
  temporal: z.string().describe('Time-sensitive query for recent events'),
  methodology: z.string().describe('Query targeting analytical framework data'),
  actorSpecific: z.array(z.string()).describe('Per-actor queries for key actors'),
  reasoning: z.string().describe('Brief explanation of query strategy'),
});

/**
 * Use AI to craft optimal search queries for a specific tool and context.
 * Slower than template-based, but produces more precise queries that
 * understand the intersection of tool methodology, situation dynamics,
 * and user analytical needs.
 */
export async function craftQueriesWithAI(ctx: QueryContext): Promise<CraftedQueries> {
  try {
    const template = TOOL_QUERY_TEMPLATES[ctx.toolId];
    const toolPurpose = template?.purpose ?? 'general conflict analysis';
    const methodologyTerms = template?.methodologyTerms?.join(', ') ?? 'conflict analysis';
    const sourceHints = template?.sourceHints ?? [];

    const { output } = await generateText({
      model: getModel(),
      output: Output.object({ schema: CraftedQueriesSchema }),
      prompt: `You are a search query intelligence system for a conflict analysis platform.

TASK: Craft precise, effective web search queries for the "${ctx.toolId}" tool.

TOOL PURPOSE: ${toolPurpose}
ANALYTICAL METHODOLOGY: ${methodologyTerms}
PREFERRED SOURCE TYPES: ${sourceHints.join(', ')}

SITUATION CONTEXT:
- Name: ${ctx.situationName}
- Country/Region: ${ctx.country || ctx.region || 'unspecified'}
- Key Actors: ${ctx.actors.join(', ') || 'unspecified'}
- Conflict Type: ${ctx.conflictType || 'unspecified'}
- Risk Score: ${ctx.riskScore ?? 'unassessed'}/10
- Glasl Stage: ${ctx.glaslStage ?? 'unassessed'}/9
- Escalation Trend: ${ctx.escalationTrend || 'unassessed'}
- Description: ${ctx.description?.slice(0, 500) || 'not provided'}

USER CONTEXT:
- Role: ${ctx.userRole || 'analyst'}
- Location: ${ctx.userLocation || 'unspecified'}
- Analytical Framework: ${ctx.analyticalFramework || 'INFORM Risk Index'}
- Favorite Sources: ${ctx.favoriteSources?.join(', ') || 'default'}

INSTRUCTIONS:
1. "primary" — A single broad search query that captures the core information need for this tool
2. "focused" — 3 queries using "site:" operators targeting the most relevant sources for this tool's methodology
3. "temporal" — A time-sensitive query (use "past 24 hours", "this week", etc. based on tool needs)
4. "methodology" — A query specifically targeting data needed for the analytical framework
5. "actorSpecific" — One query per key actor (max 4) relevant to this tool's purpose
6. "reasoning" — Brief explanation of your query strategy

Make queries specific, not generic. Use the conflict context to inform every query.
A media roundup needs "media coverage past 24 hours" not "conflict analysis".
A stakeholder map needs "power dynamics alliances" not "latest news".`,
    });

    if (!output) {
      return craftQueriesFromTemplate(ctx);
    }

    return output;
  } catch (err) {
    console.warn('[query-intelligence] AI crafting failed, using templates:', err);
    return craftQueriesFromTemplate(ctx);
  }
}

/**
 * Get the preferred source hints for a tool.
 * Used by the web research client to focus results.
 */
export function getToolSourceHints(toolId: string): string[] {
  return TOOL_QUERY_TEMPLATES[toolId]?.sourceHints ?? [];
}

/**
 * Get the time window for a tool.
 * Used to set the timeRange parameter in web research.
 */
export function getToolTimeWindow(toolId: string): 'day' | 'week' | 'month' | 'year' | 'all' {
  const tw = TOOL_QUERY_TEMPLATES[toolId]?.timeWindow;
  switch (tw) {
    case 'realtime': return 'day';
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'historical': return 'year';
    default: return 'month';
  }
}

/**
 * Get the full template for a tool (used by audit/documentation).
 */
export function getToolQueryTemplate(toolId: string): ToolQueryTemplate | null {
  return TOOL_QUERY_TEMPLATES[toolId] ?? null;
}

/**
 * Get all tool IDs that have query templates.
 */
export function getAllTemplatedToolIds(): string[] {
  return Object.keys(TOOL_QUERY_TEMPLATES);
}
