import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getToolData } from '@/lib/firebase/tool-data-service';
import { adminDb } from '@/lib/firebase/admin';

// Map of all known tool IDs (mirrors HREF_TO_TOOL_ID values in app-sidebar)
const ALL_TOOL_IDS = [
  'documents',
  'sources-library',
  'timeline',
  'humanitarian',
  'calendar',
  'actor-profiles',
  'risk-monitor',
  'early-warning',
  'conflict-graph',
  'stakeholder-map',
  'power-map',
  'compare',
  'dossier',
  'talking-points',
  'briefing',
  'auto-briefing',
  'policy-memo',
  'un-toolkit',
  'scenarios',
  'negotiation-prep',
  'game-theory',
  'mediation-design',
  'argus',
  'media-compass',
  'media-roundup',
  'info-environment',
  'sanctions',
  'commitments',
  'treaty-analyzer',
  'geospatial-monitor',
  'alert-center',
  'source-monitor',
  'export-center',
] as const;

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Research progress helpers
// ---------------------------------------------------------------------------

interface ResearchProgress {
  status: string;
  sourcesQueried?: number;
  sourcesTotal?: number;
  startedAt?: string;
  error?: string;
}

async function getResearchProgress(
  uid: string,
  situationId: string,
  toolId: string
): Promise<ResearchProgress | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb
      .collection('users')
      .doc(uid)
      .collection('situations')
      .doc(situationId)
      .collection('research-status')
      .doc(toolId)
      .get();

    if (!snap.exists) return null;
    return snap.data() as ResearchProgress;
  } catch {
    return null;
  }
}

async function getAllResearchProgress(
  uid: string,
  situationId: string
): Promise<Record<string, ResearchProgress>> {
  if (!adminDb) return {};
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('situations')
      .doc(situationId)
      .collection('research-status')
      .get();

    const result: Record<string, ResearchProgress> = {};
    for (const doc of snapshot.docs) {
      result[doc.id] = doc.data() as ResearchProgress;
    }
    return result;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Status builder
// ---------------------------------------------------------------------------

function buildToolStatus(
  toolId: string,
  toolData: { data: unknown; generatedAt: string } | null,
  researchProgress: ResearchProgress | null
) {
  const generatedAt = toolData?.generatedAt ?? null;
  const now = Date.now();

  // Determine health
  let health: 'green' | 'yellow' | 'red' = 'red';
  if (generatedAt) {
    const age = now - new Date(generatedAt).getTime();
    health = age > STALE_THRESHOLD_MS ? 'yellow' : 'green';
  }

  // Research status
  const researchStatus = researchProgress?.status ?? 'idle';

  // Extract confidence and sources from tool data if available
  let confidence: number | null = null;
  let sourcesUsed: string[] = [];

  if (toolData?.data && typeof toolData.data === 'object') {
    const d = toolData.data as Record<string, unknown>;

    // Confidence may be at top level or nested
    if (typeof d.confidence === 'number') {
      confidence = d.confidence;
    } else if (typeof d.overallConfidence === 'number') {
      confidence = d.overallConfidence;
    }

    // Sources may be stored under various keys
    if (Array.isArray(d.sourcesUsed)) {
      sourcesUsed = d.sourcesUsed as string[];
    } else if (Array.isArray(d.sources)) {
      sourcesUsed = (d.sources as Array<string | { name?: string }>).map((s) =>
        typeof s === 'string' ? s : (s.name ?? 'unknown')
      );
    } else if (Array.isArray(d.dataSources)) {
      sourcesUsed = d.dataSources as string[];
    }
  }

  return {
    health,
    researchStatus,
    generatedAt,
    confidence,
    sourcesUsed,
    lastError: researchProgress?.error ?? null,
  };
}

// ---------------------------------------------------------------------------
// GET /api/tool-status?toolId=X&situationId=Y
// If no toolId, returns status for all tools
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const situationId = searchParams.get('situationId');

  if (!situationId) {
    return NextResponse.json({ error: 'situationId required' }, { status: 400 });
  }

  const uid = user.uid;

  // Demo users get neutral defaults
  if (user.isDemo) {
    if (toolId) {
      return NextResponse.json(buildToolStatus(toolId, null, null));
    }
    const result: Record<string, ReturnType<typeof buildToolStatus>> = {};
    for (const id of ALL_TOOL_IDS) {
      result[id] = buildToolStatus(id, null, null);
    }
    return NextResponse.json(result);
  }

  try {
    if (toolId) {
      // Single tool status
      const [toolData, researchProgress] = await Promise.all([
        getToolData(uid, situationId, toolId).catch(() => null),
        getResearchProgress(uid, situationId, toolId),
      ]);

      return NextResponse.json(buildToolStatus(toolId, toolData, researchProgress));
    }

    // All tools — use dashboard-snapshot for bulk health + individual research statuses
    const [snapshot, activeResearch] = await Promise.all([
      getToolData(uid, situationId, 'dashboard-snapshot').catch(() => null),
      getAllResearchProgress(uid, situationId),
    ]);

    // Parse dashboard snapshot for seeded tools and timestamps
    const snapshotData = snapshot?.data as Record<string, unknown> | null;
    const seededTools: string[] = Array.isArray(snapshotData?.seededTools)
      ? (snapshotData.seededTools as string[])
      : [];
    const toolTimestamps: Record<string, string> =
      (snapshotData?.toolTimestamps as Record<string, string>) ?? {};

    const result: Record<string, ReturnType<typeof buildToolStatus>> = {};

    for (const id of ALL_TOOL_IDS) {
      // Build synthetic tool data from the snapshot
      let syntheticToolData: { data: unknown; generatedAt: string } | null = null;

      if (seededTools.includes(id)) {
        syntheticToolData = {
          data: null,
          generatedAt: toolTimestamps[id] ?? snapshot?.generatedAt ?? new Date().toISOString(),
        };
      }

      result[id] = buildToolStatus(id, syntheticToolData, activeResearch[id] ?? null);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[tool-status] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load tool status' }, { status: 500 });
  }
});
