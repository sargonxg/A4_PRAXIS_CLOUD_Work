export interface AutoStructuredDocument {
  title: string;
  sourceType: string;
  date: string | null;
  keyClaims: string[];
  actors: string[];
  timelineCandidates: Array<{ date: string; text: string }>;
  provenance: {
    extraction: 'inline';
    parser: 'pdf-parse' | 'mammoth' | 'plain-text';
    charCount: number;
    structuredAt: string;
    spans: Array<{ kind: 'claim' | 'actor' | 'timeline'; text: string; charStart: number; charEnd: number; page: number | null }>;
  };
}

const ORG_SUFFIX = /\b(?:Ministry|Department|Agency|Council|Commission|Committee|Bank|Fund|Authority|Mission|Office|Union|Nations|Government|Parliament)\b/;

export function autoStructureDocument(input: {
  filename: string;
  fileType: string;
  text: string;
  parser: AutoStructuredDocument['provenance']['parser'];
}): AutoStructuredDocument {
  const text = normalizeWhitespace(input.text);
  const title = inferTitle(input.filename, text);
  const timelineCandidates = inferTimelineCandidates(text);
  const keyClaims = inferKeyClaims(text);
  const actors = inferActors(text);

  return {
    title,
    sourceType: inferSourceType(input.fileType, text),
    date: timelineCandidates[0]?.date ?? inferLooseDate(text),
    keyClaims,
    actors,
    timelineCandidates,
    provenance: {
      extraction: 'inline',
      parser: input.parser,
      charCount: text.length,
      structuredAt: new Date().toISOString(),
      spans: buildSpans(text, keyClaims, actors, timelineCandidates),
    },
  };
}

function inferTitle(filename: string, text: string): string {
  const firstLine = text.split('\n').map((line) => line.trim()).find((line) => line.length >= 8 && line.length <= 120);
  const fallback = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || filename;
  return firstLine ?? fallback;
}

function inferSourceType(fileType: string, text: string): string {
  const lower = `${fileType} ${text.slice(0, 1200)}`.toLowerCase();
  if (lower.includes('press release') || lower.includes('statement by')) return 'official-statement';
  if (lower.includes('minutes') || lower.includes('meeting')) return 'meeting-record';
  if (lower.includes('brief') || lower.includes('memo')) return 'briefing-note';
  if (lower.includes('report')) return 'report';
  return fileType === 'pdf' || fileType === 'docx' ? 'uploaded-document' : 'text-note';
}

function inferKeyClaims(text: string): string[] {
  return sentenceList(text)
    .filter((sentence) => /\b(?:is|are|was|were|will|must|should|could|has|have|shows|indicates|reports|confirms|requires)\b/i.test(sentence))
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 260)
    .slice(0, 8);
}

function inferActors(text: string): string[] {
  const candidates = new Map<string, number>();
  const matches = text.match(/\b[A-Z][A-Za-z.'&-]+(?:\s+[A-Z][A-Za-z.'&-]+){0,4}\b/g) ?? [];
  for (const match of matches) {
    const cleaned = match.trim().replace(/\s+/g, ' ');
    if (cleaned.length < 4 || /^\d/.test(cleaned)) continue;
    if (!ORG_SUFFIX.test(cleaned) && cleaned.split(' ').length === 1) continue;
    candidates.set(cleaned, (candidates.get(cleaned) ?? 0) + 1);
  }
  return [...candidates.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([actor]) => actor)
    .slice(0, 12);
}

function inferTimelineCandidates(text: string): Array<{ date: string; text: string }> {
  const sentences = sentenceList(text);
  const candidates: Array<{ date: string; text: string }> = [];
  for (const sentence of sentences) {
    const date = sentence.match(/\b(?:20\d{2}|19\d{2})[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b/)?.[0]
      ?? sentence.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(?:20\d{2}|19\d{2})\b/i)?.[0]
      ?? sentence.match(/\b(?:20\d{2}|19\d{2})\b/)?.[0];
    if (date) candidates.push({ date, text: sentence.slice(0, 260) });
    if (candidates.length >= 8) break;
  }
  return candidates;
}

function inferLooseDate(text: string): string | null {
  return text.match(/\b(?:20\d{2}|19\d{2})\b/)?.[0] ?? null;
}

function sentenceList(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildSpans(
  text: string,
  claims: string[],
  actors: string[],
  timelineCandidates: Array<{ date: string; text: string }>,
): AutoStructuredDocument['provenance']['spans'] {
  const spans: AutoStructuredDocument['provenance']['spans'] = [];
  const addSpan = (kind: 'claim' | 'actor' | 'timeline', value: string) => {
    const index = text.indexOf(value);
    if (index < 0) return;
    spans.push({
      kind,
      text: value.slice(0, 260),
      charStart: index,
      charEnd: index + value.length,
      page: null,
    });
  };
  claims.slice(0, 8).forEach((claim) => addSpan('claim', claim));
  actors.slice(0, 12).forEach((actor) => addSpan('actor', actor));
  timelineCandidates.slice(0, 8).forEach((candidate) => addSpan('timeline', candidate.text));
  return spans.sort((a, b) => a.charStart - b.charStart).slice(0, 40);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
