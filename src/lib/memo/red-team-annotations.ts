export type RedTeamAnnotationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface RedTeamAnnotation {
  id: string;
  challenge: string;
  severity: RedTeamAnnotationSeverity;
  affectedParagraph: number;
  source: 'assumption' | 'source-diversity' | 'motivated-reasoning' | 'intelligence-gap' | 'confidence';
}

interface FlaggedAssumptionLike {
  claim?: unknown;
  whyFlagged?: unknown;
  severity?: unknown;
}

interface RedTeamReviewLike {
  unstatedAssumptions?: unknown;
  sourceDiversityIssues?: unknown;
  motivatedReasoningRedFlags?: unknown;
  missingIntelligenceGaps?: unknown;
  confidenceAdjustment?: unknown;
}

export function mapRedTeamReviewToAnnotations(
  review: RedTeamReviewLike,
  paragraphs: string[],
): RedTeamAnnotation[] {
  const normalizedParagraphs = paragraphs.map((paragraph) => paragraph.toLowerCase());
  const annotations: RedTeamAnnotation[] = [];
  const push = (
    challenge: string,
    severity: RedTeamAnnotationSeverity,
    source: RedTeamAnnotation['source'],
    claim?: string,
  ) => {
    const clean = challenge.trim();
    if (!clean) return;
    annotations.push({
      id: `red-team-${source}-${annotations.length + 1}`,
      challenge: clean,
      severity,
      affectedParagraph: paragraphIndexForClaim(claim ?? clean, normalizedParagraphs),
      source,
    });
  };

  for (const item of arrayOfRecords(review.unstatedAssumptions)) {
    const claim = stringValue(item.claim);
    const why = stringValue(item.whyFlagged);
    push(
      [claim ? `Assumption: ${claim}` : null, why].filter(Boolean).join(' - '),
      severityValue(item.severity),
      'assumption',
      claim ?? undefined,
    );
  }

  for (const issue of stringArray(review.sourceDiversityIssues)) {
    push(issue, 'medium', 'source-diversity');
  }
  for (const issue of stringArray(review.motivatedReasoningRedFlags)) {
    push(issue, 'high', 'motivated-reasoning');
  }
  for (const gap of stringArray(review.missingIntelligenceGaps)) {
    push(gap, 'medium', 'intelligence-gap');
  }

  const confidenceAdjustment = isRecord(review.confidenceAdjustment) ? review.confidenceAdjustment : null;
  const rationale = stringValue(confidenceAdjustment?.rationale);
  const suggestedConfidence = stringValue(confidenceAdjustment?.suggestedConfidence);
  if (rationale) {
    push(
      suggestedConfidence ? `Confidence should move to ${suggestedConfidence}: ${rationale}` : rationale,
      suggestedConfidence === 'low' ? 'high' : 'medium',
      'confidence',
    );
  }

  return annotations.slice(0, 12);
}

export function memoTextToParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0)
    .slice(0, 80);
}

function paragraphIndexForClaim(claim: string, paragraphs: string[]): number {
  if (!paragraphs.length) return 1;
  const normalizedClaim = claim.toLowerCase();
  const claimWords = wordSet(normalizedClaim);
  let best = { index: 0, score: -1 };
  paragraphs.forEach((paragraph, index) => {
    if (normalizedClaim && paragraph.includes(normalizedClaim.slice(0, Math.min(80, normalizedClaim.length)))) {
      best = { index, score: Number.MAX_SAFE_INTEGER };
      return;
    }
    const paragraphWords = wordSet(paragraph);
    const overlap = [...claimWords].filter((word) => paragraphWords.has(word)).length;
    if (overlap > best.score) best = { index, score: overlap };
  });
  return best.index + 1;
}

function wordSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9-]{2,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) ?? [],
  );
}

function severityValue(value: unknown): RedTeamAnnotationSeverity {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function arrayOfRecords(value: unknown): FlaggedAssumptionLike[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'that',
  'with',
  'from',
  'this',
  'will',
  'would',
  'have',
  'has',
  'are',
  'not',
  'for',
  'until',
  'into',
  'over',
  'under',
  'current',
]);
