import { z } from 'genkit';
import { ai, gemini25Flash } from '@/lib/genkit';
import {
  GenkitSourceabilityInputSchema,
  GenkitSourceabilityOutputSchema,
  type GenkitSourceabilityInput,
  type GenkitSourceabilityOutput,
} from '@/lib/genkit/schemas/sourceability';

const DATE_RISK_RE = /\b(today|yesterday|current|currently|latest|recent|as of|now|this week|this month|this year|20\d{2}|19\d{2})\b/i;
const DATE_RE = /\b(?:19|20)\d{2}(?:-\d{2}(?:-\d{2})?)?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/i;

const STOP_WORDS = new Set([
  'about',
  'after',
  'against',
  'also',
  'and',
  'are',
  'because',
  'been',
  'being',
  'but',
  'can',
  'could',
  'for',
  'from',
  'has',
  'have',
  'into',
  'not',
  'that',
  'the',
  'their',
  'this',
  'through',
  'with',
  'will',
  'would',
]);

export const SourceabilityFlowInputSchema = GenkitSourceabilityInputSchema;
export const SourceabilityFlowOutputSchema = GenkitSourceabilityOutputSchema;

export type SourceabilityFlowInput = z.infer<typeof SourceabilityFlowInputSchema>;
export type SourceabilityFlowOutput = z.infer<typeof SourceabilityFlowOutputSchema>;

export const sourceabilityFlow = ai.defineFlow(
  {
    name: 'sourceability',
    inputSchema: SourceabilityFlowInputSchema,
    outputSchema: SourceabilityFlowOutputSchema,
  },
  async (input) => {
    const normalized = normalizeInput(input);
    try {
      const prompt = ai.prompt<
        typeof GenkitSourceabilityInputSchema,
        typeof GenkitSourceabilityOutputSchema
      >('sourceability');
      const { output } = await prompt(normalized, {
        model: gemini25Flash,
        config: { temperature: 0 },
      });
      return normalizeOutput(GenkitSourceabilityOutputSchema.parse(output), normalized);
    } catch (err) {
      console.warn('[genkit/sourceability] falling back to deterministic sourceability review:', err);
      return deterministicSourceability(normalized);
    }
  },
);

function normalizeInput(input: GenkitSourceabilityInput): GenkitSourceabilityInput {
  return {
    claimText: input.claimText.trim().slice(0, 4000),
    memoParagraph: input.memoParagraph?.trim().slice(0, 6000) || undefined,
    sourceSnippets: input.sourceSnippets.slice(0, 20).map((snippet, index) => ({
      id: snippet.id.trim().slice(0, 160) || `source-${index + 1}`,
      title: snippet.title.trim().slice(0, 300) || `Source ${index + 1}`,
      url: snippet.url?.trim().slice(0, 1000) || undefined,
      date: snippet.date?.trim().slice(0, 80) || undefined,
      span: snippet.span.trim().slice(0, 4000),
    })).filter((snippet) => snippet.span.length > 0),
    capsuleId: input.capsuleId?.trim().slice(0, 160) || undefined,
    situationId: input.situationId?.trim().slice(0, 160) || undefined,
  };
}

function normalizeOutput(
  output: GenkitSourceabilityOutput,
  input: GenkitSourceabilityInput,
): GenkitSourceabilityOutput {
  const knownIds = new Set(input.sourceSnippets.map((snippet) => snippet.id));
  const sourceIds = output.supportingSourceIds.filter((id) => knownIds.has(id)).slice(0, 10);
  const status = sourceIds.length === 0 && output.status === 'supported' ? 'weak' : output.status;
  return {
    status,
    explanation: cleanText(output.explanation, 1200) || explanationForStatus(status),
    supportingSourceIds: sourceIds,
    missingEvidence: cleanList(output.missingEvidence, 8, 240),
    suggestedRewrite: cleanText(output.suggestedRewrite, 1200) || cautiousRewrite(input.claimText, status),
    citationWarnings: cleanList(output.citationWarnings, 8, 240),
  };
}

function deterministicSourceability(input: GenkitSourceabilityInput): GenkitSourceabilityOutput {
  const claimTokens = tokenize(input.claimText);
  const ranked = input.sourceSnippets
    .map((snippet, index) => {
      const tokens = tokenize(`${snippet.title} ${snippet.span}`);
      const overlap = overlapScore(claimTokens, tokens);
      const density = claimTokens.size ? overlap / claimTokens.size : 0;
      return { snippet, index, overlap, density };
    })
    .sort((a, b) => b.density - a.density || b.overlap - a.overlap || a.index - b.index);
  const matches = ranked.filter((item) => item.overlap > 0);
  const strongMatches = matches.filter((item) => item.density >= 0.48 || item.overlap >= 5);
  const top = ranked[0];
  const hasDateRisk = DATE_RISK_RE.test(input.claimText);
  const datedMatches = matches.filter((item) => Boolean(item.snippet.date) || DATE_RE.test(item.snippet.span));

  let status: GenkitSourceabilityOutput['status'] = 'unsupported';
  if (matches.length === 0) {
    status = 'unsupported';
  } else if (hasDateRisk && datedMatches.length === 0) {
    status = 'needs_date_check';
  } else if (strongMatches.length >= 1 && (matches.length >= 2 || top?.density >= 0.62)) {
    status = 'supported';
  } else {
    status = 'weak';
  }

  const supportingSourceIds = (status === 'unsupported' ? [] : matches)
    .slice(0, 4)
    .map((item) => item.snippet.id);
  const missingEvidence = missingEvidenceFor(input, status, supportingSourceIds.length);
  const citationWarnings = citationWarningsFor(input, status, supportingSourceIds.length, hasDateRisk, datedMatches.length);

  return {
    status,
    explanation: explanationForDeterministicStatus(status, supportingSourceIds.length, top?.overlap ?? 0),
    supportingSourceIds,
    missingEvidence,
    suggestedRewrite: cautiousRewrite(input.claimText, status),
    citationWarnings,
  };
}

function missingEvidenceFor(
  input: GenkitSourceabilityInput,
  status: GenkitSourceabilityOutput['status'],
  sourceCount: number,
): string[] {
  if (status === 'supported') return [];
  const missing = [
    sourceCount === 0
      ? 'A source span that directly states the claim.'
      : 'A second independent source span or a tighter citation for the exact wording.',
  ];
  if (DATE_RISK_RE.test(input.claimText)) {
    missing.push('A dated source confirming the timing or freshness of the claim.');
  }
  if (!input.memoParagraph) {
    missing.push('The surrounding memo paragraph, if the claim depends on context.');
  }
  return missing.slice(0, 5);
}

function citationWarningsFor(
  input: GenkitSourceabilityInput,
  status: GenkitSourceabilityOutput['status'],
  sourceCount: number,
  hasDateRisk: boolean,
  datedMatches: number,
): string[] {
  const warnings: string[] = [];
  if (sourceCount === 0) warnings.push('No provided snippet supports this wording.');
  if (status === 'weak') warnings.push('Evidence overlap is partial; cite cautiously or narrow the claim.');
  if (hasDateRisk && datedMatches === 0) warnings.push('Temporal wording needs a dated source.');
  if (input.sourceSnippets.some((snippet) => !snippet.url)) warnings.push('One or more supporting snippets lacks a URL.');
  return warnings.slice(0, 8);
}

function cautiousRewrite(claim: string, status: GenkitSourceabilityOutput['status']): string {
  const trimmed = claim.trim().replace(/\s+/g, ' ');
  if (status === 'supported') return trimmed;
  if (status === 'needs_date_check') return `Available snippets suggest this may be time-sensitive, but PRAXIS needs a dated source before stating: ${trimmed}`;
  if (status === 'weak') return `Available snippets partially support this claim, but it should be narrowed or cited cautiously: ${trimmed}`;
  return `Treat as an evidence gap until a source is attached: ${trimmed}`;
}

function explanationForDeterministicStatus(
  status: GenkitSourceabilityOutput['status'],
  sourceCount: number,
  overlap: number,
): string {
  if (status === 'supported') return `Provided snippets have direct token overlap with the claim across ${sourceCount} source candidate(s).`;
  if (status === 'needs_date_check') return 'The claim has source overlap, but temporal wording needs a dated supporting snippet.';
  if (status === 'weak') return `Provided snippets partially overlap with the claim, but support is thin (${overlap} overlapping content tokens in the top match).`;
  return 'No provided source snippet overlaps enough with the claim to treat it as supported.';
}

function explanationForStatus(status: GenkitSourceabilityOutput['status']): string {
  if (status === 'supported') return 'The claim is supported by the provided snippets.';
  if (status === 'needs_date_check') return 'The claim requires dated evidence before use.';
  if (status === 'weak') return 'The claim is only weakly supported by the provided snippets.';
  return 'The claim is unsupported by the provided snippets.';
}

function cleanText(value: string, limit: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, limit);
}

function cleanList(values: string[], limit: number, itemLimit: number): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => cleanText(value, itemLimit))
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function overlapScore(left: Set<string>, right: Set<string>): number {
  let score = 0;
  for (const token of left) {
    if (right.has(token)) score += token.length > 7 ? 2 : 1;
  }
  return score;
}
