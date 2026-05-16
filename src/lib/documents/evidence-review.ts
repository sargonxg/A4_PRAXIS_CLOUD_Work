export interface EvidenceSection {
  id: string;
  heading: string;
  body: string;
}

export interface EvidenceSource {
  id: string;
  label: string;
  url?: string;
}

export interface SectionEvidenceReview {
  sectionId: string;
  heading: string;
  wordCount: number;
  sentenceCount: number;
  suggestedSources: EvidenceSource[];
  coverageState: 'ready' | 'thin' | 'missing';
  sectionQuestions: string[];
}

export type ClaimEvidenceStatus = 'supported' | 'weak' | 'unsupported' | 'needs_date_check';

export interface ClaimEvidenceReview {
  claimId: string;
  sectionId: string;
  claim: string;
  status: ClaimEvidenceStatus;
  suggestedSources: EvidenceSource[];
  actions: Array<'find source' | 'rewrite cautiously' | 'add to evidence gaps'>;
  rationale: string;
}

export interface EvidenceGapReport {
  id: string;
  generatedAt: string;
  subjectId: string;
  situationId?: string;
  draftId?: string;
  documentId?: string;
  claims: ClaimEvidenceReview[];
  summary: Record<ClaimEvidenceStatus, number>;
  savedCount: number;
  resolvedCount: number;
}

export interface SavedEvidenceGapState {
  claimId: string;
  resolvedAt?: string | null;
}

const STOP_WORDS = new Set([
  'and',
  'are',
  'but',
  'for',
  'from',
  'has',
  'have',
  'into',
  'not',
  'that',
  'the',
  'this',
  'with',
  'will',
  'would',
]);

export function normalizeEvidenceSources(sources: string[]): EvidenceSource[] {
  return sources
    .map((source) => source.trim())
    .filter(Boolean)
    .map((source, index) => {
      const urlMatch = source.match(/https?:\/\/\S+/);
      const url = urlMatch?.[0];
      const labelSource = urlMatch ? source.slice(0, urlMatch.index).trim() : source;
      return {
        id: `source-${index + 1}`,
        label: labelSource.replace(/[(-]\s*$/, '') || url || source,
        url,
      };
    });
}

export function buildEvidenceReviews(
  sections: EvidenceSection[],
  sources: string[],
): SectionEvidenceReview[] {
  const normalizedSources = normalizeEvidenceSources(sources);

  return sections.map((section, index) => {
    const wordCount = countWords(section.body);
    const sentenceCount = countSentences(section.body);
    const suggestedSources = selectSuggestedSources(section, normalizedSources, index);
    const coverageState = getCoverageState(wordCount, suggestedSources.length);

    return {
      sectionId: section.id,
      heading: section.heading,
      wordCount,
      sentenceCount,
      suggestedSources,
      coverageState,
      sectionQuestions: buildSectionQuestions(section, coverageState),
    };
  });
}

export function summarizeEvidenceCoverage(reviews: SectionEvidenceReview[]) {
  const ready = reviews.filter((review) => review.coverageState === 'ready').length;
  const thin = reviews.filter((review) => review.coverageState === 'thin').length;
  const missing = reviews.filter((review) => review.coverageState === 'missing').length;
  const score = reviews.length ? Math.round(((ready + thin * 0.55) / reviews.length) * 100) : 0;

  return {
    score,
    ready,
    thin,
    missing,
    total: reviews.length,
  };
}

export function buildClaimEvidenceReport(
  subjectId: string,
  sections: EvidenceSection[],
  sources: string[],
  options: {
    situationId?: string | null;
    draftId?: string | null;
    documentId?: string | null;
    savedGaps?: SavedEvidenceGapState[];
  } = {},
): EvidenceGapReport {
  const normalizedSources = normalizeEvidenceSources(sources);
  const savedGaps = options.savedGaps ?? [];
  const claims = sections.flatMap((section) => extractClaims(section).map((claim, index) => {
    const suggestedSources = selectSuggestedSources({ ...section, body: claim }, normalizedSources, index);
    const hasSourceOverlap = normalizedSources.some((source) => overlapScore(tokenize(claim), tokenize(source.label)) > 0);
    const hasDateRisk = /\b(today|yesterday|current|currently|latest|recent|as of|20\d{2}|19\d{2})\b/i.test(claim);
    const status = getClaimEvidenceStatus(claim, suggestedSources.length, hasSourceOverlap, hasDateRisk);
    return {
      claimId: `${section.id}:claim-${index + 1}`,
      sectionId: section.id,
      claim,
      status,
      suggestedSources,
      actions: actionsForStatus(status),
      rationale: rationaleForStatus(status, suggestedSources.length),
    };
  }));

  return {
    id: `evidence-gap-report:${subjectId}`,
    generatedAt: new Date().toISOString(),
    subjectId,
    ...(options.situationId ? { situationId: options.situationId } : {}),
    ...(options.draftId ? { draftId: options.draftId } : {}),
    ...(options.documentId ? { documentId: options.documentId } : {}),
    claims,
    summary: {
      supported: claims.filter((claim) => claim.status === 'supported').length,
      weak: claims.filter((claim) => claim.status === 'weak').length,
      unsupported: claims.filter((claim) => claim.status === 'unsupported').length,
      needs_date_check: claims.filter((claim) => claim.status === 'needs_date_check').length,
    },
    savedCount: savedGaps.filter((gap) => !gap.resolvedAt).length,
    resolvedCount: savedGaps.filter((gap) => Boolean(gap.resolvedAt)).length,
  };
}

function selectSuggestedSources(section: EvidenceSection, sources: EvidenceSource[], index: number): EvidenceSource[] {
  if (!sources.length) return [];

  const sectionTokens = tokenize(`${section.heading} ${section.body}`);
  const ranked = sources
    .map((source, sourceIndex) => ({
      source,
      score: overlapScore(sectionTokens, tokenize(source.label)),
      sourceIndex,
    }))
    .sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex);

  const scored = ranked.filter((item) => item.score > 0).slice(0, 2).map((item) => item.source);
  if (scored.length) {
    if (scored.length === 1 && sources.length > 1) {
      const fallback = ranked.find((item) => item.source.id !== scored[0].id)?.source;
      return fallback ? [...scored, fallback] : scored;
    }
    return scored;
  }

  return [sources[index % sources.length]].filter(Boolean);
}

function buildSectionQuestions(section: EvidenceSection, coverageState: SectionEvidenceReview['coverageState']): string[] {
  const heading = section.heading.toLowerCase();
  const questions = [
    'Where did this claim come from?',
    'Did this paragraph change after the latest source or corpus refresh?',
    'Which graph nodes and edges defend this wording?',
  ];

  if (coverageState !== 'ready') {
    questions.unshift('What source span must be attached before this is briefed?');
  }
  if (heading.includes('recommend') || heading.includes('option')) {
    questions.push('What implementation trigger would change this recommendation?');
  }
  if (heading.includes('risk') || section.body.toLowerCase().includes('risk')) {
    questions.push('Which warning indicator would invalidate this risk line?');
  }

  return Array.from(new Set(questions)).slice(0, 5);
}

function extractClaims(section: EvidenceSection): string[] {
  const sentences = section.body
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20);
  return (sentences.length ? sentences : [section.body.trim()]).slice(0, 8);
}

function getClaimEvidenceStatus(claim: string, sourceCount: number, hasSourceOverlap: boolean, hasDateRisk: boolean): ClaimEvidenceStatus {
  if (sourceCount === 0 || !hasSourceOverlap) return 'unsupported';
  if (hasDateRisk && !/\b(?:as of|dated|published|on)\b/i.test(claim)) return 'needs_date_check';
  if (sourceCount < 2 || countWords(claim) < 12) return 'weak';
  return 'supported';
}

function actionsForStatus(status: ClaimEvidenceStatus): ClaimEvidenceReview['actions'] {
  if (status === 'supported') return [];
  if (status === 'weak') return ['find source', 'rewrite cautiously'];
  if (status === 'needs_date_check') return ['find source', 'rewrite cautiously', 'add to evidence gaps'];
  return ['find source', 'rewrite cautiously', 'add to evidence gaps'];
}

function rationaleForStatus(status: ClaimEvidenceStatus, sourceCount: number): string {
  if (status === 'supported') return 'Claim has multiple matching source candidates.';
  if (status === 'needs_date_check') return 'Claim contains temporal language or dates that need current-source verification.';
  if (status === 'weak') return 'Claim has limited source overlap or is too short to defend without a tighter citation.';
  return sourceCount === 0 ? 'No attached source overlaps this claim.' : 'Attached sources are insufficient for this claim.';
}

function getCoverageState(wordCount: number, sourceCount: number): SectionEvidenceReview['coverageState'] {
  if (sourceCount === 0) return 'missing';
  if (wordCount < 25 || sourceCount < 2) return 'thin';
  return 'ready';
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
  for (const token of right) {
    if (left.has(token)) score += 1;
  }
  return score;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  const matches = text.trim().match(/[^.!?]+[.!?]+/g);
  return Math.max(1, matches?.length ?? 0);
}
