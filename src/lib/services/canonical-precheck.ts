/**
 * Canonical Pre-Check Service
 *
 * Before generating situation intelligence, validates key facts against
 * current web sources using Google Search grounding. This prevents the
 * system from generating analysis based on outdated information (e.g.,
 * Assad still in power after regime change).
 *
 * Returns a "ground truth" context block that is prepended to all AI prompts.
 *
 * Firestore path: users/{uid}/situations/{sitId}/tool-data/canonical-precheck
 */

import { generateText } from 'ai';
import { getGroundedModel } from '@/lib/ai/providers';

export interface CanonicalFact {
  claim: string;
  status: 'confirmed' | 'outdated' | 'disputed' | 'unverified';
  currentInfo: string;
  source?: string;
  confidence: 'high' | 'medium' | 'low';
  checkedAt: string;
}

export interface ActorUpdate {
  actor: string;
  currentStatus: string;
  changed: boolean;
}

export interface CorrectionEntry {
  outdatedClaim: string;
  currentReality: string;
  changeDate?: string;
}

export interface PreCheckResult {
  situationName: string;
  region: string;
  groundTruth: CanonicalFact[];
  currentLeadership: string | null;
  currentStatus: string;
  lastMajorEvent: string | null;
  actorUpdates: ActorUpdate[];
  corrections: CorrectionEntry[];
  warnings: string[];
  checkedAt: string;
}

/**
 * Run a canonical pre-check using Google Search grounding.
 * This queries current web sources to establish ground truth
 * before the AI generates its analysis.
 */
export async function runCanonicalPreCheck(params: {
  situationName: string;
  region: string;
  actors: string[];
  description?: string;
}): Promise<PreCheckResult> {
  const { situationName, region, actors } = params;
  const checkedAt = new Date().toISOString();

  try {
    const groundedModel = getGroundedModel();

    const { text } = await generateText({
      model: groundedModel,
      prompt: `You are a fact-checking system. For the situation "${situationName}" in ${region || 'unknown region'}:

CRITICAL: Use your search grounding to answer with CURRENT, VERIFIED information only. Today's date is ${new Date().toISOString().split('T')[0]}.

1. CURRENT LEADERSHIP: Who currently leads/governs the country or region? Has there been any recent change of government, coup, or regime change in the last 2 years?

2. CURRENT STATUS: What is the current state of this conflict/situation as of today? Is it active, frozen, resolved, or transformed?

3. KEY ACTORS STATUS: For each actor listed, what is their current status? Are they still in power, still active, or have they been removed/dissolved?
Actors: ${actors.join(', ') || 'not specified'}

4. LAST MAJOR EVENT: What was the most recent significant event (within last 6 months)?

5. CRITICAL CORRECTIONS: What common misconceptions or outdated information should be flagged? For example: leaders who are no longer in power, ceasefires that have collapsed, new actors that have emerged, territorial changes, government changes.

Respond in JSON format ONLY (no markdown, no explanation):
{
  "currentLeadership": "string describing who currently governs",
  "currentStatus": "string describing current situation status",
  "lastMajorEvent": "string with date: most recent major event",
  "actorUpdates": [
    { "actor": "name", "currentStatus": "description", "changed": true }
  ],
  "corrections": [
    { "outdatedClaim": "what people might wrongly assume", "currentReality": "what is actually true now", "changeDate": "when this changed" }
  ],
  "warnings": ["critical warnings about outdated assumptions"]
}`,
    });

    // Parse the grounded response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createFallbackResult(situationName, region, text, checkedAt);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const actorUpdates = (parsed.actorUpdates as ActorUpdate[]) || [];
    const corrections = (parsed.corrections as CorrectionEntry[]) || [];

    const groundTruth: CanonicalFact[] = corrections.map((c) => ({
      claim: c.outdatedClaim || '',
      status: 'outdated' as const,
      currentInfo: c.currentReality || '',
      confidence: 'high' as const,
      checkedAt,
    }));

    return {
      situationName,
      region,
      groundTruth,
      currentLeadership: (parsed.currentLeadership as string) || null,
      currentStatus: (parsed.currentStatus as string) || '',
      lastMajorEvent: (parsed.lastMajorEvent as string) || null,
      actorUpdates,
      corrections,
      warnings: (parsed.warnings as string[]) || [],
      checkedAt,
    };
  } catch (err) {
    console.warn('[canonical-precheck] Pre-check failed:', err);
    return {
      situationName,
      region,
      groundTruth: [],
      currentLeadership: null,
      currentStatus: 'Pre-check unavailable — proceed with caution regarding current events.',
      lastMajorEvent: null,
      actorUpdates: [],
      corrections: [],
      warnings: ['Canonical pre-check could not be completed. AI-generated content may contain outdated information.'],
      checkedAt,
    };
  }
}

function createFallbackResult(
  situationName: string,
  region: string,
  rawText: string,
  checkedAt: string,
): PreCheckResult {
  return {
    situationName,
    region,
    groundTruth: [],
    currentLeadership: null,
    currentStatus: rawText.slice(0, 500),
    lastMajorEvent: null,
    actorUpdates: [],
    corrections: [],
    warnings: ['Could not parse structured pre-check response. Raw response used as context.'],
    checkedAt,
  };
}

/**
 * Format pre-check results into a context block for AI prompts.
 * This is prepended to the auto-structure system prompt to ensure
 * the AI uses current, verified information.
 */
export function formatPreCheckContext(result: PreCheckResult): string {
  const lines: string[] = [
    `\nCANONICAL GROUND TRUTH (verified via web search on ${result.checkedAt.split('T')[0]}):`,
  ];

  if (result.currentLeadership) {
    lines.push(`CURRENT LEADERSHIP: ${result.currentLeadership}`);
  }
  if (result.currentStatus) {
    lines.push(`CURRENT STATUS: ${result.currentStatus}`);
  }
  if (result.lastMajorEvent) {
    lines.push(`LAST MAJOR EVENT: ${result.lastMajorEvent}`);
  }

  if (result.actorUpdates.length > 0) {
    lines.push('\nACTOR STATUS UPDATES:');
    for (const actor of result.actorUpdates) {
      const marker = actor.changed ? ' [CHANGED]' : '';
      lines.push(`- ${actor.actor}: ${actor.currentStatus}${marker}`);
    }
  }

  if (result.groundTruth.length > 0) {
    lines.push('\nCRITICAL CORRECTIONS (DO NOT use outdated information below):');
    for (const fact of result.groundTruth) {
      lines.push(`- OUTDATED: "${fact.claim}" --> CURRENT REALITY: "${fact.currentInfo}"`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWARNINGS:');
    for (const w of result.warnings) {
      lines.push(`- ${w}`);
    }
  }

  lines.push(''); // trailing newline
  return lines.join('\n');
}
