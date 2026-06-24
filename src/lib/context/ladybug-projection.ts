import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';

export interface LadybugProjectionNode {
  id: string;
  label: string;
  entityType: string;
  primitive: TacitusCorePrimitive;
  reviewState: 'advisory';
  confidence: number;
  confidenceKind: 'EXTRACTED';
  sourceReceiptIds: string[];
  derivedFrom: string[];
  jsonldId: string;
}

export interface LadybugProjectionEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: string;
  reviewState: 'advisory';
  confidence: number;
  confidenceKind: 'EXTRACTED';
  sourceReceiptIds: string[];
  derivedFrom: string[];
  directlySourceStated: false;
}

export interface LadybugProjection {
  provider: 'graphlite';
  projectionId: string;
  status: 'compiled-advisory';
  namedGraph: string;
  advisoryOnly: true;
  readOnly: true;
  canonicalStore: 'Firestore ContextCapsules';
  promotionGate: string;
  source: 'dialectica:graph.jsonld';
  projectionKind: 'ladybug-deterministic-jsonld';
  derivedFrom: ['dialectica:graph.jsonld'];
  nodeCount: number;
  edgeCount: number;
  nodes: LadybugProjectionNode[];
  edges: LadybugProjectionEdge[];
  rawJsonLd: unknown;
}

interface JsonLdRecord {
  rawId: string;
  id: string;
  record: Record<string, unknown>;
}

const SOURCE_RELATION_KEYS = new Set([
  'source',
  'sources',
  'sourceref',
  'sourcerefs',
  'sourceid',
  'sourceids',
  'sourcereceipt',
  'sourcereceipts',
  'evidence',
  'evidenceref',
  'evidencerefs',
  'citation',
  'citations',
  'provenance',
  'wasderivedfrom',
]);

const SCALAR_KEYS = new Set([
  '@id',
  '@type',
  '@context',
  '@graph',
  'id',
  'label',
  'title',
  'name',
  'description',
  'type',
  'confidence',
  'confidencekind',
  'trustlayer',
  'start',
  'end',
  'date',
  'decision',
]);

export function buildLadybugProjectionFromGraphJsonLd(
  graphJsonld: unknown,
  options: { capsuleId: string },
): LadybugProjection {
  const records = collectJsonLdRecords(graphJsonld);
  const idByRawId = new Map(records.flatMap((record) => [
    [record.rawId, record.id] as const,
    [localId(record.rawId), record.id] as const,
  ]));
  const sourceLikeIds = new Set(records
    .filter((record) => isSourceLike(record))
    .map((record) => record.id));

  const nodeSourceIds = new Map<string, string[]>();
  for (const record of records) {
    nodeSourceIds.set(record.id, sourceReceiptIdsForRecord(record, idByRawId, sourceLikeIds));
  }

  const nodes = records
    .map((record): LadybugProjectionNode => {
      const entityType = entityTypeOf(record.record);
      const sourceReceiptIds = nodeSourceIds.get(record.id) ?? [];
      return {
        id: record.id,
        label: labelOf(record.record, record.id),
        entityType,
        primitive: primitiveForEntityType(entityType),
        reviewState: 'advisory',
        confidence: confidenceForRecord(record.record, sourceReceiptIds),
        confidenceKind: 'EXTRACTED',
        sourceReceiptIds,
        derivedFrom: [record.rawId],
        jsonldId: record.rawId,
      };
    })
    .sort(compareById);

  const edges = records
    .flatMap((record) => edgesForRecord(record, idByRawId, sourceLikeIds, nodeSourceIds.get(record.id) ?? []))
    .sort((left, right) => (
      left.source.localeCompare(right.source)
      || left.relationshipType.localeCompare(right.relationshipType)
      || left.target.localeCompare(right.target)
      || left.id.localeCompare(right.id)
    ));

  return {
    provider: 'graphlite',
    projectionId: `dialectica-${stableSegment(options.capsuleId)}-ladybug-jsonld`,
    status: 'compiled-advisory',
    namedGraph: `dialectica:${options.capsuleId}:ladybug-jsonld`,
    advisoryOnly: true,
    readOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: 'Human review-card approval required before canonical graph promotion.',
    source: 'dialectica:graph.jsonld',
    projectionKind: 'ladybug-deterministic-jsonld',
    derivedFrom: ['dialectica:graph.jsonld'],
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    rawJsonLd: graphJsonld,
  };
}

function collectJsonLdRecords(input: unknown): JsonLdRecord[] {
  const byId = new Map<string, JsonLdRecord>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;
    if (Array.isArray(value['@graph'])) {
      visit(value['@graph']);
      return;
    }
    const rawId = cleanString(value['@id']);
    if (!rawId) return;
    const id = stableSegment(localId(rawId) || rawId);
    byId.set(id, { rawId, id, record: value });
  };
  visit(input);
  return Array.from(byId.values()).sort(compareById);
}

function edgesForRecord(
  record: JsonLdRecord,
  idByRawId: Map<string, string>,
  sourceLikeIds: Set<string>,
  nodeSourceReceiptIds: string[],
): LadybugProjectionEdge[] {
  const edges: LadybugProjectionEdge[] = [];
  for (const [rawKey, rawValue] of Object.entries(record.record)) {
    const relationshipType = relationshipTypeOf(rawKey);
    if (!relationshipType || SCALAR_KEYS.has(relationshipType) || SOURCE_RELATION_KEYS.has(relationshipType)) continue;
    for (const target of referenceIds(rawValue, idByRawId)) {
      if (sourceLikeIds.has(target)) continue;
      const sourceReceiptIds = uniqueStrings([
        ...nodeSourceReceiptIds,
        ...sourceReceiptIdsFromValue(rawValue, idByRawId, sourceLikeIds),
      ]);
      edges.push({
        id: `ladybug-edge-${stableHash(`${record.id}|${relationshipType}|${target}`)}`,
        source: record.id,
        target,
        label: relationshipType,
        relationshipType,
        reviewState: 'advisory',
        confidence: sourceReceiptIds.length ? 0.65 : 0.55,
        confidenceKind: 'EXTRACTED',
        sourceReceiptIds,
        derivedFrom: [`${record.rawId}:${rawKey}:${target}`],
        directlySourceStated: false,
      });
    }
  }
  return dedupeEdges(edges);
}

function sourceReceiptIdsForRecord(
  record: JsonLdRecord,
  idByRawId: Map<string, string>,
  sourceLikeIds: Set<string>,
): string[] {
  const ids: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(record.record)) {
    const key = relationshipTypeOf(rawKey);
    if (!SOURCE_RELATION_KEYS.has(key)) continue;
    ids.push(...sourceReceiptIdsFromValue(rawValue, idByRawId, sourceLikeIds));
  }
  return uniqueStrings(ids).sort();
}

function sourceReceiptIdsFromValue(
  value: unknown,
  idByRawId: Map<string, string>,
  sourceLikeIds: Set<string>,
): string[] {
  return scalarValues(value)
    .map((item) => idByRawId.get(item) ?? idByRawId.get(localId(item)) ?? stableSegment(localId(item) || item))
    .filter((id) => sourceLikeIds.has(id) || id.toLowerCase().startsWith('src'));
}

function referenceIds(value: unknown, idByRawId: Map<string, string>): string[] {
  return uniqueStrings(scalarValues(value)
    .map((item) => idByRawId.get(item) ?? idByRawId.get(localId(item)) ?? '')
    .filter(Boolean));
}

function scalarValues(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(scalarValues);
  if (isRecord(value)) {
    const id = cleanString(value['@id'] ?? value.id);
    return id ? [id] : [];
  }
  return [];
}

function isSourceLike(record: JsonLdRecord): boolean {
  const entityType = entityTypeOf(record.record).toLowerCase();
  return record.id.toLowerCase().startsWith('src')
    || entityType === 'source'
    || entityType === 'sourcereceipt'
    || entityType === 'evidence'
    || entityType === 'entity';
}

function entityTypeOf(record: Record<string, unknown>): string {
  const rawType = Array.isArray(record['@type']) ? record['@type'][0] : record['@type'];
  const cleaned = cleanString(rawType);
  return localId(cleaned) || cleanString(record.type) || 'JsonLdNode';
}

function labelOf(record: Record<string, unknown>, fallback: string): string {
  return cleanString(record['dialectica:title'])
    || cleanString(record['rdfs:label'])
    || cleanString(record.label)
    || cleanString(record.title)
    || cleanString(record.name)
    || fallback;
}

function primitiveForEntityType(entityType: string): TacitusCorePrimitive {
  const normalized = entityType.toLowerCase().replace(/[_\s-]+/g, '');
  if (normalized.includes('actor') || normalized.includes('institution') || normalized.includes('organization')) return 'Actor';
  if (normalized.includes('event') || normalized.includes('episode')) return 'Event';
  if (normalized.includes('interest')) return 'Interest';
  if (normalized.includes('constraint')) return 'Constraint';
  if (normalized.includes('leverage')) return 'Leverage';
  if (normalized.includes('commitment') || normalized.includes('reviewaction') || normalized.includes('runtimecontract')) return 'Commitment';
  if (normalized.includes('narrative')) return 'Narrative';
  return 'Claim';
}

function confidenceForRecord(record: Record<string, unknown>, sourceReceiptIds: string[]): number {
  const explicit = numberOrNull(record.confidence ?? record['dialectica:confidence']);
  if (explicit !== null) return explicit;
  const trustLayer = cleanString(record['dialectica:trustLayer'] ?? record.trustLayer).toUpperCase();
  if (trustLayer === 'T1') return 0.9;
  if (trustLayer === 'T2') return 0.75;
  if (trustLayer === 'T3') return 0.6;
  if (trustLayer === 'T4') return 0.45;
  return sourceReceiptIds.length ? 0.65 : 0.55;
}

function relationshipTypeOf(key: string): string {
  return localId(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]+/g, '')
    .replace(/^_+|_+$/g, '');
}

function localId(value: string): string {
  return value.replace(/^.*[:/#]/, '').trim();
}

function stableSegment(value: string): string {
  return value.replace(/[^\w:.-]/g, '-').slice(0, 120) || `node-${stableHash(value)}`;
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index);
    hash >>>= 0;
  }
  return hash.toString(36).slice(0, 10);
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(1, value > 1 ? value / 100 : value)) * 1000) / 1000;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

function compareById<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function dedupeEdges(edges: LadybugProjectionEdge[]): LadybugProjectionEdge[] {
  const seen = new Set<string>();
  const result: LadybugProjectionEdge[] = [];
  for (const edge of edges) {
    const key = `${edge.source}|${edge.relationshipType}|${edge.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(edge);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
