/**
 * Background Research Service — PRAXIS "Always Thinking" Engine
 *
 * Enables tools to trigger asynchronous research that fetches live data from
 * conflict intelligence feeds, synthesizes findings via AI, and persists
 * results to Firestore. Every tool can be pre-seeded with fresh intelligence
 * before the analyst even opens it.
 *
 * Flow:
 *   1. Accept ResearchRequest (uid, situationId, toolId, context)
 *   2. Fetch data from configured sources (ACLED, GDELT, ReliefWeb, etc.)
 *   3. Synthesize via generateText + Output.object with tool-specific schema
 *   4. Save results to Firestore via saveToolData
 *   5. Update dashboard-snapshot (seededTools, toolTimestamps)
 *   6. Track status at users/{uid}/situations/{situationId}/research-status/{toolId}
 */

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { getModel, getProModel } from '@/lib/ai/providers';
import { saveToolData, getToolData } from '@/lib/firebase/tool-data-service';
import { adminDb } from '@/lib/firebase/admin';
import { executeWebResearch, type WebResearchResult } from '@/lib/ai/web-research';

// --- Data feed imports ---
import { fetchEvents as acledFetchEvents } from '@/lib/data-feeds/acled-client';
import { searchArticles as gdeltSearchArticles } from '@/lib/data-feeds/gdelt-client';
import { searchReports as rwSearchReports } from '@/lib/data-feeds/reliefweb-client';
import { getDisplacement as hdxGetDisplacement, getFoodSecurity as hdxGetFoodSecurity, getFunding as hdxGetFunding, countryNameToIso3 } from '@/lib/data-feeds/hdx-client';
import { searchUNNews } from '@/lib/data-feeds/unnews-client';
import { getDisplacementStats as unhcrGetDisplacementStats } from '@/lib/data-feeds/unhcr-client';
import { getConflicts as ucdpGetConflicts } from '@/lib/data-feeds/ucdp-client';
import { getEconomicSnapshot as wbGetEconomicSnapshot, getGovernanceIndicators as wbGetGovernanceIndicators } from '@/lib/data-feeds/worldbank-client';
import { getCrisisWatch } from '@/lib/data-feeds/crisisgroup-client';
import { getArmsTransfers as sipriGetArmsTransfers } from '@/lib/data-feeds/sipri-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataSource =
  | 'acled' | 'gdelt' | 'reliefweb' | 'hdx' | 'unnews' | 'unhcr'
  | 'ucdp' | 'worldbank' | 'crisisgroup' | 'sipri'
  | 'firecrawl' | 'google-search';

export type ResearchStatus =
  | 'pending' | 'fetching-sources' | 'synthesizing' | 'saving' | 'complete' | 'failed';

export interface ToolResearchConfig {
  sources: DataSource[];
  aiModel: 'flash' | 'pro';
  synthesisPrompt: string;
  schema: z.ZodType;
  creditCost: number;
}

export interface ResearchRequest {
  uid: string;
  situationId: string;
  toolId: string;
  situationName: string;
  country: string;
  actors: string[];
  researchConfig: ToolResearchConfig;
}

export interface ResearchProgress {
  status: ResearchStatus;
  toolId: string;
  sourcesQueried: number;
  sourcesTotal: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[background-research]';

function log(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`${LOG_PREFIX} ${msg}`, meta ? JSON.stringify(meta) : '');
}

// ---------------------------------------------------------------------------
// Status persistence
// ---------------------------------------------------------------------------

function statusRef(uid: string, situationId: string, toolId: string) {
  if (!adminDb) throw new Error('Firebase Admin SDK not initialized');
  return adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('research-status').doc(toolId);
}

async function saveStatus(uid: string, situationId: string, progress: ResearchProgress): Promise<void> {
  try {
    const ref = statusRef(uid, situationId, progress.toolId);
    await ref.set(progress, { merge: true });
  } catch (err) {
    log('error', 'Failed to save research status', { toolId: progress.toolId, err: String(err) });
  }
}

export async function getResearchStatus(
  uid: string,
  situationId: string,
  toolId: string
): Promise<ResearchProgress | null> {
  try {
    const ref = statusRef(uid, situationId, toolId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return snap.data() as ResearchProgress;
  } catch (err) {
    log('error', 'Failed to get research status', { toolId, err: String(err) });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Data source fetcher
// ---------------------------------------------------------------------------

interface SourceResult {
  source: DataSource;
  data: unknown;
  ok: boolean;
  error?: string;
}

async function fetchSource(
  source: DataSource,
  country: string,
  actors: string[],
  situationName: string
): Promise<SourceResult> {
  const query = `${situationName} ${country}`;
  const iso3 = countryNameToIso3(country);
  // World Bank uses ISO2 — derive a rough 2-letter code from the country name
  const iso2 = country.length === 2 ? country : country.slice(0, 2).toUpperCase();

  try {
    switch (source) {
      case 'acled': {
        const events = await acledFetchEvents({ country, limit: 100 });
        return { source, data: events, ok: true };
      }
      case 'gdelt': {
        const articles = await gdeltSearchArticles({ query, timespan: '30d', maxRecords: 50 });
        return { source, data: articles, ok: true };
      }
      case 'reliefweb': {
        const reports = await rwSearchReports({ country, limit: 20 });
        return { source, data: reports, ok: true };
      }
      case 'hdx': {
        if (!iso3) return { source, data: null, ok: false, error: `No ISO3 mapping for ${country}` };
        const [displacement, foodSecurity, funding] = await Promise.allSettled([
          hdxGetDisplacement(iso3),
          hdxGetFoodSecurity(iso3),
          hdxGetFunding(iso3),
        ]);
        return {
          source,
          data: {
            displacement: displacement.status === 'fulfilled' ? displacement.value : null,
            foodSecurity: foodSecurity.status === 'fulfilled' ? foodSecurity.value : null,
            funding: funding.status === 'fulfilled' ? funding.value : null,
          },
          ok: true,
        };
      }
      case 'unnews': {
        const news = await searchUNNews(query, 10);
        return { source, data: news, ok: true };
      }
      case 'unhcr': {
        if (!iso3) return { source, data: null, ok: false, error: `No ISO3 mapping for ${country}` };
        const stats = await unhcrGetDisplacementStats(iso3);
        return { source, data: stats, ok: true };
      }
      case 'ucdp': {
        const conflicts = await ucdpGetConflicts(country);
        return { source, data: conflicts, ok: true };
      }
      case 'worldbank': {
        const [economic, governance] = await Promise.allSettled([
          wbGetEconomicSnapshot(iso2),
          wbGetGovernanceIndicators(iso2),
        ]);
        return {
          source,
          data: {
            economic: economic.status === 'fulfilled' ? economic.value : null,
            governance: governance.status === 'fulfilled' ? governance.value : null,
          },
          ok: true,
        };
      }
      case 'crisisgroup': {
        const entry = await getCrisisWatch(country);
        return { source, data: entry, ok: true };
      }
      case 'sipri': {
        const transfers = await sipriGetArmsTransfers(country);
        return { source, data: transfers, ok: true };
      }
      case 'firecrawl':
      case 'google-search': {
        // These are invoked through AI tool calls, not direct fetch
        return { source, data: null, ok: true };
      }
      default:
        return { source, data: null, ok: false, error: `Unknown source: ${source}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('warn', `Source ${source} failed for ${country}`, { error: message });
    return { source, data: null, ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Research context builder
// ---------------------------------------------------------------------------

function buildResearchContext(results: SourceResult[], situationName: string, country: string, actors: string[]): string {
  const sections: string[] = [
    `# Research Context: ${situationName}`,
    `Country: ${country}`,
    `Key Actors: ${actors.join(', ')}`,
    `Data collected at: ${new Date().toISOString()}`,
    '',
  ];

  for (const r of results) {
    if (!r.ok || r.data === null || r.data === undefined) continue;

    sections.push(`## Source: ${r.source.toUpperCase()}`);

    // Serialize data, truncating to avoid token overflow
    const serialized = JSON.stringify(r.data, null, 1);
    const truncated = serialized.length > 12000
      ? serialized.slice(0, 12000) + '\n... [truncated]'
      : serialized;

    sections.push(truncated);
    sections.push('');
  }

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// Dashboard snapshot updater
// ---------------------------------------------------------------------------

async function updateDashboardSnapshot(uid: string, situationId: string, toolId: string): Promise<void> {
  try {
    const existing = await getToolData(uid, situationId, 'dashboard-snapshot');
    const snapshot = (existing?.data as Record<string, unknown>) ?? {};
    const seededTools = [...new Set([
      ...((snapshot.seededTools as string[]) ?? []),
      toolId,
    ])];
    const toolTimestamps = {
      ...((snapshot.toolTimestamps as Record<string, string>) ?? {}),
      [toolId]: new Date().toISOString(),
    };
    await saveToolData(uid, situationId, 'dashboard-snapshot', {
      ...snapshot,
      seededTools,
      toolTimestamps,
    });
  } catch (err) {
    log('error', 'Failed to update dashboard-snapshot', { toolId, err: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

export async function executeBackgroundResearch(request: ResearchRequest): Promise<ResearchProgress> {
  const { uid, situationId, toolId, situationName, country, actors, researchConfig } = request;
  const startedAt = new Date().toISOString();

  // Total sources = web research (1) + configured data feeds
  const dataFeedSources = researchConfig.sources.filter(
    (s) => s !== 'google-search' && s !== 'firecrawl'
  );
  const totalSources = 1 + dataFeedSources.length; // 1 for web research (Google + premium)

  const progress: ResearchProgress = {
    status: 'pending',
    toolId,
    sourcesQueried: 0,
    sourcesTotal: totalSources,
    startedAt,
  };

  // 1. Save initial status
  await saveStatus(uid, situationId, progress);

  try {
    // ── Phase 1: Web Research (Google Search first, then Tavily/Parallel in parallel) ──
    progress.status = 'fetching-sources';
    await saveStatus(uid, situationId, progress);

    log('info', `Starting research for ${toolId}`, {
      situationId,
      dataFeeds: dataFeedSources,
      country,
    });

    // Build a search query tailored to this tool
    const toolSearchQuery = `${researchConfig.synthesisPrompt.split('.')[0]} ${situationName} ${country}`.slice(0, 200);

    // Load user preferences for favorite sources (stored in Firestore)
    let favoriteSources: string[] = [];
    try {
      if (adminDb) {
        const prefsSnap = await adminDb
          .collection('users').doc(uid)
          .collection('settings').doc('preferences')
          .get();
        if (prefsSnap.exists) {
          const prefs = prefsSnap.data();
          favoriteSources = (prefs?.favoriteSources as string[]) ?? [];
        }
      }
    } catch {
      // Non-critical — proceed without favorites
    }

    // Execute unified web research with AI-crafted queries per tool + methodology
    let webResults: WebResearchResult[] = [];
    try {
      webResults = await executeWebResearch(
        toolSearchQuery,
        situationName,
        uid,
        {
          maxResults: 8,
          favoriteSources,
          region: country,
          toolId,             // Enables query intelligence per tool
          actors,             // Actor-specific queries
          description: `${researchConfig.synthesisPrompt.split('.')[0]}. Situation: ${situationName}, Country: ${country}`,
        }
      );
      progress.sourcesQueried++;
      log('info', `Web research returned ${webResults.length} results for ${toolId}`);
    } catch (err) {
      log('warn', `Web research failed for ${toolId}`, { error: String(err) });
    }

    await saveStatus(uid, situationId, progress);

    // ── Phase 2: Data feed sources in parallel ──
    const sourceResults = await Promise.allSettled(
      dataFeedSources.map((source) => fetchSource(source, country, actors, situationName))
    );

    const feedResults: SourceResult[] = sourceResults.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { source: dataFeedSources[i], data: null, ok: false, error: r.reason?.message ?? 'Unknown error' }
    );

    progress.sourcesQueried += feedResults.filter((r) => r.ok).length;
    await saveStatus(uid, situationId, progress);

    log('info', `Fetched ${progress.sourcesQueried}/${progress.sourcesTotal} sources for ${toolId}`);

    // ── Phase 3: Build context and synthesize via AI ──
    progress.status = 'synthesizing';
    await saveStatus(uid, situationId, progress);

    // Build context from web research results
    const webContext = webResults.length > 0
      ? [
          '## WEB RESEARCH (Google Search + Premium Providers)',
          ...webResults.map((r) =>
            `### ${r.title} (${r.source}, reliability: ${r.reliabilityScore.toFixed(2)})\n${r.content.slice(0, 3000)}`
          ),
          '',
        ].join('\n')
      : '';

    // Build context from data feed results
    const feedContext = buildResearchContext(feedResults, situationName, country, actors);

    // Combine: web research first (most recent), then data feeds (structured)
    const fullContext = `${webContext}\n${feedContext}`;

    const model = researchConfig.aiModel === 'pro' ? getProModel() : getModel();

    const providerList = webResults.length > 0
      ? [...new Set(webResults.map((r) => r.provider))].join(', ')
      : 'none';

    const { output } = await generateText({
      model,
      prompt: `${researchConfig.synthesisPrompt}

IMPORTANT: The following research data combines live web search results (Google Search${providerList !== 'none' ? `, ${providerList}` : ''}) with structured data feeds. Web results are the most current. Cross-reference web findings with structured data for triangulated facts.

${fullContext}`,
      output: Output.object({ schema: researchConfig.schema }),
    });

    const synthesized = output;

    if (!synthesized) {
      throw new Error('AI synthesis returned no structured output');
    }

    // ── Phase 4: Save results ──
    progress.status = 'saving';
    await saveStatus(uid, situationId, progress);

    const webSourceNames = webResults.map((r) => r.source);
    const feedSourceNames = feedResults.filter((r) => r.ok).map((r) => r.source);

    await saveToolData(uid, situationId, toolId, {
      ...synthesized,
      _meta: {
        generatedBy: 'background-research',
        model: researchConfig.aiModel,
        sourcesQueried: progress.sourcesQueried,
        sourcesTotal: progress.sourcesTotal,
        webSources: webSourceNames,
        dataFeeds: feedSourceNames,
        providers: [...new Set(webResults.map((r) => r.provider))],
        startedAt,
        completedAt: new Date().toISOString(),
      },
    });

    // 5. Update dashboard snapshot
    await updateDashboardSnapshot(uid, situationId, toolId);

    // 6. Final status
    progress.status = 'complete';
    progress.completedAt = new Date().toISOString();
    await saveStatus(uid, situationId, progress);

    log('info', `Research complete for ${toolId}`, {
      sourcesQueried: progress.sourcesQueried,
      webResults: webResults.length,
      durationMs: Date.now() - new Date(startedAt).getTime(),
    });

    return progress;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    progress.status = 'failed';
    progress.error = message;
    progress.completedAt = new Date().toISOString();
    await saveStatus(uid, situationId, progress);

    log('error', `Research failed for ${toolId}`, { error: message, situationId });
    return progress;
  }
}

// ---------------------------------------------------------------------------
// Config accessor
// ---------------------------------------------------------------------------

export function getToolResearchConfig(toolId: string): ToolResearchConfig | null {
  return TOOL_RESEARCH_CONFIGS[toolId] ?? null;
}

// ---------------------------------------------------------------------------
// Shared Zod schemas for tool outputs
// ---------------------------------------------------------------------------

const riskItemSchema = z.object({
  category: z.string(),
  level: z.enum(['critical', 'high', 'moderate', 'low']),
  score: z.number().min(0).max(10),
  trend: z.enum(['escalating', 'stable', 'de-escalating']),
  description: z.string(),
  indicators: z.array(z.string()),
  sources: z.array(z.string()),
});

const actorProfileSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  interests: z.array(z.string()),
  capabilities: z.array(z.string()),
  relationships: z.array(z.object({ target: z.string(), type: z.string(), description: z.string() })),
  spoilerPotential: z.enum(['high', 'moderate', 'low', 'none']),
  salience: z.object({ power: z.number(), legitimacy: z.number(), urgency: z.number() }),
});

const eventSchema = z.object({
  date: z.string(),
  title: z.string(),
  type: z.string(),
  description: z.string(),
  actors: z.array(z.string()),
  significance: z.enum(['critical', 'high', 'moderate', 'low']),
  source: z.string(),
});

// ---------------------------------------------------------------------------
// TOOL_RESEARCH_CONFIGS — one config per tool (workspace tools excluded)
// ---------------------------------------------------------------------------

export const TOOL_RESEARCH_CONFIGS: Record<string, ToolResearchConfig> = {

  // =========================================================================
  // CONTEXT
  // =========================================================================

  'dashboard': {
    sources: ['acled', 'gdelt', 'reliefweb', 'ucdp', 'crisisgroup'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS conflict intelligence analyst. Synthesize the provided data into a concise dashboard overview for a UN Political Affairs Officer.

Include:
- Overall situation status and trajectory
- Key recent events (last 30 days)
- Risk level summary (INFORM Risk Index methodology: hazard, vulnerability, coping capacity)
- Active conflict dynamics and Glasl escalation stage estimate
- Top 3 developments requiring attention

Be precise, cite specific data points, and use diplomatic language.`,
    schema: z.object({
      situationStatus: z.enum(['critical', 'deteriorating', 'unstable', 'stable', 'improving']),
      glaslStage: z.number().min(1).max(9),
      glaslLabel: z.string(),
      riskLevel: z.enum(['very-high', 'high', 'medium', 'low']),
      riskScore: z.number().min(0).max(10),
      keyDevelopments: z.array(z.object({ title: z.string(), date: z.string(), significance: z.string() })),
      conflictDynamics: z.string(),
      trajectory: z.string(),
      attentionItems: z.array(z.string()),
      recentEventsCount: z.number(),
      recentFatalities: z.number(),
      dataFreshness: z.string(),
    }),
  },

  'documents': {
    sources: ['reliefweb', 'unnews'],
    aiModel: 'flash',
    creditCost: 1,
    synthesisPrompt: `You are a PRAXIS document intelligence analyst. From the provided reports and news items, compile a curated reading list of the most relevant documents for a conflict analyst.

For each document, assess its relevance, reliability, and key takeaway. Group by type: situation reports, analysis, policy documents, and news coverage.`,
    schema: z.object({
      documents: z.array(z.object({
        title: z.string(),
        source: z.string(),
        date: z.string(),
        url: z.string(),
        type: z.enum(['situation-report', 'analysis', 'policy', 'news', 'assessment']),
        relevance: z.enum(['high', 'medium', 'low']),
        keyTakeaway: z.string(),
      })),
      summary: z.string(),
      totalFound: z.number(),
    }),
  },

  'sources-library': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews', 'crisisgroup'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS source intelligence curator. Evaluate and catalog all available intelligence sources for this conflict situation.

For each source, assess: availability, reliability tier (A-F per NATO STANAG 2022), coverage quality, update frequency, and key data types provided. Identify coverage gaps and recommend supplementary sources.`,
    schema: z.object({
      sources: z.array(z.object({
        name: z.string(),
        type: z.enum(['open-data', 'news', 'academic', 'ngo', 'government', 'international-org']),
        reliabilityTier: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
        coverage: z.string(),
        updateFrequency: z.string(),
        dataTypes: z.array(z.string()),
        status: z.enum(['active', 'limited', 'unavailable']),
      })),
      coverageGaps: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
  },

  'timeline': {
    sources: ['acled', 'gdelt', 'ucdp', 'unnews', 'reliefweb'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS timeline analyst. Construct a chronological sequence of significant events from all provided data sources.

Apply Glasl's escalation model to identify escalation/de-escalation transitions. Mark turning points, diplomatic milestones, and violence spikes. Each event should include actors involved, event type, and strategic significance.`,
    schema: z.object({
      events: z.array(eventSchema),
      escalationPhases: z.array(z.object({
        startDate: z.string(),
        endDate: z.string(),
        glaslStage: z.number().min(1).max(9),
        label: z.string(),
        description: z.string(),
      })),
      turningPoints: z.array(z.object({ date: z.string(), event: z.string(), significance: z.string() })),
    }),
  },

  'humanitarian': {
    sources: ['hdx', 'unhcr', 'reliefweb', 'unnews', 'worldbank'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS humanitarian analyst. Synthesize all humanitarian data using OCHA assessment methodology and IPC Food Security classification.

Cover: displacement figures (IDPs, refugees, returnees), food security (IPC phases), funding gaps, protection concerns, access constraints, and humanitarian response status. Reference specific data points from HDX, UNHCR, and ReliefWeb.`,
    schema: z.object({
      displacementSummary: z.object({
        totalDisplaced: z.number(),
        idps: z.number(),
        refugees: z.number(),
        returnees: z.number(),
        trend: z.enum(['increasing', 'stable', 'decreasing']),
        source: z.string(),
      }),
      foodSecurity: z.object({
        ipcPhase: z.number().min(1).max(5).nullable(),
        populationAffected: z.number().nullable(),
        description: z.string(),
      }),
      funding: z.object({
        required: z.number().nullable(),
        received: z.number().nullable(),
        gapPercent: z.number().nullable(),
        year: z.number(),
      }),
      protectionConcerns: z.array(z.string()),
      accessConstraints: z.array(z.string()),
      keyFindings: z.array(z.string()),
      severity: z.enum(['catastrophic', 'critical', 'severe', 'moderate', 'minor']),
    }),
  },

  'calendar': {
    sources: ['gdelt', 'unnews', 'reliefweb'],
    aiModel: 'flash',
    creditCost: 1,
    synthesisPrompt: `You are a PRAXIS calendar intelligence analyst. Identify upcoming events, deadlines, and milestones relevant to the conflict situation.

Include: scheduled elections, ceasefire deadlines, UN sessions, diplomatic meetings, humanitarian response deadlines, seasonal factors (planting/harvest, monsoon, dry season offensives), and anniversary dates of significant events.`,
    schema: z.object({
      upcomingEvents: z.array(z.object({
        date: z.string(),
        title: z.string(),
        type: z.enum(['diplomatic', 'electoral', 'military', 'humanitarian', 'economic', 'seasonal', 'anniversary']),
        description: z.string(),
        significance: z.enum(['critical', 'high', 'moderate', 'low']),
        confirmed: z.boolean(),
      })),
      monthlyOutlook: z.string(),
    }),
  },

  // =========================================================================
  // ANALYSIS
  // =========================================================================

  'risk-monitor': {
    sources: ['acled', 'gdelt', 'worldbank', 'crisisgroup', 'ucdp'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS risk analyst. Produce a comprehensive risk assessment using the INFORM Risk Index framework.

Structure your analysis across three INFORM dimensions:
1. HAZARD: conflict intensity (ACLED/UCDP data), natural disasters, epidemic risk
2. VULNERABILITY: socioeconomic (World Bank), displaced populations, food insecurity
3. LACK OF COPING CAPACITY: governance indicators, infrastructure, institutional resilience

For each risk category, provide a 0-10 score, trend direction, key indicators, and specific data evidence. Identify the top 3 risks requiring immediate attention.`,
    schema: z.object({
      overallRiskScore: z.number().min(0).max(10),
      overallRiskLevel: z.enum(['very-high', 'high', 'medium', 'low']),
      trend: z.enum(['escalating', 'stable', 'de-escalating']),
      hazard: z.object({ score: z.number(), components: z.array(riskItemSchema) }),
      vulnerability: z.object({ score: z.number(), components: z.array(riskItemSchema) }),
      copingCapacity: z.object({ score: z.number(), components: z.array(riskItemSchema) }),
      topRisks: z.array(riskItemSchema),
      outlook: z.string(),
      recommendations: z.array(z.string()),
    }),
  },

  'early-warning': {
    sources: ['acled', 'gdelt', 'ucdp', 'crisisgroup', 'reliefweb'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS early warning analyst. Apply Glasl's 9-stage escalation model to assess the current escalation trajectory.

Analyze:
- Current Glasl stage (1-9) with evidence from recent events
- Escalation indicators: rhetoric intensity (GDELT tone), violence frequency (ACLED), troop movements, diplomatic breakdown signals
- De-escalation indicators: ceasefire signals, diplomatic engagement, third-party mediation
- 30/60/90-day risk projection with confidence levels
- Tripwire indicators that would signal imminent escalation

Cross-reference ACLED event trends, GDELT media tone, UCDP conflict data, and Crisis Group assessments.`,
    schema: z.object({
      currentGlaslStage: z.number().min(1).max(9),
      glaslLabel: z.string(),
      glaslEvidence: z.array(z.string()),
      escalationIndicators: z.array(z.object({
        indicator: z.string(),
        status: z.enum(['triggered', 'elevated', 'normal']),
        evidence: z.string(),
        source: z.string(),
      })),
      deEscalationIndicators: z.array(z.object({
        indicator: z.string(),
        status: z.enum(['present', 'weak', 'absent']),
        evidence: z.string(),
      })),
      projections: z.array(z.object({
        timeframe: z.string(),
        scenario: z.string(),
        probability: z.enum(['high', 'moderate', 'low']),
        description: z.string(),
      })),
      tripwires: z.array(z.object({ indicator: z.string(), threshold: z.string(), currentValue: z.string() })),
      overallAssessment: z.string(),
    }),
  },

  'actor-profiles': {
    sources: ['acled', 'gdelt', 'reliefweb', 'crisisgroup', 'ucdp'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS actor intelligence analyst. Build comprehensive profiles of all significant conflict actors using Stedman's spoiler theory and Mitchell-Agle-Wood salience model.

For each actor, analyze:
- Classification: state, armed group, non-state, civil society, international org
- Spoiler typology (Stedman): total, limited, or greedy spoiler — or non-spoiler
- Salience (Mitchell-Agle-Wood): power (1-10), legitimacy (1-10), urgency (1-10)
- Interests: stated vs. unstated (Fisher-Ury framework)
- Capabilities and resources
- Key relationships: allies, adversaries, patrons
- Recent actions from ACLED/GDELT data

Identify at minimum the top 8 actors, including armed groups, government forces, and international actors.`,
    schema: z.object({
      actors: z.array(actorProfileSchema),
      keyRelationships: z.array(z.object({
        actor1: z.string(),
        actor2: z.string(),
        type: z.enum(['allied', 'adversarial', 'patron-client', 'competitive', 'neutral']),
        description: z.string(),
      })),
      spoilerAssessment: z.string(),
      powerDynamicsSummary: z.string(),
    }),
  },

  'stakeholder-map': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'reliefweb'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS stakeholder mapping analyst. Map the conflict's stakeholder landscape using Lederach's multi-level pyramid (Track I/II/III) and Barnett-Duvall power taxonomy.

For each stakeholder:
- Level: Track I (top leadership), Track II (middle-range), Track III (grassroots)
- Power type (Barnett-Duvall): compulsory, institutional, structural, productive
- Influence score (1-10) and position on the conflict (support, oppose, neutral, mediator)
- Leverage points and engagement recommendations

Map relationships between stakeholders and identify potential coalition formations.`,
    schema: z.object({
      stakeholders: z.array(z.object({
        name: z.string(),
        track: z.enum(['I', 'II', 'III']),
        powerType: z.string(),
        influence: z.number().min(1).max(10),
        position: z.enum(['support-peace', 'oppose-peace', 'neutral', 'mediator', 'spoiler']),
        leveragePoints: z.array(z.string()),
        engagementRecommendation: z.string(),
      })),
      coalitions: z.array(z.object({ name: z.string(), members: z.array(z.string()), objective: z.string() })),
      summary: z.string(),
    }),
  },

  'compare': {
    sources: ['acled', 'ucdp', 'worldbank', 'hdx'],
    aiModel: 'flash',
    creditCost: 3,
    synthesisPrompt: `You are a PRAXIS comparative analysis specialist. Gather baseline data for the current conflict that can be compared against historical parallels and other active conflicts.

Provide: conflict intensity metrics, economic indicators, displacement data, governance scores, and conflict duration/phase. Structure data so it can be placed side-by-side with other situations.`,
    schema: z.object({
      metrics: z.object({
        conflictIntensity: z.number().min(0).max(10),
        fatalities30d: z.number(),
        displacedPopulation: z.number(),
        gdpPerCapita: z.number().nullable(),
        governanceScore: z.number().nullable(),
        conflictDurationYears: z.number(),
        glaslStage: z.number().min(1).max(9),
      }),
      comparableConflicts: z.array(z.object({
        name: z.string(),
        similarity: z.string(),
        outcome: z.string(),
        lessonLearned: z.string(),
      })),
      summary: z.string(),
    }),
  },

  'info-environment': {
    sources: ['gdelt', 'unnews', 'crisisgroup'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS information environment analyst. Map the information landscape surrounding this conflict using Galtung's cultural violence framework and media narrative analysis.

Analyze:
- Dominant narratives: who controls them, what framing is used, and how they perpetuate or challenge structural/cultural violence
- Media volume and tone trends (GDELT data)
- Disinformation and propaganda indicators
- Information asymmetries between parties
- Social media dynamics and amplification patterns
- Source diversity: whose voices are heard vs. marginalized

Rate source reliability using NATO STANAG 2022 tiers.`,
    schema: z.object({
      dominantNarratives: z.array(z.object({
        narrative: z.string(),
        promotedBy: z.array(z.string()),
        framing: z.string(),
        reach: z.enum(['dominant', 'significant', 'emerging', 'marginal']),
        reliabilityTier: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
      })),
      mediaTrends: z.object({
        volume: z.enum(['spike', 'elevated', 'normal', 'declining']),
        averageTone: z.number(),
        sentiment: z.enum(['positive', 'neutral', 'negative']),
        topSourceCountries: z.array(z.string()),
      }),
      disinformationRisks: z.array(z.object({ description: z.string(), severity: z.enum(['high', 'moderate', 'low']) })),
      informationGaps: z.array(z.string()),
      assessment: z.string(),
    }),
  },

  'power-map': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'sipri', 'worldbank'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS power dynamics analyst. Map the power structure of this conflict using Barnett-Duvall's taxonomy of power (compulsory, institutional, structural, productive).

For each significant actor, assess their power across all four dimensions. Include: military capability (ACLED + SIPRI), economic leverage (World Bank), institutional influence, and narrative/discursive power (GDELT).

Identify power asymmetries, balancing dynamics, and potential leverage points for mediation.`,
    schema: z.object({
      actors: z.array(z.object({
        name: z.string(),
        compulsoryPower: z.number().min(0).max(10),
        institutionalPower: z.number().min(0).max(10),
        structuralPower: z.number().min(0).max(10),
        productivePower: z.number().min(0).max(10),
        overallPower: z.number().min(0).max(10),
        keySources: z.array(z.string()),
      })),
      asymmetries: z.array(z.object({ description: z.string(), actors: z.array(z.string()), dimension: z.string() })),
      leveragePoints: z.array(z.string()),
      summary: z.string(),
    }),
  },

  // =========================================================================
  // DRAFTING
  // =========================================================================

  'assistant': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews'],
    aiModel: 'flash',
    creditCost: 1,
    synthesisPrompt: `You are a PRAXIS research assistant. Compile a brief contextual summary that can serve as background for an AI chat assistant helping a conflict analyst.

Include: current situation overview, recent key events, active actors, and unresolved questions. Keep it concise (under 500 words) so it can be injected as system context.`,
    schema: z.object({
      situationBrief: z.string(),
      recentEvents: z.array(z.object({ date: z.string(), event: z.string() })),
      activeActors: z.array(z.string()),
      openQuestions: z.array(z.string()),
      lastUpdated: z.string(),
    }),
  },

  'report-studio': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews', 'hdx', 'ucdp'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS report drafting assistant. Prepare a structured intelligence report foundation following UN DPPA briefing note format.

Include: executive summary, background, current situation, conflict dynamics, humanitarian impact, risk assessment, and recommendations. Each section should cite specific data from the provided sources. This will serve as a starting template that analysts can refine.`,
    schema: z.object({
      title: z.string(),
      executiveSummary: z.string(),
      sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
        sources: z.array(z.string()),
      })),
      recommendations: z.array(z.object({ recommendation: z.string(), priority: z.enum(['immediate', 'short-term', 'medium-term']) })),
      dataSources: z.array(z.string()),
    }),
  },

  'dossier': {
    sources: ['acled', 'gdelt', 'reliefweb', 'crisisgroup', 'ucdp', 'worldbank', 'unhcr'],
    aiModel: 'pro',
    creditCost: 6,
    synthesisPrompt: `You are a PRAXIS dossier compiler. Produce a comprehensive situation dossier suitable for a senior UN official or ambassador briefing.

Structure: country profile, conflict origins and evolution, current dynamics, actor landscape, humanitarian situation, economic context, international engagement, and strategic outlook. Reference all available data sources with specificity.`,
    schema: z.object({
      title: z.string(),
      classification: z.string(),
      countryProfile: z.object({ population: z.string(), gdpPerCapita: z.string(), governanceScore: z.string(), fragility: z.string() }),
      conflictOverview: z.string(),
      currentDynamics: z.string(),
      actorLandscape: z.array(z.object({ name: z.string(), role: z.string(), assessment: z.string() })),
      humanitarianSituation: z.string(),
      economicContext: z.string(),
      internationalEngagement: z.string(),
      strategicOutlook: z.string(),
      keyDates: z.array(z.object({ date: z.string(), event: z.string() })),
    }),
  },

  'talking-points': {
    sources: ['acled', 'gdelt', 'unnews', 'reliefweb', 'crisisgroup'],
    aiModel: 'pro',
    creditCost: 3,
    synthesisPrompt: `You are a PRAXIS diplomatic communications specialist. Draft talking points for a senior UN official or diplomat on this conflict situation.

Structure: key messages (3-5 concise points), supporting data, anticipated questions with suggested responses, red lines and sensitivities, and diplomatic language recommendations. Follow UN DPPA briefing conventions.`,
    schema: z.object({
      keyMessages: z.array(z.object({ message: z.string(), supportingData: z.string() })),
      anticipatedQuestions: z.array(z.object({ question: z.string(), suggestedResponse: z.string() })),
      sensitivities: z.array(z.string()),
      languageGuidance: z.array(z.object({ avoid: z.string(), prefer: z.string(), reason: z.string() })),
      context: z.string(),
    }),
  },

  'briefing': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews', 'crisisgroup'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS briefing room analyst. Prepare a structured oral briefing outline following UN DPPA briefing format.

Include: situation update (what changed), analysis (why it matters), options (what can be done), and recommendation. Each section should have bullet points with data citations. Flag items requiring decision-maker attention.`,
    schema: z.object({
      title: z.string(),
      date: z.string(),
      situationUpdate: z.array(z.object({ point: z.string(), source: z.string() })),
      analysis: z.array(z.object({ point: z.string(), significance: z.string() })),
      options: z.array(z.object({ option: z.string(), pros: z.array(z.string()), cons: z.array(z.string()) })),
      recommendation: z.string(),
      decisionItems: z.array(z.string()),
    }),
  },

  'auto-briefing': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS automated briefing generator. Produce a concise daily intelligence summary covering the last 24-48 hours.

Format: lead headline, 3-5 key developments with sources, risk level update, and items requiring attention. Prioritize actionable intelligence over background context.`,
    schema: z.object({
      headline: z.string(),
      date: z.string(),
      riskLevel: z.enum(['critical', 'high', 'elevated', 'moderate', 'low']),
      developments: z.array(z.object({ title: z.string(), summary: z.string(), source: z.string(), priority: z.enum(['urgent', 'important', 'routine']) })),
      attentionItems: z.array(z.string()),
      dataTimestamp: z.string(),
    }),
  },

  'un-toolkit': {
    sources: ['unnews', 'reliefweb', 'gdelt'],
    aiModel: 'pro',
    creditCost: 3,
    synthesisPrompt: `You are a PRAXIS UN policy specialist. Compile relevant UN framework references, resolutions, and institutional tools applicable to this conflict.

Include: applicable Security Council resolutions, General Assembly mandates, relevant Special Envoy / Special Representative roles, applicable international humanitarian law (IHL) provisions, human rights instruments, and recommended UN coordination mechanisms.`,
    schema: z.object({
      applicableResolutions: z.array(z.object({ reference: z.string(), title: z.string(), relevance: z.string() })),
      mandates: z.array(z.object({ body: z.string(), mandate: z.string(), status: z.string() })),
      legalFrameworks: z.array(z.object({ instrument: z.string(), applicability: z.string() })),
      coordinationMechanisms: z.array(z.object({ mechanism: z.string(), description: z.string(), relevance: z.string() })),
      recommendations: z.array(z.string()),
    }),
  },

  'policy-memo': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'worldbank', 'unnews'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS policy analyst. Draft a policy memorandum using Putnam's two-level game theory framework.

Analyze: domestic constraints and win-sets for each party, international leverage and pressure points, policy options with cost-benefit analysis, and sequencing recommendations. Reference specific data from ACLED, Crisis Group, and World Bank indicators.`,
    schema: z.object({
      title: z.string(),
      addressedTo: z.string(),
      executiveSummary: z.string(),
      domesticConstraints: z.array(z.object({ party: z.string(), constraints: z.array(z.string()), winSet: z.string() })),
      internationalDimension: z.object({ leveragePoints: z.array(z.string()), pressurePoints: z.array(z.string()) }),
      policyOptions: z.array(z.object({
        option: z.string(),
        description: z.string(),
        benefits: z.array(z.string()),
        risks: z.array(z.string()),
        feasibility: z.enum(['high', 'moderate', 'low']),
      })),
      recommendation: z.string(),
      sequencing: z.array(z.object({ phase: z.string(), action: z.string(), timeline: z.string() })),
    }),
  },

  // =========================================================================
  // SIMULATION
  // =========================================================================

  'scenarios': {
    sources: ['acled', 'gdelt', 'ucdp', 'crisisgroup', 'worldbank'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS scenario planning analyst. Using Glasl's escalation model and current data, construct three plausible scenarios for the next 90 days: escalation, status quo, and de-escalation.

For each scenario:
- Trigger conditions and early indicators
- Actor behavior changes
- Humanitarian impact projections
- International response likely
- Probability estimate with confidence level

Ground scenarios in specific data trends from ACLED, UCDP, and Crisis Group assessments.`,
    schema: z.object({
      scenarios: z.array(z.object({
        name: z.string(),
        type: z.enum(['escalation', 'status-quo', 'de-escalation', 'wild-card']),
        probability: z.number().min(0).max(100),
        confidence: z.enum(['high', 'moderate', 'low']),
        description: z.string(),
        triggers: z.array(z.string()),
        earlyIndicators: z.array(z.string()),
        actorBehavior: z.array(z.object({ actor: z.string(), likelyAction: z.string() })),
        humanitarianImpact: z.string(),
        internationalResponse: z.string(),
      })),
      wildCard: z.object({ description: z.string(), probability: z.number(), impact: z.string() }),
      methodology: z.string(),
    }),
  },

  'negotiation-prep': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'reliefweb', 'unnews'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS negotiation analyst. Using Fisher-Ury principled negotiation and Zartman's ripeness theory, assess the negotiation landscape.

Analyze:
- Ripeness assessment: mutually hurting stalemate? Mutually enticing opportunity?
- BATNA for each major party
- Interests vs. positions (Fisher-Ury) for each party
- Potential zone of agreement (ZOPA)
- Confidence-building measures
- Sequencing: what issues to address first
- Potential spoilers (Stedman) and management strategies`,
    schema: z.object({
      ripenessAssessment: z.object({
        isRipe: z.boolean(),
        mutuallyHurtingStalemate: z.object({ present: z.boolean(), evidence: z.array(z.string()) }),
        mutuallyEnticingOpportunity: z.object({ present: z.boolean(), evidence: z.array(z.string()) }),
        overallAssessment: z.string(),
      }),
      parties: z.array(z.object({
        name: z.string(),
        positions: z.array(z.string()),
        interests: z.array(z.string()),
        batna: z.string(),
        redLines: z.array(z.string()),
      })),
      zopa: z.object({ exists: z.boolean(), description: z.string(), areas: z.array(z.string()) }),
      confidenceBuildingMeasures: z.array(z.object({ measure: z.string(), feasibility: z.enum(['high', 'moderate', 'low']), parties: z.array(z.string()) })),
      spoilerAnalysis: z.array(z.object({ actor: z.string(), type: z.enum(['total', 'limited', 'greedy']), managementStrategy: z.string() })),
      sequencing: z.array(z.object({ phase: z.number(), issue: z.string(), rationale: z.string() })),
    }),
  },

  'concordia': {
    sources: ['acled', 'gdelt', 'ucdp', 'crisisgroup', 'worldbank', 'hdx'],
    aiModel: 'pro',
    creditCost: 6,
    synthesisPrompt: `You are a PRAXIS CONCORDIA simulation analyst. Prepare data inputs for a multi-party conflict simulation.

Using Galtung's violence triangle (direct, structural, cultural), map the conflict's dimensions. For each actor, define their objectives, resources, constraints, and decision trees. Identify intervention points where third-party action could shift dynamics.

This data seeds a game-theoretic simulation of conflict trajectories.`,
    schema: z.object({
      conflictDimensions: z.object({
        directViolence: z.object({ level: z.number().min(0).max(10), manifestations: z.array(z.string()) }),
        structuralViolence: z.object({ level: z.number().min(0).max(10), manifestations: z.array(z.string()) }),
        culturalViolence: z.object({ level: z.number().min(0).max(10), manifestations: z.array(z.string()) }),
      }),
      actors: z.array(z.object({
        name: z.string(),
        objectives: z.array(z.string()),
        resources: z.array(z.string()),
        constraints: z.array(z.string()),
        decisionDrivers: z.array(z.string()),
      })),
      interventionPoints: z.array(z.object({ point: z.string(), type: z.string(), potentialImpact: z.string(), feasibility: z.enum(['high', 'moderate', 'low']) })),
      systemicDrivers: z.array(z.string()),
    }),
  },

  'mediation-design': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'unnews', 'reliefweb'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS mediation design specialist. Using Berghof's mediation methodology and Lederach's peacebuilding pyramid, design a mediation framework for this conflict.

Cover:
- Track I/II/III engagement strategy (Lederach pyramid)
- Process design: format, venue, agenda sequencing
- Mediator profile and mandate requirements
- Inclusivity considerations: gender, youth, civil society, diaspora
- Confidence-building sequence
- Implementation and monitoring mechanisms
- Risks and mitigation strategies`,
    schema: z.object({
      processDesign: z.object({
        format: z.string(),
        phases: z.array(z.object({ phase: z.string(), objective: z.string(), duration: z.string(), activities: z.array(z.string()) })),
        venueConsiderations: z.array(z.string()),
      }),
      trackStrategy: z.object({
        trackI: z.object({ participants: z.array(z.string()), approach: z.string() }),
        trackII: z.object({ participants: z.array(z.string()), approach: z.string() }),
        trackIII: z.object({ participants: z.array(z.string()), approach: z.string() }),
      }),
      mediatorProfile: z.object({ requirements: z.array(z.string()), mandate: z.string() }),
      inclusivity: z.array(z.object({ group: z.string(), mechanism: z.string(), rationale: z.string() })),
      risks: z.array(z.object({ risk: z.string(), likelihood: z.enum(['high', 'moderate', 'low']), mitigation: z.string() })),
    }),
  },

  'game-theory': {
    sources: ['acled', 'gdelt', 'crisisgroup', 'ucdp'],
    aiModel: 'pro',
    creditCost: 5,
    synthesisPrompt: `You are a PRAXIS game theory analyst. Using Fearon's rationalist theory of war and basic game-theoretic models, analyze the strategic interaction between conflict parties.

Model:
- Key players and their strategy sets (cooperate, defect, escalate, etc.)
- Payoff estimates based on current data (ACLED casualties, economic costs, political gains)
- Nash equilibria under current conditions
- How changing parameters (sanctions, military aid, mediation) shifts equilibria
- Information asymmetries and their impact on bargaining
- Commitment problems and credibility issues`,
    schema: z.object({
      players: z.array(z.object({
        name: z.string(),
        strategies: z.array(z.string()),
        currentStrategy: z.string(),
        payoffDrivers: z.array(z.string()),
      })),
      equilibria: z.array(z.object({ name: z.string(), strategies: z.record(z.string(), z.string()), stability: z.enum(['stable', 'unstable', 'fragile']), description: z.string() })),
      bargainingSpace: z.object({ exists: z.boolean(), constraints: z.array(z.string()), description: z.string() }),
      informationProblems: z.array(z.object({ problem: z.string(), affectedParties: z.array(z.string()), impact: z.string() })),
      policyLevers: z.array(z.object({ lever: z.string(), effect: z.string(), targetEquilibrium: z.string() })),
      assessment: z.string(),
    }),
  },

  // =========================================================================
  // INTELLIGENCE
  // =========================================================================

  'deep-search-agent': {
    sources: ['gdelt', 'reliefweb', 'unnews', 'crisisgroup'],
    aiModel: 'pro',
    creditCost: 8,
    synthesisPrompt: `You are a PRAXIS deep research agent. Conduct a comprehensive open-source intelligence sweep across all available sources for this conflict situation.

Compile: key findings organized by theme (security, political, humanitarian, economic), source assessment with reliability ratings, information gaps that require further investigation, and recommended follow-up queries.`,
    schema: z.object({
      findings: z.array(z.object({
        theme: z.enum(['security', 'political', 'humanitarian', 'economic', 'legal', 'environmental']),
        title: z.string(),
        detail: z.string(),
        sources: z.array(z.string()),
        reliability: z.enum(['confirmed', 'probable', 'possible', 'doubtful']),
        significance: z.enum(['critical', 'high', 'moderate', 'low']),
      })),
      informationGaps: z.array(z.object({ gap: z.string(), priority: z.enum(['high', 'medium', 'low']), suggestedSources: z.array(z.string()) })),
      followUpQueries: z.array(z.string()),
      confidence: z.string(),
    }),
  },

  'argus': {
    sources: ['acled', 'gdelt', 'ucdp', 'reliefweb'],
    aiModel: 'flash',
    creditCost: 3,
    synthesisPrompt: `You are ARGUS, the PRAXIS automated real-time geospatial update system. Scan all source feeds for the latest events and produce a structured alert feed.

For each event: classify by type (military, political, humanitarian, protest, diplomatic), geolocate, assess severity, and flag if it represents a pattern break from baseline. Sort by severity then recency.`,
    schema: z.object({
      alerts: z.array(z.object({
        id: z.string(),
        timestamp: z.string(),
        type: z.enum(['military', 'political', 'humanitarian', 'protest', 'diplomatic', 'economic']),
        title: z.string(),
        description: z.string(),
        location: z.object({ name: z.string(), lat: z.number().nullable(), lng: z.number().nullable() }),
        severity: z.enum(['critical', 'high', 'moderate', 'low']),
        isPatternBreak: z.boolean(),
        source: z.string(),
        actors: z.array(z.string()),
      })),
      patternSummary: z.string(),
      baselineComparison: z.string(),
    }),
  },

  'media-compass': {
    sources: ['gdelt', 'unnews'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS media bias and narrative analyst. Using GDELT media data, map the information ecosystem around this conflict.

Analyze:
- Media framing by source country and outlet type
- Tone analysis: how different media ecosystems cover the conflict
- Narrative divergence: identify where coverage differs significantly across countries/regions
- Source reliability assessment (NATO STANAG 2022 methodology)
- Propaganda and disinformation indicators
- Underreported aspects of the conflict`,
    schema: z.object({
      mediaEcosystem: z.array(z.object({
        region: z.string(),
        dominantFraming: z.string(),
        averageTone: z.number(),
        sampleSize: z.number(),
        reliabilityTier: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
      })),
      narrativeDivergences: z.array(z.object({ issue: z.string(), perspective1: z.string(), perspective2: z.string(), significance: z.string() })),
      disinformationIndicators: z.array(z.object({ indicator: z.string(), confidence: z.enum(['high', 'moderate', 'low']), description: z.string() })),
      underreportedIssues: z.array(z.string()),
      overallAssessment: z.string(),
    }),
  },

  'media-roundup': {
    sources: ['gdelt', 'unnews', 'reliefweb'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS media roundup curator. Compile and summarize the most significant media coverage of this conflict from the last 48 hours.

Group coverage by theme, highlight contrasting perspectives, and flag stories that represent new developments or shifts in coverage patterns. Include headline, source, date, tone, and a one-sentence summary for each item.`,
    schema: z.object({
      period: z.string(),
      topStories: z.array(z.object({
        headline: z.string(),
        source: z.string(),
        date: z.string(),
        url: z.string(),
        tone: z.enum(['positive', 'neutral', 'negative']),
        summary: z.string(),
        theme: z.string(),
      })),
      trendingThemes: z.array(z.object({ theme: z.string(), storyCount: z.number(), direction: z.enum(['rising', 'steady', 'falling']) })),
      editorialNote: z.string(),
    }),
  },

  'sanctions': {
    sources: ['gdelt', 'unnews', 'reliefweb', 'worldbank'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS sanctions and economic measures analyst. Research the sanctions landscape affecting this conflict.

Cover: active UN Security Council sanctions regimes, unilateral sanctions (US, EU, UK), targeted sanctions (asset freezes, travel bans), sectoral sanctions, humanitarian exemptions, sanctions effectiveness assessment, and evasion indicators. Reference specific resolution numbers and implementation status.`,
    schema: z.object({
      activeSanctions: z.array(z.object({
        regime: z.string(),
        imposedBy: z.string(),
        type: z.enum(['comprehensive', 'targeted', 'sectoral', 'arms-embargo']),
        targets: z.array(z.string()),
        reference: z.string(),
        status: z.enum(['active', 'under-review', 'partially-lifted', 'expired']),
      })),
      humanitarianExemptions: z.array(z.object({ exemption: z.string(), applicability: z.string() })),
      effectivenessAssessment: z.string(),
      evasionIndicators: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
  },

  'commitments': {
    sources: ['unnews', 'reliefweb', 'gdelt', 'crisisgroup'],
    aiModel: 'pro',
    creditCost: 3,
    synthesisPrompt: `You are a PRAXIS commitments tracker. Using Zartman's framework on the durability of agreements, identify and assess all known commitments, ceasefires, and agreements related to this conflict.

For each commitment: parties involved, type (ceasefire, peace agreement, humanitarian corridor, prisoner exchange), date signed, current status, compliance assessment, and violations documented.`,
    schema: z.object({
      commitments: z.array(z.object({
        title: z.string(),
        type: z.enum(['ceasefire', 'peace-agreement', 'humanitarian-corridor', 'prisoner-exchange', 'confidence-building', 'framework-agreement', 'verbal-commitment']),
        parties: z.array(z.string()),
        dateSigned: z.string(),
        status: z.enum(['active', 'violated', 'expired', 'suspended', 'under-negotiation']),
        complianceLevel: z.enum(['full', 'partial', 'minimal', 'none']),
        violations: z.array(z.string()),
        monitoringMechanism: z.string(),
      })),
      overallComplianceAssessment: z.string(),
      recommendations: z.array(z.string()),
    }),
  },

  'treaty-analyzer': {
    sources: ['unnews', 'reliefweb', 'gdelt'],
    aiModel: 'pro',
    creditCost: 4,
    synthesisPrompt: `You are a PRAXIS treaty and legal instrument analyst. Research and analyze treaties, conventions, and legal instruments applicable to this conflict.

Cover: relevant bilateral/multilateral treaties, applicable IHL provisions (Geneva Conventions, Additional Protocols), human rights treaties, status of forces agreements, and territorial agreements. For each, assess current applicability and compliance.`,
    schema: z.object({
      treaties: z.array(z.object({
        name: z.string(),
        type: z.enum(['bilateral', 'multilateral', 'ihl', 'human-rights', 'sofa', 'territorial', 'arms-control']),
        parties: z.array(z.string()),
        dateAdopted: z.string(),
        status: z.enum(['in-force', 'suspended', 'denounced', 'pending-ratification']),
        keyProvisions: z.array(z.string()),
        complianceAssessment: z.string(),
      })),
      ihlApplicability: z.object({ conflictClassification: z.string(), applicableInstruments: z.array(z.string()), keyObligations: z.array(z.string()) }),
      legalGaps: z.array(z.string()),
      analysis: z.string(),
    }),
  },

  'alert-center': {
    sources: ['acled', 'gdelt', 'ucdp', 'reliefweb', 'crisisgroup'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS alert center analyst. Scan all feeds and generate priority-ranked alerts for significant changes, anomalies, or emerging threats.

Apply signal detection methodology: compare current activity against 30-day baselines. Flag statistical anomalies, new actor entries, geographic spread changes, and rhetoric intensification. Each alert should include actionable context.`,
    schema: z.object({
      alerts: z.array(z.object({
        priority: z.enum(['critical', 'high', 'medium', 'low']),
        title: z.string(),
        description: z.string(),
        indicator: z.string(),
        baseline: z.string(),
        currentValue: z.string(),
        source: z.string(),
        actionRequired: z.string(),
        timestamp: z.string(),
      })),
      overallThreatLevel: z.enum(['critical', 'elevated', 'guarded', 'low']),
      summary: z.string(),
    }),
  },

  'deep-research': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews', 'ucdp', 'crisisgroup', 'worldbank', 'unhcr', 'hdx'],
    aiModel: 'pro',
    creditCost: 8,
    synthesisPrompt: `You are a PRAXIS deep research analyst. Conduct exhaustive research across all available data sources for this conflict situation.

Produce a research brief covering: conflict dynamics with quantitative trends, actor analysis with behavioral patterns, humanitarian situation with displacement and food security data, economic factors, governance indicators, media environment, and strategic assessment.

This is the most comprehensive research product. Be thorough, cite specific numbers, and identify analytical uncertainties.`,
    schema: z.object({
      conflictDynamics: z.object({ summary: z.string(), eventTrend: z.string(), fatalityTrend: z.string(), intensityLevel: z.number().min(1).max(10) }),
      actorAnalysis: z.array(z.object({ name: z.string(), recentActivity: z.string(), behavioralTrend: z.string() })),
      humanitarianOverview: z.object({ displaced: z.number(), foodInsecure: z.number().nullable(), fundingGap: z.string(), severity: z.string() }),
      economicFactors: z.object({ gdpTrend: z.string(), keyIndicators: z.array(z.string()) }),
      governanceAssessment: z.object({ score: z.number().nullable(), trend: z.string(), keyIssues: z.array(z.string()) }),
      mediaEnvironment: z.object({ volume: z.string(), tone: z.string(), keyNarratives: z.array(z.string()) }),
      strategicAssessment: z.string(),
      uncertainties: z.array(z.string()),
      dataQuality: z.object({ overall: z.enum(['high', 'moderate', 'low']), gaps: z.array(z.string()) }),
    }),
  },

  'geospatial-monitor': {
    sources: ['acled', 'gdelt', 'ucdp'],
    aiModel: 'flash',
    creditCost: 3,
    synthesisPrompt: `You are a PRAXIS geospatial intelligence analyst. From ACLED and UCDP event data, produce a geospatial analysis of the conflict.

Map: hotspot clusters with coordinates, geographic spread trends, displacement corridors, control zones, and frontline approximations. Identify newly affected areas and areas of reduced activity.`,
    schema: z.object({
      hotspots: z.array(z.object({
        name: z.string(),
        lat: z.number(),
        lng: z.number(),
        eventCount: z.number(),
        fatalities: z.number(),
        trend: z.enum(['intensifying', 'stable', 'decreasing']),
        primaryEventType: z.string(),
      })),
      geographicSpread: z.object({ trend: z.enum(['expanding', 'stable', 'contracting']), description: z.string() }),
      newlyAffectedAreas: z.array(z.object({ name: z.string(), firstEventDate: z.string(), eventType: z.string() })),
      controlZones: z.array(z.object({ area: z.string(), controlledBy: z.string(), contested: z.boolean() })),
      summary: z.string(),
    }),
  },

  'source-monitor': {
    sources: ['acled', 'gdelt', 'reliefweb', 'unnews', 'crisisgroup'],
    aiModel: 'flash',
    creditCost: 2,
    synthesisPrompt: `You are a PRAXIS source monitoring analyst. Track the status and reliability of all intelligence sources being used for this conflict situation.

For each source: current availability, last successful fetch, data freshness, volume of new items, any detected anomalies or outages, and reliability assessment. Flag sources that may be compromised or provide biased coverage.`,
    schema: z.object({
      sources: z.array(z.object({
        name: z.string(),
        status: z.enum(['operational', 'degraded', 'unavailable']),
        lastUpdate: z.string(),
        itemCount: z.number(),
        reliability: z.enum(['high', 'moderate', 'low', 'unknown']),
        notes: z.string(),
      })),
      anomalies: z.array(z.object({ source: z.string(), anomaly: z.string(), impact: z.string() })),
      coverageAssessment: z.string(),
      recommendations: z.array(z.string()),
    }),
  },
};
