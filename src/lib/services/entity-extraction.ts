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
  type ACOEntityType,
  type ConfidenceLevel,
} from '@/lib/ai/schemas/conflict-grammar';
import { computeTrustworthiness, type TrustworthinessScore } from '@/lib/analytics/trustworthiness-engine';

// ─── Zod schemas for AI structured output ──────────────────────────────────

const ExtractedNodeSchema = z.object({
  id: z.string().describe('Unique kebab-case identifier, e.g., "actor-russian-federation"'),
  label: z.string().describe('Human-readable name'),
  primitive_type: z.enum(ACO_ENTITY_TYPES),
  confidence: z.enum(CONFIDENCE_LEVELS),
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
    source_url: sourceUrl,
    source_name: sourceName,
    trustScore: computeTrustworthiness({
      sources: [sourceName],
      recencyDays: daysSinceSource,
    }),
  }));

  return {
    nodes,
    edges: output.edges,
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
        description: e.description,
        valid_from: e.valid_from,
        valid_until: e.valid_until,
      },
    })),
  };
}
