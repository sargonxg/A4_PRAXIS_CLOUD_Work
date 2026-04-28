/**
 * Ask PRAXIS — server-side helper for any tool route to delegate a
 * sub-question to the calibrated chat backbone.
 *
 * Other tool routes (briefing, risk-monitor, timeline, conflict-graph)
 * can call `delegateToAskPraxis()` to get a cited answer that uses the
 * same AnalystProfile + situation + SKC corpus + ARGUS context the chat
 * page uses, without re-implementing the prompt + retrieval plumbing.
 *
 * Notes:
 *  - This helper does NOT deduct credits — callers are expected to have
 *    already deducted via withCalibration. The resulting LLM call uses
 *    `getModel()` (Gemini 3 flash) which is cheap.
 *  - Returns plain text + structured tool-call traces. No streaming
 *    (callers that want streaming should call `/api/ai/chat` directly).
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { buildSituationContext } from '@/lib/ai/situation-context';
import type { Situation } from '@/types/situation';

export interface AskPraxisDelegateInput {
  uid: string;
  isDemo: boolean;
  situation?: Situation | null;
  systemPromptBlock?: string;
  /** Free-form question to answer. Should be self-contained. */
  question: string;
  /** Optional schema for a structured answer. When present, the helper returns `output`. */
  outputSchema?: z.ZodTypeAny;
  /** Optional analytical role override for the system prompt. */
  role?: string;
  /** Optional max corpus items to inject. Defaults to 8. */
  corpusLimit?: number;
}

export interface AskPraxisDelegateResult {
  text: string;
  output?: unknown;
  citations: Array<{ index: number; layer: string; title: string; citation: string }>;
}

/**
 * Delegate to the Ask PRAXIS chat backbone for a one-shot answer.
 * Designed to be called from inside a tool route handler that has already
 * resolved auth + calibration.
 */
export async function delegateToAskPraxis(input: AskPraxisDelegateInput): Promise<AskPraxisDelegateResult> {
  const { uid, isDemo, situation, systemPromptBlock, question, role, outputSchema, corpusLimit = 8 } = input;

  let systemPrompt = systemPromptBlock ?? '';
  if (situation) systemPrompt += '\n\n' + buildSituationContext(situation);
  if (role) systemPrompt += `\n\n## Analytical Role\n${role}`;

  // Corpus retrieval (skip for demo or missing situation)
  const citations: AskPraxisDelegateResult['citations'] = [];
  if (!isDemo && uid && situation?.id) {
    try {
      const corpus = await searchSituationCorpus({ uid, situationId: situation.id, query: question, limit: corpusLimit });
      if (corpus.items.length > 0) {
        const lines = corpus.items.map((it, i) => {
          citations.push({ index: i + 1, layer: it.sourceType, title: it.title, citation: it.citation });
          return `[#${i + 1}] (${it.sourceType}) ${it.title} — ${it.excerpt}\n    citation=${it.citation} confidence=${it.confidence}`;
        });
        systemPrompt += `\n\n## Situation Corpus\nGround every factual claim with these. Cite inline as [#N].\n\n${lines.join('\n\n')}`;
      }
    } catch {
      // Non-fatal — proceed without corpus
    }
  }

  if (outputSchema) {
    const { output, text } = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: question,
      output: Output.object({ schema: outputSchema as z.ZodType }),
    });
    return { text, output, citations };
  }

  const { text } = await generateText({ model: getModel(), system: systemPrompt, prompt: question });
  return { text, citations };
}
