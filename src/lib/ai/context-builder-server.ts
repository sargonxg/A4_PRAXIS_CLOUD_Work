/**
 * Server-side context builder for AI API routes.
 * Uses Firebase Admin SDK (adminDb) — for use in Next.js API routes only.
 *
 * Reads graph analysis + prior tool outputs from Firestore and returns
 * a structured context string to prepend to every AI prompt.
 *
 * v3.0: Also integrates the Situation Knowledge Core (SKC) 4-layer GraphRAG
 * system — graph analytics, vector search, TTL-cached feeds, cross-tool data.
 * SKC enrichment is additive and degrades gracefully if unavailable.
 *
 * Client-side equivalent: src/lib/ai/context-builder.ts (uses client SDK)
 */
import { adminDb } from '@/lib/firebase/admin';

/**
 * Build graph-enriched context for a specific tool.
 * Falls back gracefully if no graph data exists yet.
 *
 * v3.0: Appends SKC (vector search results + feed cache + cross-tool data)
 * as an additional context layer. All SKC enrichment is best-effort.
 *
 * @param uid - Firebase user ID (from withAuth)
 * @param situationId - Active situation ID
 * @param toolKey - Tool name key used by context retrieval.
 * @param loadAll - If true, load all tool outputs (for Briefing)
 */
export async function buildGraphContext(
  uid: string,
  situationId: string,
  toolKey: string,
  loadAll = false,
): Promise<string> {
  if (!adminDb) return '';

  // Full DIALECTICA context will enter through ContextCapsule adapters. This
  // legacy builder keeps only live SKC, annotation, and memory context.
  void loadAll;
  const skcCtx = await buildSKCContext(uid, situationId, toolKey).catch(() => '');

  const [annotationCtx, memoryCtx] = await Promise.all([
    buildAnnotationContext(uid, situationId, toolKey).catch(() => ''),
    buildMemoryContext(uid).catch(() => ''),
  ]);
  return skcCtx + annotationCtx + memoryCtx;
}

/**
 * Builds SKC (Situation Knowledge Core) enrichment context.
 * Exported for routes that want direct control over when SKC context is fetched.
 *
 * Returns a formatted string ready to append to any system prompt.
 * Returns '' gracefully if SKC is unavailable or the module failed to import.
 */
export async function buildSKCContext(
  uid: string,
  situationId: string,
  toolId: string,
): Promise<string> {
  if (!uid || !situationId) return '';

  try {
    // Dynamic import so that SKC module errors never break existing routes
    const { SituationKnowledgeCore } = await import('@/lib/knowledge');
    const skc = new SituationKnowledgeCore(uid, situationId);
    const ctx = await skc.getToolContext(toolId);

    const lines: string[] = [];

    // Graph nodes — most semantically relevant entities
    if (ctx.graph?.nodes && ctx.graph.nodes.length > 0) {
      lines.push('\n## KNOWLEDGE GRAPH — Relevant Entities (SKC):');
      ctx.graph.nodes.slice(0, 12).forEach((n) => {
        const conf = n.confidence ? ` [${n.confidence}]` : '';
        lines.push(`- [${n.type}] ${n.name}${conf}${n.description ? ': ' + n.description.slice(0, 120) : ''}`);
      });
    }

    // Graph metrics — structural intelligence
    if (ctx.graph?.metrics) {
      const m = ctx.graph.metrics;
      if (m.density !== undefined || m.mostCentralNode) {
        lines.push('\n## GRAPH METRICS:');
        if (m.mostCentralNode) lines.push(`- Most central actor: ${m.mostCentralNode}`);
        if (m.density !== undefined) lines.push(`- Network density: ${m.density.toFixed(3)} (${m.density > 0.4 ? 'dense — many cross-linkages' : 'sparse — fragmented actors'})`);
        if (m.communities !== undefined) lines.push(`- Detected factions/communities: ${m.communities}`);
      }
    }

    // Feed data — live intelligence
    if (ctx.feedData && Object.keys(ctx.feedData).length > 0) {
      lines.push('\n## LIVE DATA FEEDS (cached):');
      for (const [feedName, feedData] of Object.entries(ctx.feedData)) {
        const preview = JSON.stringify(feedData).slice(0, 400);
        lines.push(`- [${feedName}] ${preview}`);
      }
    }

    // Cross-tool outputs (related tool data)
    if (ctx.relatedToolData && Object.keys(ctx.relatedToolData).length > 0) {
      lines.push('\n## CROSS-TOOL INTELLIGENCE (related outputs):');
      for (const [relToolId, relData] of Object.entries(ctx.relatedToolData)) {
        if (!relData) continue;
        const preview = JSON.stringify(relData).slice(0, 500);
        lines.push(`- [${relToolId}] ${preview}`);
      }
    }

    return lines.length > 0 ? lines.join('\n') : '';
  } catch {
    // SKC unavailable — non-critical, don't break the route
    return '';
  }
}

/**
 * Loads analyst memory patterns (preferences learned over time) as context.
 */
async function buildMemoryContext(uid: string): Promise<string> {
  const { buildAnalystMemoryContext } = await import('@/lib/services/analyst-memory');
  return buildAnalystMemoryContext(uid, 2);
}

/**
 * Loads analyst annotations for a given tool output and formats them
 * as additional context. Only disagree/correct/enhance/question types
 * with substantive notes are included — agree/classify are skipped as
 * they don't provide corrective information for regeneration.
 */
async function buildAnnotationContext(
  uid: string,
  situationId: string,
  toolId: string,
): Promise<string> {
  if (!adminDb || !uid || !situationId || !toolId) return '';

  try {
    const snap = await adminDb
      .collection('users').doc(uid)
      .collection('situations').doc(situationId)
      .collection('tools').doc(toolId)
      .collection('annotations')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snap.empty) return '';

    const actionable = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as { id: string; type: string; note: string; correction?: string; targetText?: string }))
      .filter((a) => ['disagree', 'correct', 'enhance', 'question'].includes(a.type));

    if (actionable.length === 0) return '';

    const lines: string[] = ['\n## ANALYST ANNOTATIONS (from prior regeneration — incorporate these):'];
    for (const ann of actionable) {
      const target = ann.targetText ? ` (re: "${ann.targetText.slice(0, 60)}…")` : '';
      lines.push(`- [${ann.type.toUpperCase()}]${target} ${ann.note}`);
      if (ann.correction) {
        lines.push(`  → Suggested correction: ${ann.correction}`);
      }
    }
    lines.push('(Address all DISAGREE/CORRECT annotations; integrate ENHANCE suggestions; answer QUESTION items.)');
    return lines.join('\n');
  } catch {
    return '';
  }
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
