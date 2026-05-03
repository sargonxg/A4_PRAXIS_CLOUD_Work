import { adminDb } from '@/lib/firebase/admin';
import { runDialecticaRecipe } from '@/lib/dialectica/client';
import {
  DIALECTICA_RECIPES,
  type AdapterCapabilities,
  type ApprovalSet,
  type ContextPackQuery,
  type DialecticaAdapter,
  type DialecticaContextPack,
  type ExtractInput,
  type GraphHealthReport,
  type GraphProposal,
  type MutationApplyResult,
  type MutationProposalResult,
  type OntologyVersion,
  type SituationFrame,
} from './adapter';
import type { RecipeId, RecipeParams, RecipeResult } from '@/lib/dialectica/client';

interface GraphAnalysis {
  pivotActors?: Array<{ label: string; edges: number }>;
  factionMap?: Record<string, { name: string; actors: Array<{ label: string }> }>;
  escalationAssessment?: { glaslStage?: number; trajectory?: string };
  negotiationSpace?: { zopa?: Array<{ interest: string }>; hardConstraints?: Array<{ label: string }> };
  intelligenceGaps?: Array<{ type: string; description: string }>;
}

export class FirestoreDialecticaAdapter implements DialecticaAdapter {
  async resolveOntology(_situation: SituationFrame): Promise<OntologyVersion> {
    return {
      id: 'conflict-grammar-v1',
      version: '1.0.0',
      primitiveCount: 8,
      relationshipCount: 42,
    };
  }

  async extract(input: ExtractInput): Promise<GraphProposal> {
    return {
      nodes: [{
        label: input.text.slice(0, 80) || 'Untitled extract',
        primitive_type: 'Claim',
        confidence: 0.5,
        source_span: input.sourceSpan,
        status: 'hypothesis',
      }],
      edges: [],
    };
  }

  async proposeMutations(proposals: GraphProposal): Promise<MutationProposalResult> {
    return { proposalIds: proposals.nodes.map((node, index) => String(node.id ?? `proposal-${index}`)), status: 'staged' };
  }

  async approveMutations(approvalSet: ApprovalSet): Promise<MutationApplyResult> {
    return { applied: approvalSet.proposalIds.length, status: 'approved' };
  }

  async contextPack(query: ContextPackQuery): Promise<DialecticaContextPack> {
    if (!adminDb) return { prompt: '', mode: 'firestore' };
    const sitPath = `users/${query.uid}/situations/${query.situationId}`;
    const [analysisSnap, graphSnap] = await Promise.all([
      adminDb.doc(`${sitPath}/graph/analysis`).get(),
      adminDb.doc(`${sitPath}/graph/data`).get(),
    ]);
    const analysis = (analysisSnap.data() || {}) as GraphAnalysis;
    const toolOutputs = await this.readToolOutputs(sitPath, query.toolId, query.loadAll);
    return {
      prompt: this.graphContextToPrompt(analysis, toolOutputs),
      graphSummary: {
        analysisAvailable: analysisSnap.exists,
        graphAvailable: graphSnap.exists,
      },
      mode: 'firestore',
    };
  }

  async reason<R extends RecipeId>(recipe: R, params: RecipeParams<R>): Promise<RecipeResult<R>> {
    return runDialecticaRecipe(recipe, { params });
  }

  async graphHealth(situationId: string, uid?: string): Promise<GraphHealthReport> {
    if (!adminDb || !uid) {
      return { healthy: false, nodeCount: 0, edgeCount: 0, provenanceReady: false, hypothesesReady: false, scenarioForksReady: false };
    }
    const sitPath = `users/${uid}/situations/${situationId}`;
    const [graphSnap, provenanceSnap, hypothesesSnap, forksSnap] = await Promise.all([
      adminDb.doc(`${sitPath}/graph/data`).get(),
      adminDb.collection(`${sitPath}/provenance`).limit(1).get(),
      adminDb.collection(`${sitPath}/hypotheses`).limit(1).get(),
      adminDb.collection(`${sitPath}/scenario_forks`).limit(1).get(),
    ]);
    const graph = graphSnap.data() as { nodes?: unknown[]; edges?: unknown[] } | undefined;
    return {
      healthy: graphSnap.exists,
      nodeCount: graph?.nodes?.length ?? 0,
      edgeCount: graph?.edges?.length ?? 0,
      provenanceReady: !provenanceSnap.empty,
      hypothesesReady: !hypothesesSnap.empty,
      scenarioForksReady: !forksSnap.empty,
    };
  }

  capabilities(): AdapterCapabilities {
    return {
      mode: 'firestore',
      typedGrammar: true,
      provenance: true,
      hypotheses: true,
      scenarioForks: true,
      recipes: DIALECTICA_RECIPES,
      premium: false,
    };
  }

  private async readToolOutputs(sitPath: string, toolId: string, loadAll = false): Promise<Record<string, unknown>> {
    const deps = loadAll ? [] : TOOL_CONTEXT_DEPS[toolId] || [];
    if (!deps.length) return {};
    const toolDocs = await Promise.all(deps.map((dep) => adminDb!.doc(`${sitPath}/tools/${dep}`).get()));
    return Object.fromEntries(
      deps.flatMap((dep, index) => {
        const snap = toolDocs[index];
        return snap.exists ? [[dep, snap.data()]] : [];
      }),
    );
  }

  private graphContextToPrompt(analysis: GraphAnalysis, toolOutputs: Record<string, unknown>): string {
    const lines: string[] = [];
    if (analysis.pivotActors?.length) {
      lines.push('\n## KEY ACTORS (from DIALECTICA graph):');
      analysis.pivotActors.slice(0, 8).forEach((actor) => lines.push(`- ${actor.label} (${actor.edges} graph connections)`));
    }
    if (analysis.factionMap && Object.keys(analysis.factionMap).length > 0) {
      lines.push('\n## FACTION STRUCTURE:');
      Object.values(analysis.factionMap).forEach((faction) => {
        const actorNames = faction.actors?.slice(0, 3).map((actor) => actor.label).join(', ');
        lines.push(`- ${faction.name}: ${actorNames}`);
      });
    }
    if (analysis.escalationAssessment?.glaslStage) {
      lines.push(`\n## ESCALATION: Glasl Stage ${analysis.escalationAssessment.glaslStage}/9 — ${analysis.escalationAssessment.trajectory || 'stable'}`);
    }
    if (analysis.negotiationSpace?.zopa?.length) {
      const zopaNames = analysis.negotiationSpace.zopa.slice(0, 3).map((zopa) => zopa.interest).join(', ');
      lines.push(`\n## ZOPA CANDIDATES: ${zopaNames}`);
    }
    if (analysis.intelligenceGaps?.length) {
      lines.push('\n## INTELLIGENCE GAPS (prioritise these):');
      analysis.intelligenceGaps.slice(0, 3).forEach((gap) => lines.push(`- [${gap.type}] ${gap.description}`));
    }
    for (const [toolName, toolData] of Object.entries(toolOutputs)) {
      lines.push(`\n## PRIOR ANALYSIS — ${toolName}:\n${JSON.stringify(toolData).slice(0, 800)}`);
    }
    return lines.join('\n');
  }
}

const TOOL_CONTEXT_DEPS: Record<string, string[]> = {
  scenario_analysis: ['risk_assessment', 'escalation_scan', 'stakeholder_map'],
  briefing: [],
  negotiation_prep: ['stakeholder_map', 'commitment_scan', 'escalation_scan'],
  mediation_design: ['negotiation_prep', 'stakeholder_map', 'commitment_scan'],
  risk_assessment: ['escalation_scan', 'media_analysis', 'early_warning'],
  treaty_analysis: ['commitment_scan', 'negotiation_prep'],
  commitment_scan: ['stakeholder_map'],
  info_environment: ['media_analysis', 'media_roundup'],
  game_theory: ['stakeholder_map', 'negotiation_prep'],
  power_map: ['stakeholder_map', 'actor_enrichment'],
};
