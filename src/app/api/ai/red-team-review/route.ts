/**
 * POST /api/ai/red-team-review
 *
 * Agentic workflow #2 — Red-Team auto-review. Accepts any tool output
 * (toolId + payload) and returns a structured adversarial critique:
 *   - unstated assumptions
 *   - weak source diversity
 *   - missing intelligence gaps
 *   - motivated reasoning red flags
 *   - confidence-band adjustment with rationale
 *   - "what would change my mind?" question (mandatory)
 *
 * Powered by `runAgent({ personaId: 'red-team', skipCorpus: false })`.
 * The corpus is consulted so the critic can compare claims against the
 * analyst's own evidence base, not just the model's training data.
 *
 * Persistence: `users/{uid}/situations/{sitId}/tools/red-team-review`.
 *
 * Spec: docs/IMPROVEMENT_15_2026-04-26.md item #2.
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

export const maxDuration = 60;

const FlaggedAssumptionSchema = z.object({
  claim: z.string().min(5),
  whyFlagged: z.string().min(10),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
});

export const RedTeamReviewSchema = z.object({
  reviewedToolId: z.string().min(1),
  reviewedAt: z.string(),
  bluf: z.string().min(20),
  unstatedAssumptions: z.array(FlaggedAssumptionSchema),
  sourceDiversityIssues: z.array(z.string()),
  motivatedReasoningRedFlags: z.array(z.string()),
  missingIntelligenceGaps: z.array(z.string()),
  confidenceAdjustment: z.object({
    originalConfidence: z.enum(['high', 'medium', 'low', 'unknown']).optional(),
    suggestedConfidence: z.enum(['high', 'medium', 'low']),
    rationale: z.string().min(20),
  }),
  whatWouldChangeMyMind: z.string().min(20),
  recommendedFollowUps: z.array(
    z.object({
      action: z.string(),
      tool: z.string().optional(),
      urgency: z.enum(['immediate', 'short-term', 'medium-term']),
    })
  ),
});

const DEMO_REVIEW = {
  reviewedToolId: 'demo',
  reviewedAt: new Date().toISOString(),
  bluf: 'Demo: the briefing leans on a single OCHA flag without independent verification. Treat the casualty figure as low-confidence until ICRC corroborates.',
  unstatedAssumptions: [
    {
      claim: 'AFN field commander will accept a 72-hour pause',
      whyFlagged: 'No source-backed evidence of his current posture; inferred from prior pattern only.',
      severity: 'high' as const,
    },
  ],
  sourceDiversityIssues: ['All three citations come from OCHA-family sources; no Crisis Group or ICRC corroboration.'],
  motivatedReasoningRedFlags: ['Recommendation favours mediation pause, which aligns with the analyst\'s prior framing — no scenario where attribution is the better move was tested.'],
  missingIntelligenceGaps: ['No casualty verification by ICRC or local health cluster.'],
  confidenceAdjustment: {
    originalConfidence: 'medium' as const,
    suggestedConfidence: 'low' as const,
    rationale: 'Single-source corroboration on the central claim plus motivated-reasoning indicator on the recommendation.',
  },
  whatWouldChangeMyMind: 'An ICRC sitrep within 48 hours that either confirms or contradicts the casualty figure would tip this to medium or back to high confidence.',
  recommendedFollowUps: [
    { action: 'Request ICRC verification.', tool: 'source-scout', urgency: 'immediate' as const },
    { action: 'Run Brainstorming Table on attribution-vs-pause.', tool: 'brainstorming-table', urgency: 'short-term' as const },
  ],
};

export const POST = withCalibration('red-team-review', 'ai_red_team_review', {
  retrievalQuery: (_req, body) => {
    const tool = typeof body.reviewedToolId === 'string' ? body.reviewedToolId : '';
    const sit = body.situation as { region?: string } | undefined;
    return [tool, sit?.region].filter(Boolean).join(' — ') || 'red-team review';
  },
})(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));

    const requestSchema = z.object({
      reviewedToolId: z.string().min(1).max(120),
      reviewedOutput: z.unknown(),
      situation: z.any().optional(),
      originalConfidence: z.enum(['high', 'medium', 'low', 'unknown']).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { reviewedToolId, reviewedOutput, situation, originalConfidence } = validation.data;

    if (isServerDemoMode()) {
      return NextResponse.json({ ...DEMO_REVIEW, reviewedToolId });
    }

    const sit = situation as Situation | undefined;
    const situationId = sit?.id ?? '';

    // Stringify the reviewed output for the prompt; cap to 12k chars.
    let payloadString: string;
    try {
      payloadString = JSON.stringify(reviewedOutput, null, 2).slice(0, 12_000);
    } catch {
      payloadString = String(reviewedOutput).slice(0, 12_000);
    }

    const extraSystem = `You are operating as the PRAXIS Red-Team Critic. Your output is mandatory adversarial review, not validation.

Method:
- Heuer Structured Analytical Techniques (SATs): identify unstated assumptions, alternative competing hypotheses, source diversity gaps.
- Devil's advocacy: argue the strongest case AGAINST the reviewed output's central claim.
- Confidence calibration: if original confidence was asserted, suggest an adjustment with explicit rationale (ICD 203 probability language).
- Always end with whatWouldChangeMyMind — a falsifiable signal that would shift your assessment.

Your output is structured JSON conforming to RedTeamReviewSchema. NEVER hedge. If you find no issues, say so explicitly in bluf and use empty arrays — but flag at least one whatWouldChangeMyMind signal regardless.`;

    const extraPrompt = `\n\nREVIEWED TOOL OUTPUT (toolId=${reviewedToolId}${originalConfidence ? `, originalConfidence=${originalConfidence}` : ''}):
\`\`\`json
${payloadString}
\`\`\`

Compare claims in this output against the CORPUS EVIDENCE block above. Flag any claim that lacks evidence or relies on a single source. Compose your structured review now.`;

    const result = await runAgent({
      personaId: 'red-team',
      uid: user.uid,
      situationId,
      query: `red-team review of tool ${reviewedToolId}`,
      calibration: user.calibration,
      schema: RedTeamReviewSchema,
      extraSystem,
      extraPrompt,
      corpusLimit: 12,
    });

    const finalOutput = {
      ...result.output,
      reviewedToolId,
      reviewedAt: result.output.reviewedAt || new Date().toISOString(),
      confidenceAdjustment: {
        ...result.output.confidenceAdjustment,
        originalConfidence: originalConfidence ?? result.output.confidenceAdjustment.originalConfidence,
      },
    };

    if (situationId) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'red-team-review',
        profileVersion: user.calibration.provenance.profileVersion,
        output: finalOutput as Record<string, unknown>,
        metadata: {
          reviewedToolId,
          originalConfidence: originalConfidence ?? null,
          retrievalTrace: result.retrievalTrace,
          payloadBytes: payloadString.length,
        },
      }).catch((err) => console.warn('[red-team-review] saveToolOutput failed:', err));
    }

    return NextResponse.json(finalOutput);
  } catch (err) {
    if (err instanceof AgentRunnerError) {
      const status = err.code === 'unknown-persona' ? 501 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return handleRouteError(err, 'red-team-review');
  }
});
