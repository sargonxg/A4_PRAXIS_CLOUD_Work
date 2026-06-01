/**
 * ACO Entity Extraction Service
 *
 * Extracts structured ACO v2.0 entities and relationships from any text source.
 * Uses AI (Gemini Pro) to parse unstructured text into graph-ready nodes and edges
 * with provenance tracking, confidence levels, and temporal metadata.
 *
 * Used by: auto-structure pipeline, web research route, document upload handler,
 *          manual "Extract from URL" actions in the UI.
 *
 * Flow:
 *   Raw text/URL → AI extraction → ACO nodes + edges → Firestore graph → UI update
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import {
  ACO_ENTITY_TYPES,
  CONFIDENCE_LEVELS,
  PRIMITIVE_SUBTYPES,
  RELATIONSHIP_VOCABULARY,
  SourceSpanSchema,
  type ACOEntityType,
  type ConfidenceLevel,
  type SourceSpan,
} from '@/lib/ai/schemas/conflict-grammar';
import type {
  ContextCapsuleClaim,
  ContextCapsuleSourceRef,
  EvidenceReceipt,
} from '@/lib/context/capsule-v2';
import type { ContextCapsule } from '@/types/context-capsule';

export interface TrustworthinessScore {
  score: number;
  level: 'high' | 'medium' | 'low' | 'unknown';
  reasons: string[];
}

function computeTrustworthiness(input: { sources: string[]; recencyDays: number }): TrustworthinessScore {
  const reliableSource = input.sources.some((source) => /Google|Reuters|AP|BBC|Wikipedia|document|source|receipt/i.test(source));
  const recencyScore = input.recencyDays <= 7 ? 0.95 : input.recencyDays <= 30 ? 0.75 : 0.55;
  const sourceScore = reliableSource ? 0.9 : 0.65;
  const score = Math.round(((recencyScore + sourceScore) / 2) * 100) / 100;
  return {
    score,
    level: score >= 0.8 ? 'high' : score >= 0.6 ? 'medium' : 'low',
    reasons: [
      reliableSource ? 'recognized source family' : 'source family needs review',
      `recency ${input.recencyDays} day(s)`,
    ],
  };
}

// ─── Zod schemas for AI structured output ──────────────────────────────────

const ExtractedNodeSchema = z.object({
  id: z.string().describe('Unique kebab-case identifier, e.g., "actor-russian-federation"'),
  label: z.string().describe('Human-readable name'),
  primitive_type: z.enum(ACO_ENTITY_TYPES),
  confidence: z.enum(CONFIDENCE_LEVELS),
  confidence_score: z.number().min(0).max(1).optional(),
  source_span: SourceSpanSchema.optional(),
  description: z.string().describe('Brief description of this entity in context'),
  // Type-specific fields (optional, depends on primitive_type)
  subtype: z.string().optional().describe('Type-specific subtype (e.g., actor_type, claim_type, event_type)'),
  date: z.string().optional().describe('ISO date if applicable (events, commitments)'),
  location: z.string().optional().describe('Geographic location if applicable'),
  status: z.string().optional().describe('Current status (active, expired, violated, etc.)'),
  // Temporal
  valid_from: z.string().optional().describe('When this entity became relevant (ISO date)'),
  valid_until: z.string().optional().describe('When this entity ceased to be relevant (ISO date, empty if ongoing)'),
});

const ExtractedEdgeSchema = z.object({
  source: z.string().describe('Source node ID'),
  target: z.string().describe('Target node ID'),
  relation: z.string().describe('Relationship type from ACO vocabulary (e.g., "claims", "opposes", "triggered_by")'),
  confidence: z.enum(CONFIDENCE_LEVELS),
  confidence_score: z.number().min(0).max(1).optional(),
  source_span: SourceSpanSchema.optional(),
  description: z.string().optional().describe('Brief description of this relationship'),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

const ExtractionResultSchema = z.object({
  nodes: z.array(ExtractedNodeSchema),
  edges: z.array(ExtractedEdgeSchema),
  timeline: z.array(z.object({
    date: z.string().describe('ISO date'),
    event: z.string().describe('Brief description of what happened'),
    significance: z.enum(['critical', 'high', 'medium', 'low']),
    node_ids: z.array(z.string()).describe('IDs of nodes involved in this event'),
  })).describe('Chronological timeline of key events extracted from the text'),
  summary: z.string().describe('One-paragraph summary of the conflict dynamics found in the text'),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedNode {
  id: string;
  label: string;
  primitive_type: ACOEntityType;
  confidence: ConfidenceLevel;
  confidence_score?: number;
  source_span?: SourceSpan;
  description: string;
  subtype?: string;
  date?: string;
  location?: string;
  status?: string;
  valid_from?: string;
  valid_until?: string;
  source_url?: string;
  source_name?: string;
  trustScore?: TrustworthinessScore;
}

export interface ExtractedEdge {
  source: string;
  target: string;
  relation: string;
  confidence: ConfidenceLevel;
  confidence_score?: number;
  source_span?: SourceSpan;
  description?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface TimelineEntry {
  date: string;
  event: string;
  significance: 'critical' | 'high' | 'medium' | 'low';
  node_ids: string[];
}

export interface ExtractionResult {
  nodes: ExtractedNode[];
  edges: ExtractedEdge[];
  timeline: TimelineEntry[];
  summary: string;
  sourceUrl?: string;
  sourceName?: string;
  extractedAt: string;
  tokenUsage?: { input: number; output: number };
}

export interface CapsuleArchitectDocumentInput {
  documentId?: string | null;
  sourceId?: string | null;
  title?: string | null;
  mimeType?: string | null;
  originalUri?: string | null;
  url?: string | null;
  publisher?: string | null;
  date?: string | null;
  text?: string | null;
  page?: number | null;
  reliabilityTier?: 1 | 2 | 3 | number | null;
  extraction?: ExtractionResult | null;
}

export interface CapsuleDocumentFirstSignalOptions {
  jobPrompt?: string | null;
  domainId?: string | null;
  normalizedAt?: string | null;
}

export interface CapsuleDocumentFirstSignals {
  sourceRefs: ContextCapsuleSourceRef[];
  claimLedger: ContextCapsuleClaim[];
  embeddedGraph: ContextCapsule['embeddedGraph'] & {
    nodes: NonNullable<ContextCapsule['embeddedGraph']['nodes']>;
    edges: NonNullable<ContextCapsule['embeddedGraph']['edges']>;
  };
  temporality: ContextCapsule['temporality'];
  causality: ContextCapsule['causality'];
  reviewGate: 'human_review';
}

// ─── Relationship vocabulary for the AI prompt ──────────────────────────────

const RELATIONSHIP_VOCABULARY_TEXT = Object.entries(RELATIONSHIP_VOCABULARY)
  .map(([, rel]) => `${rel.sourceTypes.join('|')}→${rel.targetTypes.join('|')}: ${rel.canonical}`)
  .join('\n');

const ENTITY_SUBTYPE_GUIDELINES = Object.entries(PRIMITIVE_SUBTYPES)
  .map(([primitive, subtypes]) => `- ${primitive} subtypes: ${subtypes.join(', ')}`)
  .join('\n');

// ─── Main extraction function ───────────────────────────────────────────────

/**
 * Extract ACO entities and relationships from unstructured text.
 *
 * @param text - Raw text to analyze (article, report, scraped web page)
 * @param options - Extraction options
 * @returns Structured ACO entities, relationships, and timeline
 */
export async function extractEntities(
  text: string,
  options: {
    sourceUrl?: string;
    sourceName?: string;
    situationContext?: string;
    existingNodeIds?: string[];
    maxNodes?: number;
  } = {},
): Promise<ExtractionResult> {
  const {
    sourceUrl,
    sourceName = 'unknown',
    situationContext = '',
    existingNodeIds = [],
    maxNodes = 50,
  } = options;

  const existingContext = existingNodeIds.length > 0
    ? `\n\nEXISTING GRAPH NODES (link to these when referencing the same entity, do NOT create duplicates):\n${existingNodeIds.join(', ')}`
    : '';

  const result = await generateText({
    model: getProModel(),
    output: Output.object({ schema: ExtractionResultSchema }),
    prompt: `You are an expert conflict analyst using the ACO (Agentic Conflict Ontology) v2.0 framework. Extract structured entities and relationships from the following text.

${situationContext ? `SITUATION CONTEXT:\n${situationContext}\n` : ''}
SOURCE: ${sourceName}${sourceUrl ? ` (${sourceUrl})` : ''}
DATE: ${new Date().toISOString().split('T')[0]}

TEXT TO ANALYZE:
${text.slice(0, 15000)}

INSTRUCTIONS:
1. Extract up to ${maxNodes} entities of these types: ${ACO_ENTITY_TYPES.join(', ')}
2. For each entity, assign a confidence level:
   - EXTRACTED: Directly and explicitly stated in the text
   - INFERRED: Reasonable deduction from what is stated
   - AMBIGUOUS: Multiple interpretations possible
   - ASSESSED: Your analytical judgment based on context
3. Create relationships between entities using the VALID relationship types below
4. Build a chronological timeline of key events
5. Use kebab-case IDs prefixed with the type (e.g., "actor-hamas", "event-oct-7-attack", "grievance-occupation")
6. Include temporal metadata (valid_from, valid_until) when dates are available
7. Be specific and grounded — every entity should trace back to the source text
${existingContext}

${RELATIONSHIP_VOCABULARY_TEXT}

ENTITY SUBTYPE GUIDELINES:
${ENTITY_SUBTYPE_GUIDELINES}

MAPPING RULES FOR FORMER EXTENDED TYPES:
- Institution -> Actor subtype "institution" or Constraint subtype "institutional"
- Norm -> Constraint subtype "norm"
- Resource -> Interest or Leverage metadata/subtype
- Risk -> status/metadata on relevant Event, Constraint, or Commitment; do not create Risk nodes
- Policy -> Commitment subtype "policy_commitment"
- Grievance -> Claim subtype "grievance"

Focus on quality over quantity. Every node and edge should be defensible from the source text.`,
  });

  const extractedAt = new Date().toISOString();
  const fallbackSpan = makeFallbackSourceSpan(text, sourceUrl ?? sourceName, extractedAt);
  const output = result.output;
  if (!output) {
    return {
      nodes: [], edges: [], timeline: [], summary: 'Extraction produced no output.',
      sourceUrl, sourceName, extractedAt,
    };
  }

  // Compute trust scores for extracted nodes
  const daysSinceSource = 0; // Assumed current for live extraction
  const nodes: ExtractedNode[] = output.nodes.map((n) => ({
    ...n,
    confidence_score: n.confidence_score ?? confidenceLevelToScore(n.confidence),
    source_span: n.source_span ?? fallbackSpan,
    source_url: sourceUrl,
    source_name: sourceName,
    trustScore: computeTrustworthiness({
      sources: [sourceName],
      recencyDays: daysSinceSource,
    }),
  }));

  return {
    nodes,
    edges: output.edges.map((edge) => ({
      ...edge,
      confidence_score: edge.confidence_score ?? confidenceLevelToScore(edge.confidence),
      source_span: edge.source_span ?? fallbackSpan,
    })),
    timeline: output.timeline,
    summary: output.summary,
    sourceUrl,
    sourceName,
    extractedAt,
    tokenUsage: result.usage ? { input: result.usage.inputTokens ?? 0, output: result.usage.outputTokens ?? 0 } : undefined,
  };
}

/**
 * Normalize a label for deduplication matching.
 * Handles common conflicts: "Sudan Armed Forces" = "SAF", "the RSF" = "RSF"
 */
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/^the\s+/i, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two labels likely refer to the same entity.
 * Uses exact match after normalization, plus acronym detection.
 */
function labelsMatch(a: string, b: string): boolean {
  const normA = normalizeLabel(a);
  const normB = normalizeLabel(b);

  // Exact match
  if (normA === normB) return true;

  // One is a substring of the other (e.g., "Hamas" matches "Hamas Movement")
  if (normA.length > 3 && normB.length > 3) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  // Acronym matching: "United Nations" → "UN", "Sudan Armed Forces" → "SAF"
  const acronymA = normA.split(/\s+/).map((w) => w[0]).join('');
  const acronymB = normB.split(/\s+/).map((w) => w[0]).join('');
  if (acronymA.length >= 2 && acronymA === normB) return true;
  if (acronymB.length >= 2 && acronymB === normA) return true;

  return false;
}

/**
 * Merge extraction results into an existing graph, deduplicating nodes by label similarity.
 * Uses fuzzy matching to catch "Sudan Armed Forces" / "SAF" type duplicates.
 */
export function mergeExtractions(
  existing: { nodes: ExtractedNode[]; edges: ExtractedEdge[] },
  incoming: ExtractionResult,
): { nodes: ExtractedNode[]; edges: ExtractedEdge[]; newNodeCount: number; newEdgeCount: number } {
  const existingLabels = new Map(existing.nodes.map((n) => [normalizeLabel(n.label), n.id]));
  const nodeIdMap = new Map<string, string>(); // Maps incoming IDs to existing IDs for dedup

  const newNodes: ExtractedNode[] = [];

  for (const node of incoming.nodes) {
    // Check exact normalized match first
    const normLabel = normalizeLabel(node.label);
    let existingId = existingLabels.get(normLabel);

    // Fuzzy match against all existing nodes
    if (!existingId) {
      for (const existingNode of existing.nodes) {
        if (labelsMatch(node.label, existingNode.label) && node.primitive_type === existingNode.primitive_type) {
          existingId = existingNode.id;
          break;
        }
      }
    }

    if (existingId) {
      nodeIdMap.set(node.id, existingId);
    } else {
      newNodes.push(node);
      existingLabels.set(normLabel, node.id);
    }
  }

  // Remap edge references and filter duplicates
  const existingEdgeKeys = new Set(
    existing.edges.map((e) => `${e.source}|${e.relation}|${e.target}`),
  );

  const newEdges: ExtractedEdge[] = [];
  for (const edge of incoming.edges) {
    const source = nodeIdMap.get(edge.source) ?? edge.source;
    const target = nodeIdMap.get(edge.target) ?? edge.target;
    const key = `${source}|${edge.relation}|${target}`;
    if (!existingEdgeKeys.has(key)) {
      newEdges.push({ ...edge, source, target });
      existingEdgeKeys.add(key);
    }
  }

  return {
    nodes: [...existing.nodes, ...newNodes],
    edges: [...existing.edges, ...newEdges],
    newNodeCount: newNodes.length,
    newEdgeCount: newEdges.length,
  };
}

export function buildDocumentFirstCapsuleArchitectSignals(
  documents: CapsuleArchitectDocumentInput[],
  options: CapsuleDocumentFirstSignalOptions = {},
): CapsuleDocumentFirstSignals {
  const normalizedAt = cleanTextForCapsule(options.normalizedAt, 80) || new Date().toISOString();
  const domainId = cleanIdForCapsule(options.domainId ?? 'generic', 'generic');
  const cleanedDocuments = documents
    .map((document, index) => normalizeArchitectDocument(document, index, normalizedAt))
    .slice(0, 20);
  const sourceRefs = cleanedDocuments.map((document) => document.sourceRef);
  const claimLedger = buildDocumentFirstClaims(cleanedDocuments, options.jobPrompt, normalizedAt);
  const timelineAnchors = buildDocumentTimelineAnchors(cleanedDocuments, claimLedger, normalizedAt);
  const causalLinks = buildDocumentCausalLinks(cleanedDocuments, claimLedger, normalizedAt);
  const embeddedGraph = buildDocumentFirstEmbeddedGraph({
    domainId,
    sourceRefs,
    claimLedger,
    timelineAnchors,
    causalLinks,
  });

  return {
    sourceRefs,
    claimLedger,
    embeddedGraph,
    temporality: {
      timelineAnchors,
      asOf: normalizedAt.slice(0, 10),
      validFrom: timelineAnchors[0]?.date ?? normalizedAt.slice(0, 10),
      validUntil: undefined,
    },
    causality: { causalLinks },
    reviewGate: 'human_review',
  };
}

/**
 * Convert extraction results to the Firestore graph format used by PRAXIS.
 */
export function toFirestoreGraph(result: ExtractionResult): {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    metadata: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
    metadata: Record<string, unknown>;
  }>;
} {
  return {
    nodes: result.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.primitive_type,
      metadata: {
        description: n.description,
        subtype: n.subtype,
        confidence: n.confidence,
        confidence_score: n.confidence_score,
        confidence_level: n.confidence,
        source_span: n.source_span,
        extractor_version: 'conflict-grammar-v1',
        date: n.date,
        location: n.location,
        status: n.status,
        valid_from: n.valid_from,
        valid_until: n.valid_until,
        source_url: n.source_url,
        source_name: n.source_name,
        trustScore: n.trustScore ? {
          level: n.trustScore.level,
          score: n.trustScore.score,
        } : undefined,
      },
    })),
    edges: result.edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.relation,
      weight: e.confidence === 'EXTRACTED' ? 1.0
        : e.confidence === 'INFERRED' ? 0.75
        : e.confidence === 'AMBIGUOUS' ? 0.5
        : 0.6,
      metadata: {
        confidence: e.confidence,
        confidence_score: e.confidence_score,
        confidence_level: e.confidence,
        source_span: e.source_span,
        extractor_version: 'conflict-grammar-v1',
        description: e.description,
        valid_from: e.valid_from,
        valid_until: e.valid_until,
      },
    })),
  };
}

function confidenceLevelToScore(level: ConfidenceLevel): number {
  if (level === 'EXTRACTED') return 0.9;
  if (level === 'INFERRED') return 0.7;
  if (level === 'ASSESSED') return 0.6;
  if (level === 'AMBIGUOUS') return 0.4;
  return 0.5;
}

interface NormalizedArchitectDocument {
  documentId: string;
  title: string;
  text: string;
  page: number | null;
  sourceRef: ContextCapsuleSourceRef;
  extraction?: ExtractionResult | null;
}

function normalizeArchitectDocument(
  document: CapsuleArchitectDocumentInput,
  index: number,
  normalizedAt: string,
): NormalizedArchitectDocument {
  const title = cleanTextForCapsule(document.title, 180) || `Uploaded document ${index + 1}`;
  const documentId = cleanIdForCapsule(document.documentId ?? title, `document-${index + 1}`);
  const sourceId = cleanIdForCapsule(document.sourceId ?? documentId, `source-${index + 1}`);
  const text = cleanTextForCapsule(document.text, 12000);
  const reliabilityTier = normalizeReliabilityTier(document.reliabilityTier);
  return {
    documentId,
    title,
    text,
    page: normalizePositiveInt(document.page),
    extraction: document.extraction ?? null,
    sourceRef: {
      sourceId,
      label: title,
      url: cleanTextForCapsule(document.url ?? document.originalUri, 1000) || null,
      publisher: cleanTextForCapsule(document.publisher, 240) || 'Uploaded document',
      date: cleanTextForCapsule(document.date, 80) || normalizedAt.slice(0, 10),
      reliabilityTier,
      stale: false,
    },
  };
}

function buildDocumentFirstClaims(
  documents: NormalizedArchitectDocument[],
  jobPrompt: string | null | undefined,
  normalizedAt: string,
): ContextCapsuleClaim[] {
  const candidateRows = documents.flatMap((document) => {
    const extractionRows = [
      document.extraction?.summary,
      ...(document.extraction?.timeline ?? []).map((entry) => entry.event),
      ...(document.extraction?.nodes ?? []).map((node) => node.description || node.label),
    ].filter((value): value is string => Boolean(value?.trim()));
    const sentenceRows = splitArchitectSentences(document.text);
    const fallbackRows = [
      `${document.title} is relevant evidence for ${cleanTextForCapsule(jobPrompt, 220) || 'the capsule job'}.`,
    ];
    return [...extractionRows, ...sentenceRows, ...fallbackRows]
      .map((text) => ({ document, text }))
      .slice(0, 5);
  });

  const promptText = cleanTextForCapsule(jobPrompt, 300);
  const paddedRows = [...candidateRows];
  while (paddedRows.length < 3) {
    const document = documents[paddedRows.length % Math.max(documents.length, 1)];
    if (!document) break;
    paddedRows.push({
      document,
      text: promptText
        ? `The capsule should test this job against the uploaded evidence: ${promptText}.`
        : `The capsule needs a human-reviewed claim from ${document.title}.`,
    });
  }

  return uniqueByText(paddedRows)
    .slice(0, 12)
    .map(({ document, text }, index): ContextCapsuleClaim => {
      const snippet = cleanTextForCapsule(text, 500) || document.title;
      const receipt: EvidenceReceipt = {
        sourceId: document.sourceRef.sourceId,
        url: document.sourceRef.url,
        publisher: document.sourceRef.publisher,
        date: document.sourceRef.date,
        reliabilityTier: document.sourceRef.reliabilityTier,
        snippet,
        charOffset: { start: 0, end: snippet.length },
        page: document.page,
        confidence: 0.72,
        stance: 'supports',
      };
      return {
        claimId: `architect-claim-${index + 1}`,
        text: snippet,
        support: 'supported',
        sourceRefIds: [document.sourceRef.sourceId],
        caveat: 'Draft Capsule Architect claim; human review required before canonical use.',
        receipts: [receipt],
        validFrom: extractIsoDate(snippet) ?? normalizedAt.slice(0, 10),
        validUntil: null,
        asOf: normalizedAt.slice(0, 10),
        causalLinks: index === 0 && paddedRows.length > 1 ? { causes: ['architect-claim-2'] } : {},
      };
    });
}

function buildDocumentTimelineAnchors(
  documents: NormalizedArchitectDocument[],
  claims: ContextCapsuleClaim[],
  normalizedAt: string,
): ContextCapsule['temporality']['timelineAnchors'] {
  const timelineRows = documents.flatMap((document) =>
    (document.extraction?.timeline ?? []).map((entry) => ({
      label: entry.event,
      date: entry.date,
      sourceRefs: [document.sourceRef.sourceId],
      confidence: 0.7,
    })),
  );
  const claimRows = claims.flatMap((claim) => {
    const date = extractIsoDate(`${claim.text} ${claim.validFrom ?? ''}`);
    if (!date) return [];
    return [{
      label: claim.text.slice(0, 180),
      date,
      sourceRefs: claim.sourceRefIds,
      confidence: 0.65,
    }];
  });
  const rows = [...timelineRows, ...claimRows];
  const fallback = {
    label: 'Capsule Architect review window',
    date: normalizedAt.slice(0, 10),
    sourceRefs: documents.map((document) => document.sourceRef.sourceId),
    confidence: 0.55,
  };
  return (rows.length ? rows : [fallback]).slice(0, 12).map((row, index) => ({
    id: `architect-anchor-${index + 1}`,
    label: row.label || fallback.label,
    date: row.date || fallback.date,
    kind: index === 0 ? 'as-of' : 'event',
    sourceRefs: row.sourceRefs,
    confidence: row.confidence,
  }));
}

function buildDocumentCausalLinks(
  documents: NormalizedArchitectDocument[],
  claims: ContextCapsuleClaim[],
  normalizedAt: string,
): ContextCapsule['causality']['causalLinks'] {
  const sourceIds = documents.map((document) => document.sourceRef.sourceId);
  const cause = claims[0]?.text ?? 'Uploaded evidence changes the policy posture';
  const effect = claims[1]?.text ?? 'The capsule needs human review before reuse';
  return [{
    id: 'architect-causal-driver-1',
    cause,
    effect,
    relation: 'causes',
    evidenceRefs: sourceIds,
    confidence: 0.6,
    caveat: `Proposed by Capsule Architect on ${normalizedAt}; confirm causality before canonical promotion.`,
  }];
}

function buildDocumentFirstEmbeddedGraph(input: {
  domainId: string;
  sourceRefs: ContextCapsuleSourceRef[];
  claimLedger: ContextCapsuleClaim[];
  timelineAnchors: ContextCapsule['temporality']['timelineAnchors'];
  causalLinks: ContextCapsule['causality']['causalLinks'];
}): CapsuleDocumentFirstSignals['embeddedGraph'] {
  const safeDomainId = cleanIdForCapsule(input.domainId, 'generic');
  const sourceNodes = input.sourceRefs.map((source) => ({
    id: `source:${source.sourceId}`,
    label: source.label,
    entityType: 'Source',
    reviewState: 'advisory' as const,
    confidence: source.reliabilityTier === 1 ? 0.85 : source.reliabilityTier === 2 ? 0.72 : 0.55,
    sourceReceiptIds: [source.sourceId],
  }));
  const claimNodes = input.claimLedger.slice(0, 8).map((claim) => ({
    id: `claim:${claim.claimId}`,
    label: claim.text.slice(0, 220),
    entityType: 'Claim',
    reviewState: 'advisory' as const,
    confidence: claim.receipts?.[0]?.confidence ?? 0.6,
    sourceReceiptIds: claim.sourceRefIds,
  }));
  const timelineNodes = input.timelineAnchors.slice(0, 4).map((anchor) => ({
    id: `timeline:${anchor.id}`,
    label: anchor.label,
    entityType: 'Event',
    reviewState: 'advisory' as const,
    confidence: anchor.confidence ?? 0.55,
    sourceReceiptIds: anchor.sourceRefs,
  }));
  const causalNodes = input.causalLinks.slice(0, 3).map((link) => ({
    id: `causal:${link.id}`,
    label: `${link.cause.slice(0, 90)} -> ${link.effect.slice(0, 90)}`,
    entityType: 'Claim',
    reviewState: 'advisory' as const,
    confidence: link.confidence ?? 0.55,
    sourceReceiptIds: link.evidenceRefs,
  }));
  const nodes = [
    {
      id: `domain:${safeDomainId}`,
      label: humanizeCapsuleText(safeDomainId),
      entityType: 'Ontology',
      reviewState: 'advisory' as const,
      confidence: 0.6,
      sourceReceiptIds: input.sourceRefs.map((source) => source.sourceId),
    },
    ...sourceNodes,
    ...claimNodes,
    ...timelineNodes,
    ...causalNodes,
  ];
  const sourceToClaimEdges = input.claimLedger.slice(0, 8).flatMap((claim) =>
    claim.sourceRefIds.map((sourceId) => ({
      id: `edge:${sourceId}:${claim.claimId}`,
      source: `source:${sourceId}`,
      target: `claim:${claim.claimId}`,
      label: 'supports claim',
      relationshipType: 'SUPPORTED_BY',
      reviewState: 'advisory' as const,
      confidence: claim.receipts?.[0]?.confidence ?? 0.6,
      sourceReceiptIds: claim.sourceRefIds,
    })),
  );
  const domainEdges = input.sourceRefs.map((source) => ({
    id: `edge:domain:${source.sourceId}`,
    source: `domain:${safeDomainId}`,
    target: `source:${source.sourceId}`,
    label: 'uses source',
    relationshipType: 'USES_SOURCE',
    reviewState: 'advisory' as const,
    confidence: 0.6,
    sourceReceiptIds: [source.sourceId],
  }));
  const edges = [...domainEdges, ...sourceToClaimEdges];
  return {
    provider: 'graphlite',
    projectionId: `architect-${safeDomainId}-graphlite-projection`,
    status: 'compiled-advisory',
    namedGraph: `capsule_architect_${safeDomainId.replaceAll('-', '_')}`,
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: 'Human review-card approval required before canonical graph promotion.',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
  };
}

function splitArchitectSentences(value: string): string[] {
  return value
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 24)
    .slice(0, 12);
}

function uniqueByText(rows: Array<{ document: NormalizedArchitectDocument; text: string }>) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeReliabilityTier(value: unknown): 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3 ? value : 2;
}

function normalizePositiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function extractIsoDate(value: string): string | null {
  const match = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return match?.[0] ?? null;
}

function cleanIdForCapsule(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value : fallback;
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return cleaned || fallback;
}

function cleanTextForCapsule(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function humanizeCapsuleText(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeFallbackSourceSpan(text: string, documentId: string | undefined, retrievedAt: string): SourceSpan {
  const excerpt = text.slice(0, 500);
  return {
    documentId: documentId || 'unknown-source',
    charStart: 0,
    charEnd: excerpt.length,
    excerpt,
    retrievedAt,
    retrievalMethod: 'grounded_search',
  };
}
