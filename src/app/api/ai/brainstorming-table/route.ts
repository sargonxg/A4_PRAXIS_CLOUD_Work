/**
 * POST /api/ai/brainstorming-table
 *
 * Synchronous MVP of the Brainstorming Table — a multi-persona expert
 * deliberation rendered as a structured table (rows = persona turns) with
 * a synthesis chair consolidating recommendations.
 *
 * MVP constraints:
 * - One synchronous calibrated call (single Pro-model generation).
 * - The model returns 5–7 turns, one per persona, with claim/evidence/
 *   critique/recommendation/confidence/status, plus a synthesis block.
 * - Persists to `users/{uid}/situations/{sitId}/tools/brainstorming-table`.
 * - Optional `personas[]` request param lets the analyst pick which voices
 *   sit at the table; defaults to a balanced 6-persona panel.
 *
 * Cloud Tasks fan-out (per-turn delivery, retry policy) is the next step
 * once the schema is stable — see docs/AGENTIC_SYSTEM.md.
 */

import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { AGENT_REGISTRY, DEFAULT_BRAINSTORMING_PANEL, type AgentPersonaId } from '@/lib/agents/registry';
import type { Situation } from '@/types/situation';

export const maxDuration = 90;

// ---------------------------------------------------------------------------
// Persona registry — sourced from src/lib/agents/registry.ts so every consumer
// (this route, future agent routes, docs, tests) shares the same vocabulary.
// ---------------------------------------------------------------------------

export type BrainstormingPersonaId = Extract<
  AgentPersonaId,
  'mediator' | 'humanitarian' | 'legal' | 'media' | 'security' | 'red-team'
>;

const PERSONA_IDS = DEFAULT_BRAINSTORMING_PANEL as unknown as [
  BrainstormingPersonaId,
  ...BrainstormingPersonaId[]
];

export const BRAINSTORMING_PERSONAS = PERSONA_IDS.map((id) => {
  const p = AGENT_REGISTRY[id];
  return { id: p.id as BrainstormingPersonaId, label: p.label, rolePrompt: p.rolePrompt };
}) as ReadonlyArray<{ id: BrainstormingPersonaId; label: string; rolePrompt: string }>;

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const TurnSchema = z.object({
  turnId: z.string(),
  persona: z.enum(PERSONA_IDS),
  claim: z.string().min(10),
  evidence: z
    .array(
      z.object({
        sourceType: z.enum(['argus', 'sources', 'documents', 'graph', 'tool-output', 'situation', 'web', 'reasoning']),
        sourceId: z.string().optional(),
        excerpt: z.string(),
      })
    )
    .min(0),
  critique: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  status: z.enum(['proposed', 'challenged', 'accepted', 'rejected']),
});

const SynthesisSchema = z.object({
  bluf: z.string().min(20),
  consensusPoints: z.array(z.string()),
  divergences: z.array(z.string()),
  optionsForDecision: z.array(
    z.object({
      label: z.string(),
      tradeoffs: z.string(),
      preferredBy: z.array(z.enum(PERSONA_IDS)).optional(),
    })
  ),
  openQuestions: z.array(z.string()),
  nextActions: z.array(
    z.object({
      action: z.string(),
      owner: z.enum(['analyst', 'mission', 'donor', 'cluster-lead', 'red-team', 'researcher']).optional(),
      urgency: z.enum(['immediate', 'short-term', 'medium-term']),
    })
  ),
});

export const BrainstormingTableSchema = z.object({
  question: z.string(),
  generatedAt: z.string(),
  personas: z.array(z.enum(PERSONA_IDS)),
  turns: z.array(TurnSchema).min(2),
  synthesis: SynthesisSchema,
  retrievalTrace: z.object({
    layersSearched: z.array(z.string()),
    itemCount: z.number().nonnegative(),
    durationMs: z.number().nonnegative(),
  }).optional(),
});

// ---------------------------------------------------------------------------
// Demo response
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  question: 'How should the mission respond to the Kessara corridor closure?',
  generatedAt: new Date().toISOString(),
  personas: ['mediator', 'humanitarian', 'legal', 'security', 'red-team'] as BrainstormingPersonaId[],
  turns: [
    {
      turnId: 't-1',
      persona: 'humanitarian' as const,
      claim: 'Convoy access to the Kessara corridor has been blocked since 2026-04-18; protection cluster is reporting civilian casualties at checkpoints.',
      evidence: [{ sourceType: 'argus' as const, excerpt: '[demo] OCHA situation report flag' }],
      recommendation: 'Brief the donor cluster and request emergency protection funding.',
      confidence: 'medium' as const,
      status: 'proposed' as const,
    },
    {
      turnId: 't-2',
      persona: 'mediator' as const,
      claim: 'A 72-hour technical pause to clear the medical convoy is the lowest-cost de-escalation move both parties can accept publicly.',
      evidence: [{ sourceType: 'reasoning' as const, excerpt: '[demo] mediator reasoning' }],
      recommendation: 'Open a back-channel with the AFN field commander.',
      confidence: 'medium' as const,
      status: 'proposed' as const,
    },
    {
      turnId: 't-3',
      persona: 'red-team' as const,
      claim: 'The humanitarian lead is over-anchoring on a single OCHA flag; we have no independent verification of casualty figures.',
      critique: 'Source diversity = 1; flag confidence as low until ICRC or local NGO confirms.',
      confidence: 'high' as const,
      status: 'challenged' as const,
      evidence: [],
    },
  ],
  synthesis: {
    bluf: 'A 72-hour technical pause is the highest-value action this week, but figures must be independently verified before public statements.',
    consensusPoints: ['Civilians are at risk in the corridor.', 'A pause is operationally feasible.'],
    divergences: ['Whether to publicly attribute casualties before independent verification.'],
    optionsForDecision: [
      {
        label: 'Quiet 72-hour pause + private donor brief',
        tradeoffs: 'Lower escalation risk; less public pressure on parties.',
        preferredBy: ['mediator' as const, 'humanitarian' as const],
      },
      {
        label: 'Public statement + UNSC briefing request',
        tradeoffs: 'Maximises pressure but risks hardening positions.',
        preferredBy: ['legal' as const],
      },
    ],
    openQuestions: ['Is ICRC able to verify casualty numbers within 48 hours?'],
    nextActions: [
      { action: 'Open back-channel with AFN field commander.', owner: 'mission' as const, urgency: 'immediate' as const },
      { action: 'Request ICRC verification.', owner: 'researcher' as const, urgency: 'short-term' as const },
    ],
  },
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('brainstorming-table', 'ai_brainstorming_table', {
  retrievalQuery: (_req, body) => {
    const q = typeof body.question === 'string' ? body.question : '';
    const sit = body.situation as { region?: string } | undefined;
    return [q, sit?.region].filter(Boolean).join(' — ') || 'situation deliberation';
  },
})(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));

    const requestSchema = z.object({
      question: z.string().min(5).max(800),
      situation: z.any().optional(),
      personas: z.array(z.enum(PERSONA_IDS)).max(BRAINSTORMING_PERSONAS.length).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { question, situation, personas } = validation.data;

    if (isServerDemoMode()) {
      return NextResponse.json({ ...DEMO_RESPONSE, question });
    }

    const sit = situation as Situation | undefined;
    const situationId = sit?.id ?? '';

    const personaList: BrainstormingPersonaId[] =
      personas && personas.length >= 2
        ? Array.from(new Set(personas))
        : ['mediator', 'humanitarian', 'legal', 'media', 'security', 'red-team'];

    const personaPrompt = personaList
      .map((id) => {
        const p = BRAINSTORMING_PERSONAS.find((x) => x.id === id);
        return p ? `- ${p.id} (${p.label}): ${p.rolePrompt}` : '';
      })
      .filter(Boolean)
      .join('\n');

    const sitContext = sit ? buildToolContext(sit) : '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'brainstorming-table')
      : '';

    // Pull the situation corpus so each persona reasons over real evidence.
    let corpusBlock = '';
    let retrievalTrace: { layersSearched: string[]; itemCount: number; durationMs: number } | null = null;
    if (situationId) {
      try {
        const corpus = await searchSituationCorpus({
          uid: user.uid,
          situationId,
          query: question,
          limit: 12,
        });
        retrievalTrace = {
          layersSearched: corpus.trace.layersSearched,
          itemCount: corpus.items.length,
          durationMs: corpus.trace.durationMs,
        };
        if (corpus.items.length) {
          corpusBlock = `\n## CORPUS EVIDENCE (cite via sourceId)\n${corpus.items
            .map(
              (it, i) =>
                `[${i + 1}] (${it.sourceType}) ${it.title} — ${it.excerpt}\n    sourceId=${it.sourceId} confidence=${it.confidence} freshness=${it.freshness || 'n/a'}`
            )
            .join('\n')}\n`;
        }
      } catch (err) {
        console.warn('[brainstorming-table] corpus retrieval failed:', err instanceof Error ? err.message : err);
      }
    }

    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective =
      outputConstraints.language !== 'en'
        ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()} (analyst's working language).`
        : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map((r) => `  - ${r}`).join('\n')}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: BrainstormingTableSchema }),
      system: `You are a deliberation orchestrator for PRAXIS — a structured Brainstorming Table where named expert personas debate a question, critique each other, and converge on options for the analyst.

${systemPromptBlock}

PERSONAS AT THE TABLE (one turn each, in this order):
${personaPrompt}

DELIBERATION RULES:
- Every turn must include a claim and confidence (high/medium/low).
- Every claim must cite at least one piece of evidence from the CORPUS EVIDENCE block when available; if no corpus item supports the claim, set sourceType="reasoning" and acknowledge the gap.
- Red Team Critic challenges at least one prior turn (status="challenged") and recommends adjustments.
- Synthesis Chair (the orchestrator — that is YOU) writes the synthesis: BLUF, consensus, divergences, decision options with trade-offs, open questions, next actions.
- Never invent sources. If the analyst's working language is non-English, write all claims/critiques/synthesis in that language; persona ids stay English.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${corpusBlock}

ANALYST QUESTION:
${question}

OUTPUT SHAPE:
- question: echo of the analyst question.
- generatedAt: ISO timestamp.
- personas: ordered persona ids actually used.
- turns: 5-7 rows, exactly one per persona unless Red Team Critic challenges another row in addition.
- synthesis: BLUF, consensusPoints, divergences, optionsForDecision (with tradeoffs and preferredBy[]), openQuestions, nextActions (with owner and urgency).
- retrievalTrace: optional — leave null if corpus retrieval failed.`,
    });

    const modelOutput = result.output as z.infer<typeof BrainstormingTableSchema>;
    const finalOutput: z.infer<typeof BrainstormingTableSchema> = {
      ...modelOutput,
      retrievalTrace: retrievalTrace ?? modelOutput.retrievalTrace,
    };

    if (situationId) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'brainstorming-table',
        profileVersion: provenance.profileVersion,
        output: finalOutput as Record<string, unknown>,
        metadata: {
          personas: personaList,
          retrievalTrace,
          question,
        },
      }).catch((err) => console.warn('[brainstorming-table] saveToolOutput failed:', err));
    }

    return NextResponse.json(finalOutput);
  } catch (err) {
    return handleRouteError(err, 'brainstorming-table');
  }
});
