/**
 * Generalized agent runner.
 *
 * Every PRAXIS agentic route (Source Scout, Red-Team auto-review, future
 * Graph Cartographer, future Timeline Editor) composes the same pipeline:
 *
 *   persona role prompt
 *   + situation calibration (analyst-profile / situation-frame / output-constraints)
 *   + corpus evidence (searchSituationCorpus)
 *   + Pro-model generation against a Zod schema
 *   + persistence via saveToolOutput
 *
 * This module factors that pipeline into a single helper so every agent
 * route stays aligned and any future agent lane is one schema + one route
 * away. Routes still own their own `withCalibration` wrapping (which the
 * route audit enforces) — `runAgent` is what the handler body calls.
 *
 * Spec: docs/AGENT_REGISTRY.md, docs/IMPROVEMENT_15_2026-04-26.md (item #3).
 */

import { Output, type LanguageModelUsage } from 'ai';
import { z, type ZodType } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import type { CorpusItem, CorpusLayer } from '@/types/corpus';
import { getPersona, type AgentPersona, type AgentPersonaId } from './registry';
import type { ContextBlock } from '@/lib/context/profile-context';

export interface RunAgentInput<TSchema extends ZodType> {
  /** Persona id from the agent registry. The runner refuses unknown / inactive ids. */
  personaId: AgentPersonaId;
  /** Authenticated user uid (from `withCalibration`). */
  uid: string;
  /** Active situation id; if omitted, corpus retrieval is skipped. */
  situationId?: string;
  /** The analyst's question / task. */
  query: string;
  /** Calibration context from `withCalibration` (includes systemPromptBlock + outputConstraints). */
  calibration: ContextBlock;
  /** Output Zod schema. Pro model is forced to conform via `Output.object`. */
  schema: TSchema;
  /** Optional override for retrieval layers. Default: all five. */
  layers?: CorpusLayer[];
  /** Optional: cap corpus items injected into the prompt. Default 12. */
  corpusLimit?: number;
  /** Optional: extra system-prompt suffix the route wants appended after the persona role prompt. */
  extraSystem?: string;
  /** Optional: extra user-prompt suffix (e.g. tool output payload to critique). */
  extraPrompt?: string;
  /** Optional: when true, the runner skips corpus retrieval (e.g. Red-Team review on an existing tool output). */
  skipCorpus?: boolean;
}

export interface RunAgentResult<T> {
  output: T;
  /** The persona that ran. */
  persona: AgentPersona;
  /** Corpus items injected into the prompt (empty array if skipped or none found). */
  corpusItems: CorpusItem[];
  /** Layer counts from corpus retrieval, plus retrieval ms. */
  retrievalTrace: {
    layersSearched: CorpusLayer[];
    itemCount: number;
    durationMs: number;
  } | null;
  /** Token usage if the model surfaced it. */
  usage?: LanguageModelUsage;
}

export class AgentRunnerError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'unknown-persona'
      | 'inactive-persona'
      | 'corpus-retrieval-failed'
      | 'model-call-failed'
  ) {
    super(message);
    this.name = 'AgentRunnerError';
  }
}

const MAX_CORPUS_ITEMS = 24;

/**
 * Run a single-persona agent end-to-end.
 *
 * Important behaviours:
 *  - Unknown or inactive persona ids throw `AgentRunnerError(code='unknown-persona' | 'inactive-persona')`.
 *    The route should catch and return 400/501 as appropriate.
 *  - Corpus retrieval failure logs a warning and degrades to an empty
 *    corpus block — the agent still runs.
 *  - Model call failure throws `AgentRunnerError(code='model-call-failed')`.
 *  - Caller is responsible for `saveToolOutput` after a successful return —
 *    persistence is intentionally NOT folded into the runner because each
 *    agent has its own metadata shape.
 */
export async function runAgent<TSchema extends ZodType>(
  input: RunAgentInput<TSchema>
): Promise<RunAgentResult<z.infer<TSchema>>> {
  const persona = getPersona(input.personaId);
  if (!persona) {
    throw new AgentRunnerError(
      `Unknown or inactive persona: ${input.personaId}`,
      'unknown-persona'
    );
  }

  const limit = clamp(input.corpusLimit ?? 12, 0, MAX_CORPUS_ITEMS);

  let corpusItems: CorpusItem[] = [];
  let retrievalTrace: RunAgentResult<unknown>['retrievalTrace'] = null;

  if (!input.skipCorpus && input.situationId && limit > 0) {
    try {
      const corpus = await searchSituationCorpus({
        uid: input.uid,
        situationId: input.situationId,
        query: input.query,
        layers: input.layers,
        limit,
      });
      corpusItems = corpus.items;
      retrievalTrace = {
        layersSearched: corpus.trace.layersSearched,
        itemCount: corpus.items.length,
        durationMs: corpus.trace.durationMs,
      };
    } catch (err) {
      console.warn('[run-agent] corpus retrieval failed (degrading):', err instanceof Error ? err.message : err);
    }
  }

  const corpusBlock = formatCorpusBlock(corpusItems);
  const personaBlock = formatPersonaBlock(persona);
  const calibrationBlock = formatCalibrationBlock(input.calibration);

  const system =
    `${calibrationBlock}\n\n${personaBlock}` + (input.extraSystem ? `\n\n${input.extraSystem}` : '');

  const prompt = `${corpusBlock}\n\nANALYST QUESTION:\n${input.query}` +
    (input.extraPrompt ? `\n\n${input.extraPrompt}` : '');

  let result;
  try {
    result = await callProModel({
      output: Output.object({ schema: input.schema }),
      system,
      prompt,
    });
  } catch (err) {
    throw new AgentRunnerError(
      `Model call failed: ${err instanceof Error ? err.message : String(err)}`,
      'model-call-failed'
    );
  }

  return {
    output: result.output as z.infer<TSchema>,
    persona,
    corpusItems,
    retrievalTrace,
    usage: result.usage,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers (exposed for unit tests)
// ---------------------------------------------------------------------------

function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value) || value < lo) return lo;
  return Math.min(Math.floor(value), hi);
}

function formatPersonaBlock(persona: AgentPersona): string {
  const handoff = persona.handoffTools && persona.handoffTools.length > 0
    ? `\nWhen you recommend follow-up actions, prefer these PRAXIS tools: ${persona.handoffTools.join(', ')}.`
    : '';
  return `## YOUR ROLE: ${persona.label} (${persona.id})\n${persona.rolePrompt}\nFrameworks anchoring your reasoning: ${persona.frameworks.join('; ')}.${handoff}`;
}

function formatCalibrationBlock(ctx: ContextBlock): string {
  const lang = ctx.outputConstraints?.language && ctx.outputConstraints.language !== 'en'
    ? `\n\nRESPOND IN: ${ctx.outputConstraints.language.toUpperCase()} (analyst's working language).`
    : '';
  const redLines = ctx.outputConstraints?.redLineClauses?.length
    ? `\n\nRED LINES — DO NOT:\n${ctx.outputConstraints.redLineClauses.map((r) => `  - ${r}`).join('\n')}`
    : '';
  return `${ctx.systemPromptBlock}${lang}${redLines}`;
}

function formatCorpusBlock(items: CorpusItem[]): string {
  if (items.length === 0) {
    return '## CORPUS EVIDENCE\nNo evidence items in scope. Treat factual claims as intelligence gaps and recommend a relevant PRAXIS tool to fill them.';
  }
  const lines = items.map((it, i) =>
    `[#${i + 1}] (${it.sourceType}) ${it.title} — ${it.excerpt}\n    citation=${it.citation} confidence=${it.confidence}${it.freshness ? ` freshness=${it.freshness}` : ''}`
  );
  return `## CORPUS EVIDENCE (${items.length} items)\nUse these items to ground every factual claim. Cite inline by reference like [#3] or by the layer name (e.g. [argus]). Never fabricate sources.\n\n${lines.join('\n\n')}`;
}

// Exposed for unit tests only.
export const __test__ = {
  formatPersonaBlock,
  formatCalibrationBlock,
  formatCorpusBlock,
  clamp,
};
