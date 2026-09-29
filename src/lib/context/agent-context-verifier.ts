import type {
  AgentContextGroundingMap,
  AgentContextPacketResult,
} from '@/lib/context/agent-context-packet';
import type {
  NormalizedClaimCard,
  NormalizedSourceReceipt,
  ReasoningPath,
  SelectedAgentContext,
} from '@/lib/context/agent-context-salience';

export interface AgentContextVerifierInput {
  outputText: string;
  packet?: Pick<AgentContextPacketResult, 'selected' | 'groundingMap'> | null;
  selected?: SelectedAgentContext | null;
  groundingMap?: AgentContextGroundingMap | null;
}

export interface AgentContextVerifiedClaim {
  text: string;
  start: number;
  end: number;
  claimCardIds: string[];
  sourceReceiptIds: string[];
  graphPathIds: string[];
  matchReasons: string[];
}

export interface AgentContextFlaggedSpan {
  text: string;
  start: number;
  end: number;
  reason: 'no_packet' | 'no_packet_evidence' | 'no_packet_binding' | 'contradicted_by_capsule';
  claimCardIds: string[];
  sourceReceiptIds: string[];
  graphPathIds: string[];
}

export interface AgentContextGroundingReport {
  groundedClaims: AgentContextVerifiedClaim[];
  ungroundedSpans: AgentContextFlaggedSpan[];
  contradictedSpans: AgentContextFlaggedSpan[];
  coverageScore: number;
  notes: string[];
}

type EvidenceIndex = {
  selected: SelectedAgentContext;
  groundingMap: AgentContextGroundingMap;
  claimDisplayByOriginal: Map<string, string>;
  sourceDisplayByOriginal: Map<string, string>;
  pathDisplayByMember: Map<string, string[]>;
};

type SpanCandidate = {
  text: string;
  start: number;
  end: number;
};

type SpanMatch = {
  claimCardIds: string[];
  sourceReceiptIds: string[];
  graphPathIds: string[];
  claims: NormalizedClaimCard[];
  sources: NormalizedSourceReceipt[];
  paths: ReasoningPath[];
  matchReasons: string[];
};

const DISABLE_VALUES = new Set(['0', 'false', 'off', 'disabled', 'no']);
const ID_PATTERN = /\b(?:CL|SR|P)-\d+\b/g;
const TOKEN_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'with',
]);
const CONTRADICTION_ACKNOWLEDGEMENT = /\b(conflict|conflicts|conflicting|contradict|contradicts|contradicted|dispute|disputed|contested|counterevidence|counter-evidence|however|but)\b/i;

export function shouldEnableAgentContextVerifier(value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') return true;
  return !DISABLE_VALUES.has(value.trim().toLowerCase());
}

export function verifyAgentContextGrounding(input: AgentContextVerifierInput): AgentContextGroundingReport {
  const spans = extractDecisionRelevantSpans(input.outputText);
  if (!spans.length) {
    return {
      groundedClaims: [],
      ungroundedSpans: [],
      contradictedSpans: [],
      coverageScore: 1,
      notes: ['No decision-relevant output claims were detected.'],
    };
  }

  const index = buildEvidenceIndex(input);
  if (!index) {
    return {
      groundedClaims: [],
      ungroundedSpans: spans.map((span) => flaggedSpan(span, 'no_packet')),
      contradictedSpans: [],
      coverageScore: 0,
      notes: ['No packet was provided for grounding verification.'],
    };
  }

  if (!hasPacketEvidence(index.selected)) {
    return {
      groundedClaims: [],
      ungroundedSpans: spans.map((span) => flaggedSpan(span, 'no_packet_evidence')),
      contradictedSpans: [],
      coverageScore: 0,
      notes: ['No packet evidence was available for grounding verification.'],
    };
  }

  const groundedClaims: AgentContextVerifiedClaim[] = [];
  const ungroundedSpans: AgentContextFlaggedSpan[] = [];
  const contradictedSpans: AgentContextFlaggedSpan[] = [];

  for (const span of spans) {
    const match = matchSpanToEvidence(span.text, index);
    if (match.claims.some(isContradictedClaim) && !CONTRADICTION_ACKNOWLEDGEMENT.test(span.text)) {
      contradictedSpans.push(flaggedSpan(span, 'contradicted_by_capsule', match));
    } else if (match.claimCardIds.length || match.sourceReceiptIds.length || match.graphPathIds.length) {
      groundedClaims.push({
        text: span.text,
        start: span.start,
        end: span.end,
        claimCardIds: match.claimCardIds,
        sourceReceiptIds: match.sourceReceiptIds,
        graphPathIds: match.graphPathIds,
        matchReasons: match.matchReasons,
      });
    } else {
      ungroundedSpans.push(flaggedSpan(span, 'no_packet_binding'));
    }
  }

  return {
    groundedClaims,
    ungroundedSpans,
    contradictedSpans,
    coverageScore: roundScore(groundedClaims.length / spans.length),
    notes: buildNotes({ spans, groundedClaims, ungroundedSpans, contradictedSpans }),
  };
}

function buildEvidenceIndex(input: AgentContextVerifierInput): EvidenceIndex | null {
  const selected = input.packet?.selected ?? input.selected ?? null;
  const groundingMap = input.packet?.groundingMap ?? input.groundingMap ?? null;
  if (!selected || !groundingMap) return null;
  const claimDisplayByOriginal = invertRecord(groundingMap.claims);
  const sourceDisplayByOriginal = invertRecord(groundingMap.sources);
  const pathDisplayByMember = new Map<string, string[]>();
  for (const [displayId, members] of Object.entries(groundingMap.paths)) {
    for (const member of members) {
      const current = pathDisplayByMember.get(member) ?? [];
      current.push(displayId);
      pathDisplayByMember.set(member, current);
    }
  }
  return {
    selected,
    groundingMap,
    claimDisplayByOriginal,
    sourceDisplayByOriginal,
    pathDisplayByMember,
  };
}

function extractDecisionRelevantSpans(outputText: string): SpanCandidate[] {
  const spans: SpanCandidate[] = [];
  const pattern = /[^\n.!?]+(?:[.!?]+|(?=\n|$))/g;
  for (const match of outputText.matchAll(pattern)) {
    const raw = match[0];
    const leading = raw.search(/\S/);
    if (leading === -1) continue;
    const text = raw.trim();
    if (!isDecisionRelevant(text)) continue;
    const start = (match.index ?? 0) + leading;
    spans.push({
      text,
      start,
      end: start + text.length,
    });
  }
  return spans;
}

function isDecisionRelevant(text: string): boolean {
  if (!text || /^#+\s/.test(text)) return false;
  if (text.endsWith('?')) return false;
  if (ID_PATTERN.test(text)) {
    ID_PATTERN.lastIndex = 0;
    return true;
  }
  ID_PATTERN.lastIndex = 0;
  return tokensFor(text).length >= 4;
}

function matchSpanToEvidence(text: string, index: EvidenceIndex): SpanMatch {
  const explicitIds = explicitEvidenceIds(text);
  const citedReceiptIds = new Set([...text.matchAll(/\[([^\]]+)\]/g)]
    .flatMap((match) => match[1].split(',').map((id) => id.trim())));
  const claims = uniqueBy([
    ...explicitIds.claims.flatMap((displayId) => claimByDisplayId(displayId, index)),
    ...index.selected.claims.filter((claim) => lexicalMatch(text, claim.text, 0.66)),
  ], (claim) => claim.id);
  const sources = uniqueBy([
    ...explicitIds.sources.flatMap((displayId) => sourceByDisplayId(displayId, index)),
    ...index.selected.sources.filter((source) => Boolean(source.excerpt?.trim()) && citedReceiptIds.has(source.id)),
    ...sourcesForClaims(claims, index),
    ...index.selected.sources.filter((source) => source.excerpt && lexicalMatch(text, source.excerpt, 0.72)),
  ], (source) => source.id);
  const paths = uniqueBy([
    ...explicitIds.paths.flatMap((displayId) => pathByDisplayId(displayId, index)),
  ], (path) => path.id);

  const sourceIds = uniqueStrings([
    ...sources.map((source) => displaySourceId(source.id, index)).filter(isString),
    ...claims.flatMap((claim) => [
      ...claim.sourceReceiptIds,
      ...claim.contradicts,
    ]).map((sourceId) => displaySourceId(sourceId, index)).filter(isString),
    ...paths.flatMap((path) => path.sourceReceiptIds).map((sourceId) => displaySourceId(sourceId, index)).filter(isString),
  ]);
  const claimIds = uniqueStrings(claims.map((claim) => displayClaimId(claim.id, index)).filter(isString));
  const pathIds = uniqueStrings(paths.map((path) => pathDisplayId(path, index)).filter((id): id is string => Boolean(id)));
  return {
    claimCardIds: claimIds,
    sourceReceiptIds: sourceIds,
    graphPathIds: pathIds,
    claims,
    sources,
    paths,
    matchReasons: matchReasons({ explicitIds, claims, sources, paths }),
  };
}

function explicitEvidenceIds(text: string): { claims: string[]; sources: string[]; paths: string[] } {
  const ids = text.match(ID_PATTERN) ?? [];
  ID_PATTERN.lastIndex = 0;
  return {
    claims: ids.filter((id) => id.startsWith('CL-')),
    sources: ids.filter((id) => id.startsWith('SR-')),
    paths: ids.filter((id) => id.startsWith('P-')),
  };
}

function claimByDisplayId(displayId: string, index: EvidenceIndex): NormalizedClaimCard[] {
  const originalId = index.groundingMap.claims[displayId];
  const claim = originalId ? index.selected.claims.find((item) => item.id === originalId) : null;
  return claim ? [claim] : [];
}

function sourceByDisplayId(displayId: string, index: EvidenceIndex): NormalizedSourceReceipt[] {
  const originalId = index.groundingMap.sources[displayId];
  const source = originalId ? index.selected.sources.find((item) => item.id === originalId) : null;
  return source ? [source] : [];
}

function pathByDisplayId(displayId: string, index: EvidenceIndex): ReasoningPath[] {
  const memberIds = index.groundingMap.paths[displayId];
  if (!memberIds) return [];
  return index.selected.paths.filter((path) => {
    const members = new Set([...path.nodeIds, ...path.edgeIds, ...path.sourceReceiptIds]);
    return memberIds.some((memberId) => members.has(memberId));
  });
}

function sourcesForClaims(claims: NormalizedClaimCard[], index: EvidenceIndex): NormalizedSourceReceipt[] {
  const sourceIds = new Set(claims.flatMap((claim) => claim.sourceReceiptIds));
  return index.selected.sources.filter((source) => sourceIds.has(source.id));
}

function isContradictedClaim(claim: NormalizedClaimCard): boolean {
  return Boolean(
    claim.contradicts.length
    || /contradict|disput|conflict|counter/i.test(claim.support ?? '')
    || /contradict|disput|conflict|counter/i.test(claim.caveat ?? ''),
  );
}

function flaggedSpan(
  span: SpanCandidate,
  reason: AgentContextFlaggedSpan['reason'],
  match?: SpanMatch,
): AgentContextFlaggedSpan {
  return {
    text: span.text,
    start: span.start,
    end: span.end,
    reason,
    claimCardIds: match?.claimCardIds ?? [],
    sourceReceiptIds: match?.sourceReceiptIds ?? [],
    graphPathIds: match?.graphPathIds ?? [],
  };
}

function displayClaimId(originalId: string, index: EvidenceIndex): string | null {
  return index.claimDisplayByOriginal.get(originalId) ?? null;
}

function displaySourceId(originalId: string, index: EvidenceIndex): string | null {
  return index.sourceDisplayByOriginal.get(originalId) ?? null;
}

function pathDisplayId(path: ReasoningPath, index: EvidenceIndex): string | null {
  const memberIds = [...path.nodeIds, ...path.edgeIds, ...path.sourceReceiptIds];
  for (const memberId of memberIds) {
    const displayIds = index.pathDisplayByMember.get(memberId);
    if (displayIds?.length) return displayIds[0];
  }
  return null;
}

function lexicalMatch(outputText: string, evidenceText: string, threshold: number): boolean {
  const outputTokens = new Set(tokensFor(outputText));
  const evidenceTokens = tokensFor(evidenceText);
  if (!outputTokens.size || !evidenceTokens.length) return false;
  const matched = evidenceTokens.filter((token) => outputTokens.has(token)).length;
  return matched / evidenceTokens.length >= threshold;
}

function tokensFor(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/\b(?:cl|sr|p)-\d+\b/g, ' ')
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2 && !TOKEN_STOPWORDS.has(token)) ?? [];
}

function matchReasons(input: {
  explicitIds: { claims: string[]; sources: string[]; paths: string[] };
  claims: NormalizedClaimCard[];
  sources: NormalizedSourceReceipt[];
  paths: ReasoningPath[];
}): string[] {
  return uniqueStrings([
    ...(input.explicitIds.claims.length ? ['explicit_claim_id'] : []),
    ...(input.explicitIds.sources.length ? ['explicit_source_receipt_id'] : []),
    ...(input.explicitIds.paths.length ? ['explicit_graph_path_id'] : []),
    ...(input.claims.length && !input.explicitIds.claims.length ? ['claim_text_overlap'] : []),
    ...(input.sources.length && !input.explicitIds.sources.length ? ['source_receipt_overlap'] : []),
  ]);
}

function buildNotes(input: {
  spans: SpanCandidate[];
  groundedClaims: AgentContextVerifiedClaim[];
  ungroundedSpans: AgentContextFlaggedSpan[];
  contradictedSpans: AgentContextFlaggedSpan[];
}): string[] {
  return [
    `${input.groundedClaims.length} of ${input.spans.length} decision-relevant claim span${input.spans.length === 1 ? '' : 's'} grounded.`,
    ...(input.ungroundedSpans.length ? [`${input.ungroundedSpans.length} claim span${input.ungroundedSpans.length === 1 ? '' : 's'} lacked packet bindings.`] : []),
    ...(input.contradictedSpans.length ? [`${input.contradictedSpans.length} claim span${input.contradictedSpans.length === 1 ? '' : 's'} matched contradicted capsule evidence.`] : []),
  ];
}

function hasPacketEvidence(selected: SelectedAgentContext): boolean {
  return Boolean(
    selected.claims.length
    || selected.sources.length
    || selected.paths.length
    || selected.nodes.length
    || selected.edges.length,
  );
}

function invertRecord(record: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(record).map(([display, original]) => [original, display]));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const id = key(value);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value);
  }
  return result;
}

function roundScore(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}
