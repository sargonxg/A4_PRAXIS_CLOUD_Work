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
    .map((source, index) => source.trim())
    .filter(Boolean)
    .map((source, index) => {
      const url = source.match(/https?:\/\/\S+/)?.[0];
      return {
        id: `source-${index + 1}`,
        label: source.replace(url ?? '', '').trim().replace(/[(-]\s*$/, '') || url || source,
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
