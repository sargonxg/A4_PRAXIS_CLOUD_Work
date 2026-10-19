import type { CapsuleTemporalViewerItem } from '@/components/capsules/viewers/CapsuleTemporalViewer';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import { UNIVERSAL_CAUSAL_EDGE_TYPES, UNIVERSAL_TEMPORAL_EDGE_TYPES } from '@/lib/ontology/universal';

export type TemporalTimelineItemKind =
  | 'anchor'
  | 'event'
  | 'commitment'
  | 'claim'
  | 'constraint'
  | 'validity-start'
  | 'validity-end'
  | string;

export type TemporalTimelineGrounding = 'receipt_grounded' | 'advisory_uncertain';

export interface TemporalTimelineItem {
  id: string;
  date: string;
  normalizedDate: string | null;
  dateSortKey: number | null;
  dateUnparseable: boolean;
  kind: TemporalTimelineItemKind;
  label: string;
  sourceReceiptIds: string[];
  confidence: number | null;
  validFrom: string | null;
  validTo: string | null;
  nodeIds: string[];
  claimIds: string[];
  advisory: boolean;
  grounding: TemporalTimelineGrounding;
}

export interface TemporalTimelineEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  sourceReceiptIds: string[];
  confidence: number | null;
  advisory: boolean;
  grounding: TemporalTimelineGrounding;
}

export interface TemporalTimeline {
  capsuleId: string;
  asOf: string | null;
  validFrom: string | null;
  validUntil: string | null;
  requestTime: string | null;
  items: TemporalTimelineItem[];
  edges: TemporalTimelineEdge[];
  viewerItems: CapsuleTemporalViewerItem[];
  warnings: string[];
}

export interface BuildTemporalTimelineInput {
  capsule: PraxisCapsule;
  requestTime?: string | null;
}

const TEMPORAL_RELATIONS = new Set(UNIVERSAL_TEMPORAL_EDGE_TYPES.map((edge) => edge.id));
const CAUSAL_RELATIONS = new Set(UNIVERSAL_CAUSAL_EDGE_TYPES.map((edge) => edge.id));

export function isTemporalIntent(prompt: string | null | undefined): boolean {
  const text = cleanString(prompt).toLowerCase();
  if (!text) return false;
  return /\b(timeline|chronology|sequence|sequenc(?:e|ing)|when|before|after|during|over time|date|deadline|expire|expires|expired|renew|renews|valid|validity|stale|freshness|escalat(?:e|ed|ion).*time|what changed)\b/.test(text);
}

export function buildTemporalTimeline(input: BuildTemporalTimelineInput): TemporalTimeline {
  const temporality = capsuleTemporality(input.capsule);
  const graph = graphRecord(input.capsule);
  const nodes = arrayOfRecords(graph?.nodes);
  const nodeItemIds = new Map<string, string>();
  const claimItemIds = new Map<string, string>();
  const items = uniqueBy([
    ...anchorItems(input.capsule, temporality),
    ...claimItems(input.capsule, claimItemIds),
    ...nodeItems(nodes, nodeItemIds),
  ], (item) => item.id).sort(compareTimelineItems);
  const itemIds = new Set(items.map((item) => item.id));
  const warnings: string[] = [];
  const edges = uniqueBy([
    ...graphTemporalEdges(graph, nodeItemIds, itemIds),
    ...capsuleCausalEdges(input.capsule, nodeItemIds, claimItemIds, itemIds, warnings),
  ], (edge) => edge.id).sort((left, right) => left.source.localeCompare(right.source) || left.target.localeCompare(right.target) || left.id.localeCompare(right.id));
  if (!items.length) warnings.push('No dated capsule events, commitments, claims, or timeline anchors were available.');
  if (items.some((item) => item.dateUnparseable)) {
    warnings.push('Some timeline dates could not be normalized and were placed at the end.');
  }
  return {
    capsuleId: input.capsule.capsuleId,
    asOf: temporality.asOf,
    validFrom: temporality.validFrom,
    validUntil: temporality.validUntil,
    requestTime: cleanString(input.requestTime) || null,
    items,
    edges,
    viewerItems: toCapsuleTemporalViewerItems({ items }),
    warnings,
  };
}

export function toCapsuleTemporalViewerItems(timeline: Pick<TemporalTimeline, 'items'>): CapsuleTemporalViewerItem[] {
  return timeline.items.map((item) => ({
    id: item.id,
    label: item.label,
    start: item.validFrom ?? item.date,
    end: item.validTo,
    group: item.kind,
    kind: item.kind,
    confidence: item.confidence,
    nodeIds: item.nodeIds,
    sourceIds: item.sourceReceiptIds,
  }));
}

function anchorItems(capsule: PraxisCapsule, temporality: ReturnType<typeof capsuleTemporality>): TemporalTimelineItem[] {
  void capsule;
  return arrayOfRecords(temporality.record?.timelineAnchors).flatMap((anchor, index): TemporalTimelineItem[] => {
    const date = firstDate(anchor.date, anchor.start, anchor.asOf);
    if (!date) return [];
    const label = cleanString(anchor.label ?? anchor.title ?? anchor.event) || 'Timeline anchor';
    const sourceReceiptIds = sourceIdsFrom(anchor.sourceRefs, anchor.sourceRefIds, anchor.sourceReceiptIds, anchor.sourceIds);
    return [groundTimelineItem({
      id: `anchor:${cleanString(anchor.id) || stableHash(`${date}:${label}:${index}`)}`,
      date,
      kind: cleanString(anchor.kind) || 'anchor',
      label,
      sourceReceiptIds,
      confidence: numberOrNull(anchor.confidence),
      validFrom: null,
      validTo: nullableString(anchor.end ?? anchor.validTo ?? anchor.validUntil),
      nodeIds: [],
      claimIds: [],
    })];
  });
}

function claimItems(capsule: PraxisCapsule, claimItemIds: Map<string, string>): TemporalTimelineItem[] {
  return claimRecords(capsule).flatMap((claim, index): TemporalTimelineItem[] => {
    const claimId = cleanString(claim.claimId ?? claim.id) || `claim-${stableHash(`${cleanString(claim.text)}:${index}`)}`;
    const date = firstDate(claim.validFrom, claim.asOf, claim.recordedAt);
    if (!date) return [];
    const sourceReceiptIds = sourceIdsFrom(
      claim.sourceRefIds,
      claim.sourceReceiptIds,
      arrayOfRecords(claim.receipts).map((receipt) => cleanString(receipt.sourceId)).filter(Boolean),
    );
    const itemId = `claim:${claimId}`;
    claimItemIds.set(claimId, itemId);
    return [groundTimelineItem({
      id: itemId,
      date,
      kind: 'claim',
      label: cleanString(claim.text) || claimId,
      sourceReceiptIds,
      confidence: claimConfidence(claim),
      validFrom: nullableString(claim.validFrom),
      validTo: nullableString(claim.validTo ?? claim.validUntil),
      nodeIds: [],
      claimIds: [claimId],
    })];
  });
}

function nodeItems(nodes: Record<string, unknown>[], nodeItemIds: Map<string, string>): TemporalTimelineItem[] {
  return nodes.flatMap((node, index): TemporalTimelineItem[] => {
    const nodeId = cleanString(node.id) || `node-${stableHash(`${cleanString(node.label)}:${index}`)}`;
    const primitive = primitiveFor(node.entityType ?? node.type);
    if (primitive !== 'Event' && primitive !== 'Commitment' && primitive !== 'Claim' && primitive !== 'Constraint') return [];
    const date = firstDate(node.validFrom, node.occurredAt, node.date, node.asOf, node.recordedAt);
    if (!date) return [];
    const itemId = `node:${nodeId}`;
    nodeItemIds.set(nodeId, itemId);
    return [groundTimelineItem({
      id: itemId,
      date,
      kind: primitive.toLowerCase(),
      label: cleanString(node.label) || primitive,
      sourceReceiptIds: sourceIdsFrom(node.sourceReceiptIds, node.evidenceRefs, node.sourceRefs, node.sourceIds),
      confidence: numberOrNull(node.confidence),
      validFrom: nullableString(node.validFrom ?? node.occurredAt ?? node.date ?? node.asOf),
      validTo: nullableString(node.validTo ?? node.validUntil),
      nodeIds: [nodeId],
      claimIds: primitive === 'Claim' ? [nodeId] : [],
    })];
  });
}

function graphTemporalEdges(
  graph: Record<string, unknown> | null,
  nodeItemIds: Map<string, string>,
  itemIds: Set<string>,
): TemporalTimelineEdge[] {
  return arrayOfRecords(graph?.edges).flatMap((edge, index): TemporalTimelineEdge[] => {
    const relation = normalizeRelationship(edge.relationshipType ?? edge.label);
    if (!TEMPORAL_RELATIONS.has(relation) && !CAUSAL_RELATIONS.has(relation)) return [];
    const source = nodeItemIds.get(cleanString(edge.source));
    const target = nodeItemIds.get(cleanString(edge.target));
    if (!source || !target || !itemIds.has(source) || !itemIds.has(target)) return [];
    return [groundTimelineEdge({
      id: `edge:${cleanString(edge.id) || stableHash(`${source}:${relation}:${target}:${index}`)}`,
      source,
      target,
      relation,
      sourceReceiptIds: sourceIdsFrom(edge.sourceReceiptIds, edge.evidenceRefs, edge.sourceRefs),
      confidence: numberOrNull(edge.confidence),
    })];
  });
}

function capsuleCausalEdges(
  capsule: PraxisCapsule,
  nodeItemIds: Map<string, string>,
  claimItemIds: Map<string, string>,
  itemIds: Set<string>,
  warnings: string[],
): TemporalTimelineEdge[] {
  const causality = causalityRecord(capsule);
  return arrayOfRecords(causality?.causalLinks).flatMap((link, index): TemporalTimelineEdge[] => {
    const relation = normalizeRelationship(link.relation);
    if (!CAUSAL_RELATIONS.has(relation)) {
      const warning = 'Unsupported or missing causal relations were omitted; temporal ordering does not establish causation.';
      if (!warnings.includes(warning)) warnings.push(warning);
      return [];
    }
    const source = itemIdFor(cleanString(link.cause), nodeItemIds, claimItemIds);
    const target = itemIdFor(cleanString(link.effect), nodeItemIds, claimItemIds);
    if (!source || !target || !itemIds.has(source) || !itemIds.has(target)) return [];
    return [groundTimelineEdge({
      id: `edge:${cleanString(link.id) || stableHash(`${source}:${cleanString(link.relation)}:${target}:${index}`)}`,
      source,
      target,
      relation,
      sourceReceiptIds: sourceIdsFrom(link.evidenceRefs, link.sourceReceiptIds, link.sourceRefs),
      confidence: numberOrNull(link.confidence),
    })];
  });
}

function itemIdFor(id: string, nodeItemIds: Map<string, string>, claimItemIds: Map<string, string>): string | null {
  return nodeItemIds.get(id) ?? claimItemIds.get(id) ?? null;
}

function groundTimelineItem(input: Omit<TemporalTimelineItem, 'advisory' | 'grounding' | 'normalizedDate' | 'dateSortKey' | 'dateUnparseable'>): TemporalTimelineItem {
  const advisory = input.sourceReceiptIds.length === 0;
  const normalized = normalizeTimelineDate(input.date);
  return {
    ...input,
    date: normalized.normalizedDate ?? input.date,
    normalizedDate: normalized.normalizedDate,
    dateSortKey: normalized.sortKey,
    dateUnparseable: normalized.sortKey === null,
    advisory,
    grounding: advisory ? 'advisory_uncertain' : 'receipt_grounded',
  };
}

function groundTimelineEdge(input: Omit<TemporalTimelineEdge, 'advisory' | 'grounding'>): TemporalTimelineEdge {
  const advisory = input.sourceReceiptIds.length === 0;
  return {
    ...input,
    advisory,
    grounding: advisory ? 'advisory_uncertain' : 'receipt_grounded',
  };
}

function capsuleTemporality(capsule: PraxisCapsule): {
  record: Record<string, unknown> | null;
  asOf: string | null;
  validFrom: string | null;
  validUntil: string | null;
} {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  const record = firstRecord(capsule.temporality, grounding?.temporality);
  return {
    record,
    asOf: nullableString(record?.asOf),
    validFrom: nullableString(record?.validFrom),
    validUntil: nullableString(record?.validUntil),
  };
}

function graphRecord(capsule: PraxisCapsule): Record<string, unknown> | null {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  return firstRecord(capsule.embeddedGraph, grounding?.embeddedGraph);
}

function causalityRecord(capsule: PraxisCapsule): Record<string, unknown> | null {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  return firstRecord(capsule.causality, grounding?.causality);
}

function claimRecords(capsule: PraxisCapsule): Record<string, unknown>[] {
  const v3 = firstRecord(capsule.v3);
  const claimLedger = firstRecord(v3?.claimLedger);
  return [
    ...arrayOfRecords(capsule.claimLedger),
    ...arrayOfRecords(claimLedger?.allClaims),
  ];
}

function primitiveFor(value: unknown): TacitusCorePrimitive | null {
  const normalized = cleanString(value).toLowerCase().replace(/[_\s-]+/g, '');
  return TACITUS_CORE_PRIMITIVES.find((primitive) => primitive.toLowerCase() === normalized) ?? null;
}

function claimConfidence(claim: Record<string, unknown>): number | null {
  const receiptConfidences = arrayOfRecords(claim.receipts)
    .map((receipt) => numberOrNull(receipt.confidence))
    .filter((value): value is number => typeof value === 'number');
  if (!receiptConfidences.length) return numberOrNull(claim.confidence);
  return Math.round((receiptConfidences.reduce((sum, value) => sum + value, 0) / receiptConfidences.length) * 100) / 100;
}

function firstDate(...values: unknown[]): string | null {
  let firstUnparseable: string | null = null;
  for (const value of values) {
    const date = nullableString(value);
    if (!date) continue;
    const normalized = normalizeTimelineDate(date);
    if (normalized.normalizedDate) return normalized.normalizedDate;
    firstUnparseable ??= date;
  }
  return firstUnparseable;
}

function sourceIdsFrom(...values: unknown[]): string[] {
  return uniqueStrings(values.flatMap((value) => Array.isArray(value) ? value.map(cleanString) : [cleanString(value)]));
}

function compareTimelineItems(left: TemporalTimelineItem, right: TemporalTimelineItem): number {
  const leftSort = left.dateSortKey ?? Number.POSITIVE_INFINITY;
  const rightSort = right.dateSortKey ?? Number.POSITIVE_INFINITY;
  return leftSort - rightSort || kindRank(left.kind) - kindRank(right.kind) || left.id.localeCompare(right.id);
}

function normalizeTimelineDate(value: string): { normalizedDate: string | null; sortKey: number | null } {
  const cleaned = value.trim();
  const yearOnly = /^(\d{4})$/.exec(cleaned);
  if (yearOnly) return normalizedUtcDate(Number(yearOnly[1]), 1, 1);

  const yearMonth = /^(\d{4})-(\d{2})$/.exec(cleaned);
  if (yearMonth) return normalizedUtcDate(Number(yearMonth[1]), Number(yearMonth[2]), 1);

  const isoLike = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(cleaned);
  if (isoLike) return normalizedUtcDate(Number(isoLike[1]), Number(isoLike[2]), Number(isoLike[3]));

  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cleaned);
  if (slashDate) return normalizedUtcDate(Number(slashDate[3]), Number(slashDate[1]), Number(slashDate[2]));

  const parsed = Date.parse(cleaned);
  if (!Number.isFinite(parsed)) return { normalizedDate: null, sortKey: null };
  const date = new Date(parsed);
  return normalizedUtcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function normalizedUtcDate(year: number, month: number, day: number): { normalizedDate: string | null; sortKey: number | null } {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return { normalizedDate: null, sortKey: null };
  }
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { normalizedDate: null, sortKey: null };
  }
  const sortKey = Date.UTC(year, month - 1, day);
  const date = new Date(sortKey);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { normalizedDate: null, sortKey: null };
  }
  return { normalizedDate: date.toISOString().slice(0, 10), sortKey };
}

function kindRank(kind: string): number {
  if (kind === 'claim') return 0;
  if (kind === 'event') return 1;
  if (kind === 'deadline') return 2;
  if (kind === 'commitment') return 3;
  if (kind === 'constraint') return 4;
  return 5;
}

function normalizeRelationship(value: unknown): string {
  return cleanString(value).toLowerCase().replace(/[\s-]+/g, '_');
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}

function nullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index);
    hash >>>= 0;
  }
  return hash.toString(36).slice(0, 8);
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

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value?.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}
