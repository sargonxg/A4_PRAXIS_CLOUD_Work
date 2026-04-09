/**
 * Research API — Triggers background research for a tool
 *
 * POST /api/research — Start background research for a tool
 * GET  /api/research?toolId=X&situationId=Y — Get research status
 *
 * This enables the "always thinking" pattern: tools can trigger research
 * that runs in the background, saves to Firestore, and updates semaphores.
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getToolData, saveToolData } from '@/lib/firebase/tool-data-service';
import { adminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Research status helpers
// ---------------------------------------------------------------------------

interface ResearchProgress {
  status: 'pending' | 'fetching-sources' | 'synthesizing' | 'saving' | 'complete' | 'failed';
  toolId: string;
  sourcesQueried: number;
  sourcesTotal: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

function researchStatusRef(uid: string, situationId: string, toolId: string) {
  if (!adminDb) throw new Error('Firebase Admin not initialized');
  return adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('research-status').doc(toolId);
}

async function saveResearchStatus(
  uid: string,
  situationId: string,
  progress: ResearchProgress
): Promise<void> {
  const ref = researchStatusRef(uid, situationId, progress.toolId);
  await ref.set(progress, { merge: true });
}

async function getResearchStatus(
  uid: string,
  situationId: string,
  toolId: string
): Promise<ResearchProgress | null> {
  const ref = researchStatusRef(uid, situationId, toolId);
  const snap = await ref.get();
  return snap.exists ? (snap.data() as ResearchProgress) : null;
}

// ---------------------------------------------------------------------------
// GET — Check research status
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const situationId = searchParams.get('situationId');

  if (!situationId) {
    return NextResponse.json({ error: 'situationId required' }, { status: 400 });
  }

  if (toolId) {
    // Single tool
    const [progress, toolData] = await Promise.all([
      getResearchStatus(user.uid, situationId, toolId).catch(() => null),
      getToolData(user.uid, situationId, toolId).catch(() => null),
    ]);

    const now = Date.now();
    const generatedAt = toolData?.generatedAt ?? null;
    const age = generatedAt ? now - new Date(generatedAt).getTime() : Infinity;
    const STALE_MS = 24 * 60 * 60 * 1000;

    return NextResponse.json({
      toolId,
      health: toolData ? (age > STALE_MS ? 'yellow' : 'green') : 'red',
      researchStatus: progress?.status ?? 'idle',
      generatedAt,
      sourcesQueried: progress?.sourcesQueried ?? 0,
      sourcesTotal: progress?.sourcesTotal ?? 0,
      startedAt: progress?.startedAt ?? null,
      error: progress?.error ?? null,
    });
  }

  // All tools — fetch dashboard snapshot + any active research statuses
  const [snapshot, researchDocs] = await Promise.all([
    getToolData(user.uid, situationId, 'dashboard-snapshot').catch(() => null),
    adminDb
      ? adminDb
          .collection('users').doc(user.uid)
          .collection('situations').doc(situationId)
          .collection('research-status')
          .get()
          .catch(() => null)
      : null,
  ]);

  const snapshotData = (snapshot?.data ?? {}) as {
    seededTools?: string[];
    toolTimestamps?: Record<string, string>;
  };
  const seededTools = snapshotData.seededTools ?? [];
  const toolTimestamps = snapshotData.toolTimestamps ?? {};
  const now = Date.now();
  const STALE_MS = 24 * 60 * 60 * 1000;

  const researchMap: Record<string, ResearchProgress> = {};
  researchDocs?.forEach((doc) => {
    researchMap[doc.id] = doc.data() as ResearchProgress;
  });

  const result: Record<string, unknown> = {};
  for (const toolId of seededTools) {
    const ts = toolTimestamps[toolId];
    const age = ts ? now - new Date(ts).getTime() : Infinity;
    result[toolId] = {
      health: age > STALE_MS ? 'yellow' : 'green',
      researchStatus: researchMap[toolId]?.status ?? 'idle',
      generatedAt: ts ?? null,
    };
  }

  // Include any tools with active research that aren't yet seeded
  for (const [toolId, progress] of Object.entries(researchMap)) {
    if (!result[toolId]) {
      result[toolId] = {
        health: 'red',
        researchStatus: progress.status,
        generatedAt: null,
      };
    }
  }

  return NextResponse.json(result);
});

// ---------------------------------------------------------------------------
// POST — Trigger background research
// ---------------------------------------------------------------------------

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { toolId, situationId, situation } = body;

  if (!toolId || !situationId) {
    return NextResponse.json(
      { error: 'toolId and situationId required' },
      { status: 400 }
    );
  }

  // Save initial pending status
  const progress: ResearchProgress = {
    status: 'pending',
    toolId,
    sourcesQueried: 0,
    sourcesTotal: 0,
    startedAt: new Date().toISOString(),
  };
  await saveResearchStatus(user.uid, situationId, progress);

  // Kick off background research using next/server after()
  // This runs after the response is sent, within the same Cloud Run instance
  after(async () => {
    try {
      // Dynamic import to avoid circular deps and keep the route handler lean
      const { executeBackgroundResearch, getToolResearchConfig } =
        await import('@/lib/services/background-research');

      const config = getToolResearchConfig(toolId);
      if (!config) {
        await saveResearchStatus(user.uid, situationId, {
          ...progress,
          status: 'failed',
          error: `No research config for tool: ${toolId}`,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      await executeBackgroundResearch({
        uid: user.uid,
        situationId,
        toolId,
        situationName: situation?.name ?? 'Unknown Situation',
        country: situation?.region ?? situation?.country ?? '',
        actors: situation?.actors ?? [],
        researchConfig: config,
      });
    } catch (err) {
      console.error(`[research] Background research failed for ${toolId}:`, err);
      await saveResearchStatus(user.uid, situationId, {
        ...progress,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  });

  return NextResponse.json({
    status: 'pending',
    message: `Background research started for ${toolId}`,
  });
});
