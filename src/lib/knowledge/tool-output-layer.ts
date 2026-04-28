/**
 * PRAXIS Tool Output Layer — cross-referenced versioned tool outputs.
 * Reads from Firestore tool-data subcollection.
 * Returns data from related tools to enrich context.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { RelatedToolData } from './types';
import { canonicalToolId, coerceIsoTimestamp } from './evidence-envelope';

// Which tools inform which other tool's context
const TOOL_DEPENDENCIES: Record<string, string[]> = {
  'risk-monitor': ['actor-profiles', 'early-warning', 'humanitarian'],
  'early-warning': ['risk-monitor', 'actor-profiles', 'timeline'],
  'actor-profiles': ['stakeholder-map', 'power-map', 'conflict-graph'],
  'stakeholder-map': ['actor-profiles', 'power-map'],
  'power-map': ['actor-profiles', 'stakeholder-map', 'conflict-graph'],
  'scenarios': ['risk-monitor', 'actor-profiles', 'game-theory'],
  'game-theory': ['actor-profiles', 'negotiation-prep', 'scenarios'],
  'negotiation-prep': ['actor-profiles', 'game-theory', 'commitments'],
  'report-studio': ['risk-monitor', 'actor-profiles', 'scenarios', 'stakeholder-map'],
  'briefing': ['risk-monitor', 'early-warning', 'humanitarian'],
  'dashboard': ['risk-monitor', 'humanitarian', 'actor-profiles', 'timeline'],
  'humanitarian': ['risk-monitor', 'timeline', 'early-warning'],
  'info-environment': ['actor-profiles', 'media-roundup', 'sources-library'],
  'argus': ['risk-monitor', 'early-warning', 'timeline', 'actor-profiles'],
  'sanctions': ['actor-profiles', 'commitments'],
  'commitments': ['actor-profiles', 'timeline', 'negotiation-prep'],
  'conflict-graph': ['actor-profiles', 'timeline', 'stakeholder-map'],
  'concordia': ['actor-profiles', 'negotiation-prep', 'game-theory'],
  'mediation-design': ['actor-profiles', 'negotiation-prep', 'scenarios'],
  'dossier': ['actor-profiles', 'timeline', 'info-environment'],
};

const LEGACY_TOOL_KEYS: Record<string, string[]> = {
  'actor-profiles': ['actor_profiles', 'actor_enrichment'],
  'briefing': ['briefing_room'],
  'commitments': ['commitment_scan'],
  'conflict-graph': ['conflict_graph'],
  'daily-brief': ['daily_brief', 'auto_briefing'],
  'deep-research': ['deep_research'],
  'early-warning': ['escalation_scan'],
  'game-theory': ['game_theory'],
  'human-rights': ['human_rights'],
  'info-environment': ['info_environment'],
  'media-compass': ['media_compass', 'media_analysis'],
  'media-roundup': ['media_roundup'],
  'mediation-design': ['mediation_design'],
  'negotiation-prep': ['negotiation_prep'],
  'policy-memo': ['policy_memo'],
  'power-map': ['power_map'],
  'risk-monitor': ['risk_assessment'],
  'sanctions': ['sanctions_scan'],
  'scenarios': ['scenario_analysis'],
  'stakeholder-map': ['stakeholder_map'],
  'talking-points': ['talking_points'],
  'treaty-analyzer': ['treaty_analysis'],
  'un-toolkit': ['un_toolkit'],
};

export class ToolOutputLayer {
  constructor(private uid: string, private situationId: string) {}

  private situationRef() {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('situations').doc(this.situationId);
  }

  private toolOutputRef(collectionName: 'tool-data' | 'tools', toolId: string) {
    return this.situationRef().collection(collectionName).doc(toolId);
  }

  async getToolData(toolId: string): Promise<RelatedToolData | null> {
    try {
      for (const candidate of candidateToolIds(toolId)) {
        const versioned = await this.toolOutputRef('tool-data', candidate).get();
        if (versioned.exists) return normalizeToolDoc(versioned.data() ?? {});
      }
      for (const candidate of candidateToolIds(toolId)) {
        const legacy = await this.toolOutputRef('tools', candidate).get();
        if (legacy.exists) return normalizeToolDoc(legacy.data() ?? {});
      }
      return null;
    } catch {
      return null;
    }
  }

  async getRelatedToolData(requestingToolId: string): Promise<Record<string, RelatedToolData>> {
    const deps = TOOL_DEPENDENCIES[requestingToolId] ?? [];
    const results: Record<string, RelatedToolData> = {};
    await Promise.all(deps.slice(0, 4).map(async (dep) => {
      const data = await this.getToolData(dep);
      if (data?.data) results[dep] = data;
    }));
    return results;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await adminDb
        .collection('users').doc(this.uid)
        .collection('situations').doc(this.situationId)
        .collection('tool-data').limit(1).get();
      return true;
    } catch {
      return false;
    }
  }
}

function candidateToolIds(toolId: string): string[] {
  const canonical = canonicalToolId(toolId);
  const keys = [
    toolId,
    canonical,
    canonical.replace(/-/g, '_'),
    ...(LEGACY_TOOL_KEYS[canonical] ?? []),
  ];
  return keys.filter((key, index) => key && keys.indexOf(key) === index);
}

function normalizeToolDoc(doc: Record<string, unknown>): RelatedToolData {
  return {
    data: doc.data ?? doc.output ?? doc,
    generatedAt: coerceIsoTimestamp(doc.generatedAt) ?? '',
    version: typeof doc.version === 'number' ? doc.version : 1,
  };
}

export const __test__ = {
  candidateToolIds,
  normalizeToolDoc,
};
