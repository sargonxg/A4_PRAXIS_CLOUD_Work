/**
 * POST /api/ai/brief-builder
 *
 * Agentic workflow #3 — Brief Builder. The Synthesis Chair persona reads
 * the active situation's recent tool outputs, analyst notes, and corpus
 * evidence and composes a versioned, lock-able UNSC-style brief with
 * named decision points and per-section provenance.
 *
 * Persistence: `users/{uid}/situations/{sitId}/tools/brief-builder`.
 * Output is shipped through `runAgent` so the persona role + calibration
 * + corpus injection all stay aligned with Source Scout, Red-Team, and
 * Brainstorming Table.
 *
 * Brick #47 in `docs/ROUND_5_PLAN_2026-04-26.md`.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { runAgent, AgentRunnerError } from '@/lib/agents/run-agent';
import type { Situation } from '@/types/situation';

export const maxDuration = 90;

const BriefSectionSchema = z.object({
  /** Stable id (e.g. "summary", "risk", "options"). */
  id: z.string().min(1).max(60),
  heading: z.string().min(2).max(120),
  /** Markdown body, ≤ 1500 chars. */
  body: z.string().min(20).max(1500),
  /** Per-section provenance — corpus item ids the section relied on. */
  provenance: z.array(z.string()).default([]),
});

const DecisionPointSchema = z.object({
  question: z.string().min(8).max(280),
  options: z.array(z.string()).min(2).max(5),
  recommendation: z.string().min(8).max(400).optional(),
  preferredBy: z.string().max(80).optional(),
});

export const BriefBuilderSchema = z.object({
  briefId: z.string().min(1),
  generatedAt: z.string(),
  audience: z.string().min(2).max(120),
  bluf: z.string().min(20).max(800),
  sections: z.array(BriefSectionSchema).min(3).max(10),
  decisionPoints: z.array(DecisionPointSchema).min(0).max(8),
  intelligenceGaps: z.array(z.string()).default([]),
  recommendedSources: z.array(z.string()).default([]),
  /** Lock state set by the analyst from the page; not by the model. */
  locked: z.boolean().default(false),
  version: z.number().int().min(1).default(1),
});

const DEMO_BRIEF = {
  briefId: 'demo-1',
  generatedAt: new Date().toISOString(),
  audience: 'UNSC informal consultations',
  bluf: 'Demo: corridor closure + casualty signal warrants a 72-hour quiet pause; public attribution is premature until ICRC verifies.',
  sections: [
    {
      id: 'summary',
      heading: 'Summary',
      body: 'Demo. Eastern provinces remain at IPC Phase 4. Convoy access is blocked at the Kessara corridor since 2026-04-18.',
      provenance: ['#1', '#3'],
    },
    {
      id: 'risk',
      heading: 'Risk',
      body: 'Demo. Glasl 7. INFORM composite 78. 90-day forecast: ELEVATED, escalating.',
      provenance: ['#2'],
    },
    {
      id: 'options',
      heading: 'Options for decision',
      body: 'Demo. (a) Quiet 72-hour pause. (b) Public attribution + UNSC briefing.',
      provenance: ['#4'],
    },
  ],
  decisionPoints: [
    {
      question: 'Public attribution now or quiet pause?',
      options: ['Quiet 72-hour pause', 'Public attribution + UNSC briefing'],
      recommendation: 'Quiet 72-hour pause until ICRC verifies casualty figures.',
      preferredBy: 'mediator + humanitarian',
    },
  ],
  intelligenceGaps: ['No ICRC casualty verification yet.'],
  recommendedSources: ['source-scout for ICRC briefings', 'humanitarian for IPC update'],
  locked: false,
  version: 1,
};

export const POST = withCalibration('brief-builder', 'ai_brief_builder', {
  retrievalQuery: (_req, body) => {
    const sit = body.situation as { region?: string; name?: string } | undefined;
    const audience = typeof body.audience === 'string' ? body.audience : '';
    return [audience, sit?.name, sit?.region].filter(Boolean).join(' — ') || 'brief building';
  },
})(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));

    const requestSchema = z.object({
      situation: z.any().optional(),
      audience: z.string().min(2).max(120).default('analyst'),
      previousVersion: z.number().int().nonnegative().optional(),
      focus: z.string().max(500).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, audience, previousVersion, focus } = validation.data;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_BRIEF);
    }

    const sit = situation as Situation | undefined;
    const situationId = sit?.id ?? '';

    const extraSystem = `You are operating as the PRAXIS Brief Builder. Compose a UNSC-style brief for the audience named below. Output a structured brief conforming to BriefBuilderSchema with:
- BLUF (1-2 sentences, named decision)
- 3-10 sections (Summary / Risk / Drivers / Stakeholders / Options / Action / Sources etc — use sensible IDs)
- 0-8 decision points (question + 2-5 options + optional recommendation + preferredBy)
- intelligenceGaps[] (named missing perspectives)
- recommendedSources[] (PRAXIS tool ids that would close the gaps, e.g. source-scout, humanitarian)

Each section MUST cite its provenance — the corpus item ids you relied on (e.g. "[#1]", "[#3]"). Never invent figures; if a fact isn't in the corpus, mark it as an intelligence gap and recommend a tool to fill it.

Output JSON conforming to BriefBuilderSchema. Set locked=false and version=${(previousVersion ?? 0) + 1}.`;

    const extraPrompt = `\n\nAUDIENCE: ${audience}` + (focus ? `\nFOCUS: ${focus}` : '');

    const result = await runAgent({
      personaId: 'synthesis-chair',
      uid: user.uid,
      situationId,
      query: `brief for ${audience}` + (focus ? ` — ${focus}` : ''),
      calibration: user.calibration,
      schema: BriefBuilderSchema,
      extraSystem,
      extraPrompt,
      corpusLimit: 16,
    });

    const finalOutput = {
      ...result.output,
      briefId: result.output.briefId || `brief-${Date.now().toString(36)}`,
      generatedAt: result.output.generatedAt || new Date().toISOString(),
      version: (previousVersion ?? 0) + 1,
      locked: false,
    };

    if (situationId) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'brief-builder',
        profileVersion: user.calibration.provenance.profileVersion,
        output: finalOutput as Record<string, unknown>,
        metadata: {
          audience,
          previousVersion: previousVersion ?? 0,
          retrievalTrace: result.retrievalTrace,
        },
      }).catch((err) => console.warn('[brief-builder] saveToolOutput failed:', err));
    }

    return NextResponse.json(finalOutput);
  } catch (err) {
    if (err instanceof AgentRunnerError) {
      const status = err.code === 'unknown-persona' ? 501 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return handleRouteError(err, 'brief-builder');
  }
});
