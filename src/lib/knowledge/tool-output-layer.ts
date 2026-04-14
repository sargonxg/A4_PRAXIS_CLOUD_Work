/**
 * PRAXIS Tool Output Layer — cross-referenced versioned tool outputs.
 * Reads from Firestore tool-data subcollection.
 * Returns data from related tools to enrich context.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { RelatedToolData } from './types';

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

export class ToolOutputLayer {
  constructor(private uid: string, private situationId: string) {}

  private toolDataRef(toolId: string) {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('situations').doc(this.situationId)
      .collection('tool-data').doc(toolId);
  }

  async getToolData(toolId: string): Promise<RelatedToolData | null> {
    try {
      const doc = await this.toolDataRef(toolId).get();
      if (!doc.exists) return null;
      const d = doc.data()!;
      return { data: d.data ?? d, generatedAt: d.generatedAt ?? '', version: d.version ?? 1 };
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
