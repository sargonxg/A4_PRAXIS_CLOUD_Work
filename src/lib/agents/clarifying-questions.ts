/**
 * Clarifying Questions framework.
 *
 * Authored 2026-04-26 round 4. The user flagged that AI tools should be
 * able to ASK the analyst for context when the run can't proceed cleanly:
 * "before I draft this risk score, are these the actors you want me to
 * cover?" / "what's your appetite for public attribution?". The analyst
 * answers via a popup routed through Ask PRAXIS; the route resumes with
 * the answers attached.
 *
 * Contract: any AI route can return an HTTP 200 response with
 * `{ status: 'clarification-needed', clarification: ClarificationRequest }`
 * INSTEAD of its normal output. The page detects the discriminator and
 * renders `<ClarifyingQuestionsModal />` (queued — built next round).
 *
 * Spec: docs/IMPROVEMENT_15_2026-04-26.md round-4 brick.
 */

import { z } from 'zod';

export const ClarifyingQuestionSchema = z.object({
  /** Stable id used by the page to track answers per question. */
  id: z.string().min(1).max(80),
  /** Human-readable question. Must be a single, focused sentence. */
  prompt: z.string().min(8).max(400),
  /** Optional explanatory line shown under the prompt — why we're asking. */
  why: z.string().max(400).optional(),
  /** Input shape. `single-choice` and `multi-choice` require `options`. */
  inputType: z.enum(['short-text', 'long-text', 'single-choice', 'multi-choice', 'yes-no']),
  /** Choices when inputType is single-choice / multi-choice. */
  options: z
    .array(
      z.object({
        value: z.string().min(1).max(120),
        label: z.string().min(1).max(200),
      })
    )
    .optional(),
  /** Whether the analyst MUST answer to proceed. Default true. */
  required: z.boolean().default(true),
  /** Tag the question by topic so the page can group questions sensibly. */
  topic: z
    .enum(['scope', 'sources', 'audience', 'red-line', 'tradeoff', 'data', 'other'])
    .default('scope'),
});

export const ClarificationRequestSchema = z.object({
  /** Tool that paused, e.g. "risk-monitor". */
  toolId: z.string().min(1).max(120),
  /** Pause reason — short summary the popup headline shows. */
  reason: z.string().min(8).max(280),
  /** 1–5 questions the analyst must answer to resume. */
  questions: z.array(ClarifyingQuestionSchema).min(1).max(5),
  /** Optional resume payload the route wants echoed back unchanged. */
  resumeContext: z.record(z.string(), z.unknown()).optional(),
  /** Echo back so client-side resume can pick the right route. */
  resumeRoute: z.string().min(1).max(200),
});

export const ClarificationResponseSchema = z.object({
  status: z.literal('clarification-needed'),
  clarification: ClarificationRequestSchema,
});

export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;
export type ClarificationRequest = z.infer<typeof ClarificationRequestSchema>;
export type ClarificationResponse = z.infer<typeof ClarificationResponseSchema>;

export const ClarifyingAnswerSchema = z.object({
  questionId: z.string().min(1).max(80),
  /** All answer types are stringified for transport — parse on the route. */
  value: z.union([z.string(), z.array(z.string()), z.boolean()]),
});

export const ClarifyingAnswersBundleSchema = z.object({
  toolId: z.string().min(1).max(120),
  resumeContext: z.record(z.string(), z.unknown()).optional(),
  answers: z.array(ClarifyingAnswerSchema).min(1).max(20),
});

export type ClarifyingAnswer = z.infer<typeof ClarifyingAnswerSchema>;
export type ClarifyingAnswersBundle = z.infer<typeof ClarifyingAnswersBundleSchema>;

/**
 * Helper an AI route uses to short-circuit with a clarification request.
 *
 *   if (!body.actors?.length) {
 *     return clarificationResponse({
 *       toolId: 'risk-monitor',
 *       reason: 'I need to know which actors to cover before scoring.',
 *       questions: [
 *         { id: 'actors', prompt: 'Which actors should I include?', inputType: 'long-text' },
 *       ],
 *       resumeRoute: '/api/ai/risk-assessment',
 *     });
 *   }
 *
 * Always returns HTTP 200 — the discriminator lives in the body so a
 * caller that doesn't know about clarifications gets a normal-looking
 * structured payload they can ignore safely.
 */
export function clarificationResponse(req: Omit<ClarificationRequest, 'questions'> & {
  questions: ClarifyingQuestion[];
}): Response {
  // Validate before we ship — fail fast in dev if a route emits a bad
  // clarification (don't ship a half-baked popup contract to the UI).
  const payload: ClarificationResponse = {
    status: 'clarification-needed',
    clarification: ClarificationRequestSchema.parse(req),
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Type guard the page uses to detect a clarification response without
 * coupling to Zod at call sites.
 */
export function isClarificationResponse(value: unknown): value is ClarificationResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as { status?: unknown };
  return v.status === 'clarification-needed';
}

/** Compose a flat answers map for prompt injection. */
export function answersToPromptBlock(bundle: ClarifyingAnswersBundle): string {
  const lines: string[] = [];
  lines.push('## ANALYST ANSWERS TO CLARIFYING QUESTIONS');
  for (const a of bundle.answers) {
    const valueStr = Array.isArray(a.value) ? a.value.join(', ') : String(a.value);
    lines.push(`- ${a.questionId}: ${valueStr}`);
  }
  return lines.join('\n');
}
