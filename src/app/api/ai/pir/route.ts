import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';
import { isServerDemoMode } from '@/lib/demo/demo-mode';

const DEMO_RESPONSE = { answers: [{ pirId: 'pir-1', question: 'What is the current military posture of the GoN AFN in the Eastern Provinces?', answer: 'Demo: AFN maintains defensive posture along Line 7 with approximately 3 brigade-equivalent forces. No major offensive operations observed.', confidence: 'medium', evidenceBasis: ['UNMN CIVPOL field reports', 'ACLED Q1 2026 data'], keyGaps: ['Real-time troop positioning', 'Reserve force deployment'], collectionPriorities: ['Source cultivation in AFN logistics', 'Aerial/satellite imagery of Kessara base'], updatedAt: new Date().toISOString() }], overallIntelligenceGap: 'Significant gaps remain in real-time military disposition and intent signaling from both parties.', recommendedCollectionPlan: '1) Task UNMN field observers to document AFN unit deployments weekly; 2) Establish contact with local informants in contested areas; 3) Cross-reference official communiques with field reporting.' };

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PIRAnswerSchema = z.object({
  pirId: z.string(),
  question: z.string(),
  answer: z.string().describe('Direct answer to the PIR based on available intelligence'),
  confidence: z.enum(['high', 'medium', 'low', 'insufficient_data']),
  evidenceBasis: z.array(z.string()).describe('Sources and evidence underpinning this answer'),
  keyGaps: z.array(z.string()).describe('Information gaps that prevent a definitive answer'),
  collectionPriorities: z.array(z.string()).describe('Specific collection tasks to fill gaps'),
  updatedAt: z.string(),
});

const PIRBatchAnswerSchema = z.object({
  answers: z.array(PIRAnswerSchema),
  overallIntelligenceGap: z.string().describe('Summary of most critical gaps across all PIRs'),
  recommendedCollectionPlan: z.string().describe('Prioritized collection plan to address gaps'),
});

// ---------------------------------------------------------------------------
// Firestore PIR type
// ---------------------------------------------------------------------------

interface PIR {
  id: string;
  question: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  answer?: string;
  confidence?: 'high' | 'medium' | 'low' | 'insufficient_data';
  lastAnsweredAt?: string;
}

// ---------------------------------------------------------------------------
// GET — list PIRs for a situation
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId');
    if (!situationId) return NextResponse.json({ error: 'situationId required' }, { status: 400 });

    const db = getAdminDbOrThrow();
    const snap = await db
      .collection('users').doc(user.uid)
      .collection('situations').doc(situationId)
      .collection('pirs')
      .orderBy('createdAt', 'desc')
      .get();

    const pirs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ pirs });
  } catch (err) {
    return handleRouteError(err, 'pir/get');
  }
});

// ---------------------------------------------------------------------------
// POST — create a new PIR, or answer existing PIRs
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json() as {
      action: 'create' | 'answer' | 'delete';
      situationId: string;
      situation?: Situation;
      // create
      question?: string;
      category?: string;
      priority?: PIR['priority'];
      // answer
      pirIds?: string[];
      // delete
      pirId?: string;
    };

    const { action, situationId } = body;
    if (!situationId) return NextResponse.json({ error: 'situationId required' }, { status: 400 });

    const db = getAdminDbOrThrow();
    const pirsRef = db
      .collection('users').doc(user.uid)
      .collection('situations').doc(situationId)
      .collection('pirs');

    // ── Create ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { question, category = 'general', priority = 'medium' } = body;
      if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });

      const newDoc = await pirsRef.add({
        question,
        category,
        priority,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ id: newDoc.id, question, category, priority });
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!body.pirId) return NextResponse.json({ error: 'pirId required' }, { status: 400 });
      await pirsRef.doc(body.pirId).delete();
      return NextResponse.json({ deleted: true });
    }

    // ── Answer ──────────────────────────────────────────────────────────────
    if (action === 'answer') {
      const creditCheck = await checkAndDeductCredits('ai_pir', 'PIR answer generation');
      if (!creditCheck.allowed) return creditCheck.response!;

      if (isServerDemoMode()) {
        return NextResponse.json(DEMO_RESPONSE);
      }

      // Fetch the PIRs to answer
      const pirIds = body.pirIds ?? [];
      const pirDocs = pirIds.length > 0
        ? await Promise.all(pirIds.map((id) => pirsRef.doc(id).get()))
        : (await pirsRef.orderBy('createdAt', 'desc').limit(10).get()).docs;

      const pirs: PIR[] = pirDocs
        .filter((d) => 'exists' in d ? d.exists : true)
        .map((d) => ({ id: d.id, ...d.data() } as PIR));

      if (pirs.length === 0) return NextResponse.json({ answers: [] });

      // Build context
      const { situation } = body;
      const sitContext = situation ? buildToolContext(situation) : '';
      const graphCtx = await buildGraphContext(user.uid, situationId, 'pir').catch(() => '');

      const pirList = pirs.map((p, i) =>
        `PIR ${i + 1} [ID: ${p.id}] [${p.priority.toUpperCase()}] [${p.category}]\nQuestion: ${p.question}`
      ).join('\n\n');

      const result = await generateText({
        model: getProModel(),
        output: Output.object({ schema: PIRBatchAnswerSchema }),
        prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}You are an intelligence officer answering Priority Intelligence Requirements (PIRs) for a conflict situation.

PRIORITY INTELLIGENCE REQUIREMENTS TO ANSWER:
${pirList}

For each PIR:
1. Provide a direct, substantive answer based on all available context
2. Rate confidence: high (strong evidence, consistent indicators), medium (partial evidence, some gaps), low (limited evidence, inferential), insufficient_data (cannot answer)
3. List specific evidence sources (use tags like [GRAPH], [ACLED], [GDELT], [ANALYSIS], [AI Assessment])
4. Identify key information gaps preventing certainty
5. Specify concrete collection tasks to fill gaps

The answer should be actionable and directly address what the analyst needs to know. Do not hedge excessively — give the best assessment the evidence supports.`,
        system: 'You are a senior intelligence officer answering Priority Intelligence Requirements for conflict analysts and diplomatic staff. Provide direct, evidence-grounded answers with calibrated confidence and specific collection guidance.',
      });

      // Persist answers back to Firestore
      const now = new Date().toISOString();
      await Promise.all(
        result.output.answers.map((ans) =>
          pirsRef.doc(ans.pirId).update({
            answer: ans.answer,
            confidence: ans.confidence,
            lastAnsweredAt: now,
          }).catch(() => { /* non-critical */ })
        )
      );

      return NextResponse.json(result.output);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return handleRouteError(err, 'pir');
  }
});
