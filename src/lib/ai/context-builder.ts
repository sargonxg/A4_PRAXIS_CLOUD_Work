/**
 * Graph-aware context builder for AI tool routes.
 *
 * Extends the existing buildToolContext (situation-context.ts) with live
 * graph data from Firestore: pivot actors, factions, escalation assessment,
 * negotiation space, and prior tool outputs.
 *
 * Used by all 21 AI route handlers in src/app/api/ai/
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';

export interface SituationContext {
  situation: Record<string, unknown>;
  graphAnalysis: Record<string, unknown>;
  graphSnapshot: Record<string, unknown>;
  toolOutputs: Record<string, Record<string, unknown>>;
  documents: Array<{ filename: string; extractedText: string }>;
}

/**
 * Build full situation context including graph data and prior tool outputs.
 *
 * @param uid - Firebase user ID
 * @param sitId - Situation document ID
 * @param relevantTools - Tool names to load as prior context (from dependency map)
 */
export async function buildSituationContext(
  uid: string,
  sitId: string,
  relevantTools: string[] = [],
): Promise<SituationContext> {
  const sitRef = doc(db, 'users', uid, 'situations', sitId);
  const graphAnalysisRef = doc(db, 'users', uid, 'situations', sitId, 'graph', 'analysis');
  const graphSnapshotRef = doc(db, 'users', uid, 'situations', sitId, 'graph', 'snapshot');

  // Parallel reads
  const [sitSnap, analysisSnap, snapshotSnap] = await Promise.all([
    getDoc(sitRef),
    getDoc(graphAnalysisRef),
    getDoc(graphSnapshotRef),
  ]);

  const situation = (sitSnap.data() as Record<string, unknown>) || {};
  const graphAnalysis = (analysisSnap.data() as Record<string, unknown>) || {};
  // Snapshot can be huge — only read top-level metadata fields
  const rawSnapshot = snapshotSnap.data() || {};
  const graphSnapshot: Record<string, unknown> = {
    nodeCount: (rawSnapshot.nodes as unknown[])?.length ?? 0,
    edgeCount: (rawSnapshot.edges as unknown[])?.length ?? 0,
    updatedAt: rawSnapshot.updatedAt,
  };

  // Load prior tool outputs in parallel
  const toolOutputs: Record<string, Record<string, unknown>> = {};
  if (relevantTools.length > 0) {
    const toolDocs = await Promise.all(
      relevantTools.map((tool) =>
        getDoc(doc(db, 'users', uid, 'situations', sitId, 'tools', tool)),
      ),
    );
    for (let i = 0; i < relevantTools.length; i++) {
      const snap = toolDocs[i];
      if (snap.exists()) {
        toolOutputs[relevantTools[i]] = snap.data() as Record<string, unknown>;
      }
    }
  }

  // Load documents (filename + first 2000 chars of extracted text only)
  const docsSnap = await getDocs(
    collection(db, 'users', uid, 'situations', sitId, 'documents'),
  );
  const documents = docsSnap.docs.map((d) => {
    const data = d.data();
    return {
      filename: (data.filename as string) || d.id,
      extractedText: ((data.extractedText as string) || '').slice(0, 2000),
    };
  });

  return { situation, graphAnalysis, graphSnapshot, toolOutputs, documents };
}

/**
 * Convert a SituationContext into a structured text block for AI prompts.
 * Token-efficient: summaries only, no full graph dump.
 */
export function contextToPrompt(ctx: SituationContext): string {
  const { situation, graphAnalysis, toolOutputs, documents } = ctx;
  const lines: string[] = [];

  // Situation header
  const name = (situation.name as string) || 'Unknown';
  const region = (situation.region as string) || '';
  const type = (situation.type as string) || '';
  const description = (situation.description as string) || '';
  lines.push(`## SITUATION: ${name}`);
  if (region) lines.push(`Region: ${region}`);
  if (type) lines.push(`Type: ${type}`);
  if (description) lines.push(`\n${description}`);

  // Graph analysis
  const pivotActors = graphAnalysis.pivotActors as Array<{ label: string; edges: number }> | undefined;
  if (pivotActors && pivotActors.length > 0) {
    lines.push('\n## KEY ACTORS (from conflict graph):');
    pivotActors.slice(0, 8).forEach((a) => {
      lines.push(`- ${a.label} (${a.edges} connections)`);
    });
  }

  const factionMap = graphAnalysis.factionMap as Record<string, { name: string; actors: Array<{ label: string }> }> | undefined;
  if (factionMap && Object.keys(factionMap).length > 0) {
    lines.push('\n## FACTIONS:');
    Object.values(factionMap).forEach((f) => {
      const actorNames = f.actors?.slice(0, 3).map((a) => a.label).join(', ');
      lines.push(`- ${f.name}: ${actorNames}`);
    });
  }

  const escalation = graphAnalysis.escalationAssessment as { glaslStage?: number; trajectory?: string } | undefined;
  if (escalation?.glaslStage) {
    lines.push(`\n## ESCALATION: Glasl Stage ${escalation.glaslStage}/9 — ${escalation.trajectory || 'stable'}`);
  }

  const negSpace = graphAnalysis.negotiationSpace as { zopa?: Array<{ interest: string }>; hardConstraints?: Array<{ label: string }> } | undefined;
  if (negSpace?.zopa?.length) {
    const zopaNames = negSpace.zopa.slice(0, 3).map((z) => z.interest).join(', ');
    lines.push(`\n## NEGOTIATION: ZOPA candidates: ${zopaNames}`);
  }
  if (negSpace?.hardConstraints?.length) {
    const constraintNames = negSpace.hardConstraints.slice(0, 2).map((c) => c.label).join(', ');
    lines.push(`Hard Constraints: ${constraintNames}`);
  }

  // Prior tool outputs
  for (const [toolName, toolData] of Object.entries(toolOutputs)) {
    const summary = JSON.stringify(toolData).slice(0, 1000);
    lines.push(`\n## PREVIOUS ANALYSIS (${toolName}):\n${summary}`);
  }

  // Documents
  if (documents.length > 0) {
    lines.push('\n## ANALYST DOCUMENTS:');
    documents.slice(0, 5).forEach((d) => {
      lines.push(`### ${d.filename}\n${d.extractedText}`);
    });
  }

  return lines.join('\n');
}
