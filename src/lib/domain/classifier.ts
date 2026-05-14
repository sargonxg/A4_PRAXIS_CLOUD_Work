/**
 * Situation → Domain classifier
 *
 * Reads a situation's short-form text (name + description + optional sources)
 * and returns the best-fit domain id from the 11-entry catalogue, along with
 * a confidence score and one-sentence rationale.
 *
 * Never throws. Every failure path returns `{ domainId: 'generic', confidence: 0 }`
 * so the situation wizard can always proceed.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §7
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { DOMAIN_IDS, type DomainId, isDomainId } from '@/types/domain';
import { DOMAIN_SEEDS } from './seeds';
import { PATH_DOMAIN_MAP, type PathId, pathIdForDomain } from '@/lib/path/types';
import { PATH_SEEDS } from '@/lib/path/seeds';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassifyInput {
  name: string;
  description: string;
  sourceUrls?: string[];
  /** Optional hint — the analyst's usual lens. Not authoritative. */
  hints?: { userPrimaryDomain?: string };
}

export interface ClassifyResult {
  domainId: DomainId;
  confidence: number;
  rationale: string;
  alternatives: Array<{ domainId: DomainId; confidence: number }>;
}

export interface ClassifyPathResult {
  pathId: PathId | null;
  confidence: number;
  rationale: string;
  alternatives: Array<{ pathId: PathId; confidence: number }>;
}

const CONFIDENCE_FLOOR = 0.55;

// ---------------------------------------------------------------------------
// Prompt scaffolding
// ---------------------------------------------------------------------------

function buildCatalogue(): string {
  return DOMAIN_IDS
    .filter((id) => id !== 'generic')
    .map((id) => {
      const d = DOMAIN_SEEDS[id];
      return `- **${id}** — ${d.name}: ${d.description}`;
    })
    .join('\n');
}

function buildSystemPrompt(hint?: string): string {
  const hintLine = hint
    ? `\nThe analyst's usual primary domain is \`${hint}\`. You MAY bias toward this when the situation is ambiguous, but you MUST choose the best genuine fit — do not rubber-stamp.`
    : '';

  return `You are PRAXIS, a conflict-intelligence classifier. Given a situation brief, pick the single best-fit domain from the catalogue below.

Catalogue:
${buildCatalogue()}

Return:
- domainId: one of the ids above. Never invent new ids. If no domain fits cleanly (mixed / fully generic intelligence work), return "generic".
- confidence: 0.0-1.0. 1.0 = clear-cut, 0.6 = plausible, 0.4 = uncertain.
- rationale: one sentence explaining the pick.
- alternatives: up to 2 next-best picks with their own confidences.${hintLine}`;
}

// ---------------------------------------------------------------------------
// Output schema (for Output.object with AI SDK v6)
// ---------------------------------------------------------------------------

const ClassifyOutputSchema = z.object({
  domainId: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(280),
  alternatives: z
    .array(
      z.object({
        domainId: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(3)
    .default([]),
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function classifyDomain(input: ClassifyInput): Promise<ClassifyResult> {
  const fallback: ClassifyResult = {
    domainId: 'generic',
    confidence: 0,
    rationale: 'classifier unavailable',
    alternatives: [],
  };

  if (!input.name?.trim() && !input.description?.trim()) {
    return fallback;
  }

  const userPrompt = `Situation: ${input.name}
Description: ${input.description}
${input.sourceUrls?.length ? `Sources:\n${input.sourceUrls.slice(0, 8).map((u) => `  - ${u}`).join('\n')}` : ''}`;

  try {
    const model = getModel();
    const result = await generateText({
      model,
      system: buildSystemPrompt(input.hints?.userPrimaryDomain),
      prompt: userPrompt,
      experimental_output: Output.object({ schema: ClassifyOutputSchema }),
      maxRetries: 1,
    });

    const raw = (result as { experimental_output?: unknown }).experimental_output;
    const parsed = ClassifyOutputSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('[classifier] Invalid output shape:', parsed.error.issues);
      return fallback;
    }

    const picked = isDomainId(parsed.data.domainId) ? parsed.data.domainId : 'generic';
    const validAlternatives = parsed.data.alternatives
      .filter((a) => isDomainId(a.domainId) && a.domainId !== picked)
      .map((a) => ({ domainId: a.domainId as DomainId, confidence: a.confidence }));

    const finalDomain: DomainId =
      parsed.data.confidence < CONFIDENCE_FLOOR ? 'generic' : picked;

    return {
      domainId: finalDomain,
      confidence: parsed.data.confidence,
      rationale: parsed.data.rationale,
      alternatives: validAlternatives,
    };
  } catch (err) {
    console.warn('[classifier] generateText failed:', err);
    return fallback;
  }
}

export function classifyPath(input: ClassifyInput & { domainId?: string; domainConfidence?: number }): ClassifyPathResult {
  const domainPath = pathIdForDomain(input.domainId);
  const text = `${input.name} ${input.description} ${(input.sourceUrls ?? []).join(' ')}`.toLowerCase();
  const scores = Object.keys(PATH_DOMAIN_MAP).map((pathId) => {
    const seed = PATH_SEEDS[pathId as PathId];
    const terms = [
      seed.name,
      seed.description,
      ...seed.toolBundle,
      ...seed.lensTop3,
      ...seed.frameworkPath,
      seed.audienceDefault,
      ...seed.sourceMix.map((item) => item.feed),
    ].join(' ').toLowerCase().split(/[^a-z0-9-]+/).filter((term) => term.length > 3);
    const uniqueTerms = Array.from(new Set(terms));
    const lexical = uniqueTerms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
    const domainBoost = domainPath === pathId ? 6 : 0;
    return { pathId: pathId as PathId, score: lexical + domainBoost };
  }).sort((a, b) => b.score - a.score);

  const top = scores[0];
  if (!top || top.score <= 0) {
    return {
      pathId: null,
      confidence: 0,
      rationale: 'No path signal was strong enough; keep generic analyst baseline.',
      alternatives: [],
    };
  }

  const pathId = top.pathId;
  const confidence = Math.max(0.45, Math.min(0.95, (input.domainConfidence ?? 0.55) * 0.75 + Math.min(top.score, 10) / 40));
  const alternatives = scores
    .filter((item) => item.pathId !== pathId && item.score > 0)
    .slice(0, 2)
    .map((item) => ({ pathId: item.pathId, confidence: Math.max(0.35, Math.min(0.75, item.score / Math.max(top.score + 2, 4))) }));

  return {
    pathId,
    confidence,
    rationale: `Path selected from ${input.domainId ?? 'domain'} plus situation keyword overlap with ${PATH_SEEDS[pathId].name}.`,
    alternatives,
  };
}

export async function classifyDomainAndPath(input: ClassifyInput): Promise<ClassifyResult & {
  pathId: PathId | null;
  pathConfidence: number;
  pathRationale: string;
  pathAlternatives: Array<{ pathId: PathId; confidence: number }>;
}> {
  const domain = await classifyDomain(input);
  const path = classifyPath({
    ...input,
    domainId: domain.domainId,
    domainConfidence: domain.confidence,
  });
  return {
    ...domain,
    pathId: path.pathId,
    pathConfidence: path.confidence,
    pathRationale: path.rationale,
    pathAlternatives: path.alternatives,
  };
}
