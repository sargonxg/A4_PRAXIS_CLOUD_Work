/**
 * Situation Corpus search — shared retrieval used by Ask PRAXIS,
 * Brainstorming Table, Humanitarian, and the public
 * `/api/intelligence/corpus-search` endpoint.
 *
 * Strategy today: deterministic keyword + recency ranking across five layers.
 * Document layer also leverages the shared provider embedding vectors when the
 * stored chunks have them (`retrieveRelevantChunks` hybrid scoring). Vector
 * search across other layers is a follow-up (Firestore vector indexes — see
 * docs/CORPUS_ARCHITECTURE.md).
 *
 * Hard constraints:
 *  - Reads only via firebase-admin (server-side). No client SDK calls.
 *  - Never throws — degrade per-layer to an empty result with a recorded
 *    reason. The caller still gets a usable response.
 *  - Truncates excerpts so this is safe to paste into an AI prompt.
 */

import { getToolData } from '@/lib/firebase/tool-data-service';
import { retrieveRelevantChunks } from '@/lib/firebase/documents-service';
import { getSituationById, getConflictGraphAdmin } from '@/lib/firebase/situations';
import { adminDb } from '@/lib/firebase/admin';
import type {
  CorpusItem,
  CorpusLayer,
  CorpusSearchResponse,
  CorpusSearchTrace,
  CorpusConfidence,
} from '@/types/corpus';
import {
  DEFAULT_CORPUS_LAYERS,
  DEFAULT_CORPUS_LIMIT,
  MAX_CORPUS_LIMIT,
} from '@/types/corpus';
import {
  evidenceEnvelopeToCorpusItem,
  scoreText,
  summarizeToolOutput,
  toolOutputToEvidenceEnvelope,
} from '@/lib/knowledge/evidence-envelope';
import { listKnowledgeDocuments } from '@/lib/knowledge/library-service';

const MAX_EXCERPT_CHARS = 480;

export interface SearchSituationCorpusInput {
  uid: string;
  situationId: string;
  query: string;
  layers?: CorpusLayer[];
  limit?: number;
  contextPackageId?: string;
  contextHealthScore?: number;
  checkFreshness?: boolean;
}

export async function searchSituationCorpus(
  input: SearchSituationCorpusInput
): Promise<CorpusSearchResponse> {
  const start = Date.now();
  const layers = (input.layers && input.layers.length > 0
    ? input.layers
    : DEFAULT_CORPUS_LAYERS
  ).filter((l, i, arr) => arr.indexOf(l) === i);
  const limit = clampLimit(input.limit);
  const queryTerms = tokenize(input.query);

  const layerCounts: Partial<Record<CorpusLayer, number>> = {};
  const candidates: CorpusItem[] = [];

  // Run every layer in parallel; each helper returns [] on failure.
  const work: Promise<{ layer: CorpusLayer; items: CorpusItem[] }>[] = [];
  for (const layer of layers) {
    work.push(retrieveLayer(layer, input.uid, input.situationId, input.query, queryTerms));
  }
  const results = await Promise.all(work);
  for (const { layer, items } of results) {
    layerCounts[layer] = items.length;
    candidates.push(...items);
  }

  // Final ranking: layer-priority weight × per-item score, recency tiebreaker.
  const ranked = candidates
    .map(item => ({
      item,
      finalScore: layerWeight(item.sourceType) + (item.score ?? 0) * 10,
    }))
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      const ad = Date.parse(a.item.freshness || '') || 0;
      const bd = Date.parse(b.item.freshness || '') || 0;
      return bd - ad;
    })
    .slice(0, limit)
    .map(({ item }) => clampExcerpt(item));

  const trace: CorpusSearchTrace = {
    query: input.query,
    layersSearched: layers,
    ranking: 'keyword + recency now; vector search pilot next',
    contextPackageId: input.contextPackageId,
    contextHealthScore: input.contextHealthScore,
    freshnessChecked: input.checkFreshness === true,
    layerCounts,
    totalCandidates: candidates.length,
    durationMs: Date.now() - start,
  };

  return { items: ranked, trace };
}

// ---------------------------------------------------------------------------
// Layer helpers — each returns at most 6 items and never throws.
// ---------------------------------------------------------------------------

async function retrieveLayer(
  layer: CorpusLayer,
  uid: string,
  situationId: string,
  query: string,
  queryTerms: string[]
): Promise<{ layer: CorpusLayer; items: CorpusItem[] }> {
  try {
    switch (layer) {
      case 'argus':
        return { layer, items: await retrieveArgus(uid, situationId, queryTerms) };
      case 'sources':
        return { layer, items: await retrieveSources(uid, situationId, queryTerms) };
      case 'documents':
        return { layer, items: await retrieveDocuments(uid, situationId, query) };
      case 'graph':
        return { layer, items: await retrieveGraph(uid, situationId, queryTerms) };
      case 'tool-output':
        return { layer, items: await retrieveToolOutputs(uid, situationId, queryTerms) };
    }
  } catch (err) {
    console.warn(`[corpus-search] layer "${layer}" failed:`, err instanceof Error ? err.message : err);
  }
  return { layer, items: [] };
}

async function retrieveArgus(
  uid: string,
  situationId: string,
  queryTerms: string[]
): Promise<CorpusItem[]> {
  const argus = await getToolData(uid, situationId, 'argus').catch(() => null);
  if (!argus?.data) return [];
  const data = asRecord(argus.data);
  const items: CorpusItem[] = [];

  const alerts = Array.isArray(data.alerts) ? data.alerts : [];
  for (const raw of alerts.slice(0, 12)) {
    const alert = asRecord(raw);
    const title = pickString(alert.title) ?? 'ARGUS alert';
    const signal = pickString(alert.signal) ?? '';
    const evidence = pickString(alert.evidence) ?? '';
    const severity = pickString(alert.severity) ?? 'unknown';
    const source = pickString(alert.source) ?? '';
    const excerpt = [signal, evidence].filter(Boolean).join(' — ');
    const haystack = [title, signal, evidence, source].join(' ');
    const score = scoreText(haystack, queryTerms);
    items.push({
      sourceType: 'argus',
      sourceId: `argus#alert#${slug(title)}`,
      title: `[${severity}] ${title}`,
      excerpt: excerpt || title,
      citation: `users/${uid}/situations/${situationId}/tool-data/argus`,
      confidence: severityToConfidence(severity),
      freshness: argus.generatedAt,
      reason: queryTerms.length
        ? 'Matches ARGUS alert text'
        : 'Recent ARGUS alert',
      score,
    });
  }

  const watch = Array.isArray(data.watchItems) ? data.watchItems : [];
  for (const item of watch.slice(0, 8)) {
    if (typeof item !== 'string') continue;
    items.push({
      sourceType: 'argus',
      sourceId: `argus#watch#${slug(item)}`,
      title: 'ARGUS watch item',
      excerpt: item,
      citation: `users/${uid}/situations/${situationId}/tool-data/argus`,
      confidence: 'medium',
      freshness: argus.generatedAt,
      reason: queryTerms.length ? 'Matches watch item text' : 'Open watch item',
      score: scoreText(item, queryTerms),
    });
  }

  return topByScore(items, 6, queryTerms.length === 0);
}

async function retrieveSources(
  uid: string,
  situationId: string,
  queryTerms: string[]
): Promise<CorpusItem[]> {
  const lib = await getToolData(uid, situationId, 'sources-library').catch(() => null);
  if (!lib?.data) return [];
  const list = Array.isArray(lib.data) ? lib.data : [];
  const items: CorpusItem[] = [];
  for (const raw of list.slice(0, 24)) {
    const src = asRecord(raw);
    const name = pickString(src.name) ?? pickString(src.title) ?? 'Untitled source';
    const url = pickString(src.url) ?? pickString(src.domain) ?? '';
    const note = pickString(src.note) ?? pickString(src.description) ?? '';
    const reliability = typeof src.reliability === 'number' ? src.reliability : null;
    const haystack = [name, url, note].join(' ');
    items.push({
      sourceType: 'sources',
      sourceId: `sources#${slug(name)}`,
      title: name,
      excerpt: [url, note].filter(Boolean).join(' — '),
      citation: url || `users/${uid}/situations/${situationId}/tool-data/sources-library`,
      confidence: reliabilityToConfidence(reliability),
      freshness: lib.generatedAt,
      reason: queryTerms.length ? 'Matches saved source name/notes' : 'Saved source',
      score: scoreText(haystack, queryTerms),
    });
  }
  return topByScore(items, 6, queryTerms.length === 0);
}

async function retrieveDocuments(
  uid: string,
  situationId: string,
  query: string
): Promise<CorpusItem[]> {
  if (!query.trim()) return [];
  const chunks = await retrieveRelevantChunks(uid, situationId, query, { maxChunks: 6 }).catch(() => []);
  const chunkItems = chunks.map(chunk => ({
    sourceType: 'documents' as const,
    sourceId: `${chunk.documentId}#${chunk.id}`,
    title: chunk.documentTitle,
    excerpt: chunk.text,
    citation: `users/${uid}/situations/${situationId}/documents/${chunk.documentId}/chunks/${chunk.id}`,
    confidence: 'high' as const,
    freshness: '',
    reason: 'Top-K hybrid match (vector + keyword) over uploaded document chunks',
    score: 1,
  }));
  const queryTerms = tokenize(query);
  const digestItems = (await listKnowledgeDocuments(uid, { situationId }).catch(() => []))
    .filter((document) => document.digest)
    .map((document): CorpusItem => {
      const digest = document.digest!;
      const excerpt = [
        digest.shortSummary,
        digest.keyClaims.length ? `Claims: ${digest.keyClaims.slice(0, 3).join('; ')}` : '',
        digest.causalLinks.length ? `Causal links: ${digest.causalLinks.slice(0, 2).join('; ')}` : '',
        digest.humanFrictionSignals.length ? `Human friction: ${digest.humanFrictionSignals.slice(0, 2).join('; ')}` : '',
      ].filter(Boolean).join('\n');
      return {
        sourceType: 'documents' as const,
        sourceId: `${document.documentId}#knowledge-digest`,
        title: `${document.title} — knowledge digest`,
        excerpt,
        citation: `users/${uid}/knowledgeDocuments/${document.id}`,
        confidence: 'medium' as const,
        freshness: document.digest?.generatedAt ?? document.updatedAt,
        reason: 'Knowledge Library digest linked to this situation',
        score: scoreText([document.title, excerpt, document.tags.join(' ')].join(' '), queryTerms),
      };
    })
    .filter((item) => (item.score ?? 0) > 0)
    .slice(0, 4);
  return topByScore([...digestItems, ...chunkItems], 8, false);
}

async function retrieveGraph(
  uid: string,
  situationId: string,
  queryTerms: string[]
): Promise<CorpusItem[]> {
  const graph = await getConflictGraphAdmin(uid, situationId).catch(() => null);
  if (!graph?.nodes) return [];
  const items: CorpusItem[] = [];
  const sit = await getSituationById(uid, situationId).catch(() => null);
  const sitFreshness = pickString((sit as Record<string, unknown> | null)?.['updatedAt']) ?? '';

  for (const raw of graph.nodes.slice(0, 200)) {
    const n = asRecord(raw);
    const id = pickString(n.id) ?? '';
    const label = pickString(n.label) ?? id ?? 'Untitled node';
    const type = pickString(n.type) ?? 'Node';
    const desc = pickString(asRecord(n.metadata).description) ?? '';
    const subtype = pickString(asRecord(n.metadata).subtype) ?? '';
    const haystack = [label, type, desc, subtype].join(' ');
    const score = scoreText(haystack, queryTerms);
    if (queryTerms.length > 0 && score === 0) continue;
    items.push({
      sourceType: 'graph',
      sourceId: `graph#${id || slug(label)}`,
      title: `${type}: ${label}`,
      excerpt: desc || `${type}${subtype ? ` (${subtype})` : ''}`,
      citation: `users/${uid}/situations/${situationId}/graph/main#${id || slug(label)}`,
      confidence: 'medium',
      freshness: sitFreshness,
      reason: queryTerms.length
        ? 'Matches graph node label/description/subtype'
        : 'Graph node in active situation',
      score,
    });
  }
  return topByScore(items, 6, queryTerms.length === 0);
}

async function retrieveToolOutputs(
  uid: string,
  situationId: string,
  queryTerms: string[]
): Promise<CorpusItem[]> {
  if (!adminDb) return [];
  const situationRef = adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId);

  const [toolDataSnap, legacyToolsSnap] = await Promise.all([
    situationRef.collection('tool-data').limit(40).get().catch(() => null),
    situationRef.collection('tools').limit(80).get().catch(() => null),
  ]);
  if (!toolDataSnap && !legacyToolsSnap) return [];

  const items: CorpusItem[] = [];
  const seenCanonicalIds = new Set<string>();

  const collect = (
    docs: Array<{ id: string; data: () => Record<string, unknown> }>,
    sourceCollection: 'tool-data' | 'tools',
  ) => {
    for (const doc of docs) {
      const toolId = doc.id;
      if (toolId === 'argus' || toolId === 'sources-library') continue; // covered by dedicated layers
      const envelope = toolOutputToEvidenceEnvelope({
        uid,
        situationId,
        toolId,
        docData: doc.data(),
        sourceCollection,
        queryTerms,
      });
      if (!envelope) continue;
      if (queryTerms.length > 0 && envelope.score === 0) continue;
      if (seenCanonicalIds.has(envelope.canonicalToolId)) continue;
      seenCanonicalIds.add(envelope.canonicalToolId);
      items.push(evidenceEnvelopeToCorpusItem(envelope));
    }
  };

  // Prefer the versioned `tool-data` shape, then backfill from legacy/current
  // `tools` outputs so saveToolOutput-only routes still enter the corpus.
  if (toolDataSnap) {
    collect(toolDataSnap.docs, 'tool-data');
  }
  if (legacyToolsSnap) {
    collect(legacyToolsSnap.docs, 'tools');
  }

  return topByScore(items, 6, queryTerms.length === 0);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_CORPUS_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_CORPUS_LIMIT);
}

function clampExcerpt(item: CorpusItem): CorpusItem {
  if (!item.excerpt || item.excerpt.length <= MAX_EXCERPT_CHARS) return item;
  return { ...item, excerpt: `${item.excerpt.slice(0, MAX_EXCERPT_CHARS - 1)}…` };
}

function tokenize(query: string): string[] {
  return (query || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2);
}

function topByScore(items: CorpusItem[], n: number, allowZero: boolean): CorpusItem[] {
  const filtered = allowZero ? items : items.filter(i => (i.score ?? 0) > 0);
  return filtered
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, n);
}

function layerWeight(sourceType: string): number {
  switch (sourceType) {
    case 'documents': return 5;
    case 'argus': return 4;
    case 'tool-output': return 3;
    case 'graph': return 2;
    case 'sources': return 1;
    default: return 0;
  }
}

function severityToConfidence(severity: string): CorpusConfidence {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return 'unknown';
}

function reliabilityToConfidence(value: number | null): CorpusConfidence {
  if (typeof value !== 'number') return 'unknown';
  if (value >= 8) return 'high';
  if (value >= 5) return 'medium';
  return 'low';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function slug(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}

// Exposed for unit tests only.
export const __test__ = {
  tokenize,
  scoreText,
  layerWeight,
  reliabilityToConfidence,
  severityToConfidence,
  summarizeToolOutput,
  slug,
};
