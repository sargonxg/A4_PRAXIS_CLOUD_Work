/**
 * Server-side context builder for AI API routes.
 * Uses Firebase Admin SDK (adminDb) — for use in Next.js API routes only.
 *
 * Reads graph analysis + prior tool outputs from Firestore and returns
 * a structured context string to prepend to every AI prompt.
 *
 * Client-side equivalent: src/lib/ai/context-builder.ts (uses client SDK)
 */
import { adminDb } from '@/lib/firebase/admin';

/**
 * Tool dependency map — which prior tool outputs to load as context for each tool.
 * Ordered by dependency depth (dependencies loaded before dependents).
 */
export const TOOL_CONTEXT_DEPS: Record<string, string[]> = {
  scenario_analysis:  ['risk_assessment', 'escalation_scan', 'stakeholder_map'],
  dossier:            ['stakeholder_map', 'actor_enrichment'],
  briefing:           [], // loads all via readAllToolData
  talking_points:     ['negotiation_prep', 'stakeholder_map', 'media_analysis'],
  negotiation_prep:   ['stakeholder_map', 'commitment_scan', 'escalation_scan'],
  mediation_design:   ['negotiation_prep', 'stakeholder_map', 'commitment_scan'],
  risk_assessment:    ['escalation_scan', 'media_analysis', 'early_warning'],
  escalation_scan:    [],
  media_analysis:     ['info_environment', 'media_roundup'],
  media_roundup:      [],
  sanctions_scan:     ['stakeholder_map', 'actor_enrichment'],
  treaty_analysis:    ['commitment_scan', 'negotiation_prep'],
  commitment_scan:    ['stakeholder_map'],
  stakeholder_map:    [],
  early_warning:      ['escalation_scan', 'risk_assessment'],
  un_toolkit:         ['treaty_analysis', 'commitment_scan', 'mediation_design'],
  deep_research:      [],
  actor_enrichment:   ['stakeholder_map'],
  info_environment:   ['media_analysis', 'media_roundup'],
  historical_parallels: ['escalation_scan', 'stakeholder_map'],
  calendar:           ['commitment_scan', 'early_warning'],
  game_theory:        ['stakeholder_map', 'negotiation_prep'],
  power_map:          ['stakeholder_map', 'actor_enrichment'],
  poc_assessment:     ['risk_assessment', 'escalation_scan'],
};

interface GraphAnalysis {
  pivotActors?: Array<{ label: string; edges: number }>;
  factionMap?: Record<string, { name: string; actors: Array<{ label: string }> }>;
  escalationAssessment?: { glaslStage?: number; trajectory?: string };
  negotiationSpace?: { zopa?: Array<{ interest: string }>; hardConstraints?: Array<{ label: string }> };
  intelligenceGaps?: Array<{ type: string; description: string }>;
}

/**
 * Build graph-enriched context for a specific tool.
 * Falls back gracefully if no graph data exists yet.
 *
 * @param uid - Firebase user ID (from withAuth)
 * @param situationId - Active situation ID
 * @param toolKey - Tool name key (from TOOL_CONTEXT_DEPS map)
 * @param loadAll - If true, load all tool outputs (for Briefing)
 */
export async function buildGraphContext(
  uid: string,
  situationId: string,
  toolKey: string,
  loadAll = false,
): Promise<string> {
  if (!adminDb) return '';

  try {
    const sitPath = `users/${uid}/situations/${situationId}`;

    // Read graph analysis (the rich analysis from the Python pipeline)
    const analysisDoc = await adminDb.doc(`${sitPath}/graph/analysis`).get();
    const analysis = (analysisDoc.data() || {}) as GraphAnalysis;

    // Read prior tool dependencies
    const deps = loadAll
      ? Object.keys(TOOL_CONTEXT_DEPS)
      : (TOOL_CONTEXT_DEPS[toolKey] || []);

    const toolOutputs: Record<string, unknown> = {};
    if (deps.length > 0) {
      const toolDocs = await Promise.all(
        deps.map((dep) => adminDb!.doc(`${sitPath}/tools/${dep}`).get()),
      );
      for (let i = 0; i < deps.length; i++) {
        const snap = toolDocs[i];
        if (snap.exists) {
          toolOutputs[deps[i]] = snap.data();
        }
      }
    }

    return graphContextToPrompt(analysis, toolOutputs);
  } catch {
    return '';
  }
}

function graphContextToPrompt(
  analysis: GraphAnalysis,
  toolOutputs: Record<string, unknown>,
): string {
  const lines: string[] = [];

  if (analysis.pivotActors?.length) {
    lines.push('\n## KEY ACTORS (from conflict knowledge graph):');
    analysis.pivotActors.slice(0, 8).forEach((a) => {
      lines.push(`- ${a.label} (${a.edges} graph connections)`);
    });
  }

  if (analysis.factionMap && Object.keys(analysis.factionMap).length > 0) {
    lines.push('\n## FACTION STRUCTURE:');
    Object.values(analysis.factionMap).forEach((f) => {
      const actorNames = f.actors?.slice(0, 3).map((a) => a.label).join(', ');
      lines.push(`- ${f.name}: ${actorNames}`);
    });
  }

  if (analysis.escalationAssessment?.glaslStage) {
    lines.push(
      `\n## ESCALATION: Glasl Stage ${analysis.escalationAssessment.glaslStage}/9 — ${analysis.escalationAssessment.trajectory || 'stable'}`,
    );
  }

  if (analysis.negotiationSpace?.zopa?.length) {
    const zopaNames = analysis.negotiationSpace.zopa.slice(0, 3).map((z) => z.interest).join(', ');
    lines.push(`\n## ZOPA CANDIDATES: ${zopaNames}`);
  }

  if (analysis.intelligenceGaps?.length) {
    lines.push('\n## INTELLIGENCE GAPS (prioritise these):');
    analysis.intelligenceGaps.slice(0, 3).forEach((g) => {
      lines.push(`- [${g.type}] ${g.description}`);
    });
  }

  for (const [toolName, toolData] of Object.entries(toolOutputs)) {
    const summary = JSON.stringify(toolData).slice(0, 800);
    lines.push(`\n## PRIOR ANALYSIS — ${toolName}:\n${summary}`);
  }

  return lines.join('\n');
}

/**
 * Write tool output to Firestore (server-side, using Admin SDK).
 * Writes to: users/{uid}/situations/{situationId}/tools/{toolName}
 *
 * This is the path the Python backend also writes to, and that
 * useToolData() subscribes to on the client.
 */
export async function writeToolDataServer(
  uid: string,
  situationId: string,
  toolName: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb
      .doc(`users/${uid}/situations/${situationId}/tools/${toolName}`)
      .set(
        { ...data, generatedAt: new Date().toISOString() },
        { merge: true },
      );
  } catch {
    // Non-critical — don't break the response if Firestore write fails
  }
}
