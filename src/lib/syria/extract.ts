import { adminDb } from '@/lib/firebase/admin';
import type { GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export interface SyriaExtractionSummary {
  documentsProcessed: number;
  hypothesesCreated: number;
  nodeCount: number;
  edgeCount: number;
}

interface SourceDocument {
  id: string;
  title?: string;
  text?: string;
  uploadedAt?: string;
  entities?: {
    provenance?: {
      sourceId?: string;
      sourceUrl?: string;
      retrievedAt?: string;
      retrievalMethod?: 'grounded_search' | 'Grounded Search' | 'feed' | 'upload' | 'manual';
      live?: boolean;
    };
    sourceName?: string;
    tier?: string;
  };
}

export async function extractSyriaDocumentsToHypotheses(uid: string, situationId: string): Promise<SyriaExtractionSummary> {
  if (!adminDb) return { documentsProcessed: 0, hypothesesCreated: 0, nodeCount: 0, edgeCount: 0 };
  const docsSnap = await adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc')
    .limit(24)
    .get();

  let hypothesesCreated = 0;
  let nodeCount = 0;
  let edgeCount = 0;
  const batch = adminDb.batch();
  const hypotheses = adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('hypotheses');

  docsSnap.docs.forEach((snap) => {
    const doc = { id: snap.id, ...snap.data() } as SourceDocument;
    const node = documentClaimNode(doc);
    const sourceNode = documentSourceNode(doc);
    const edge = sourceSupportsClaimEdge(sourceNode, node, doc);
    [node, sourceNode].forEach((candidate) => {
      batch.set(hypotheses.doc(`hyp-${candidate.id}`), {
        kind: 'node',
        status: 'pending',
        confidence: candidate.metadata?.confidence_score ?? 0.62,
        node: candidate,
        sourceSpan: candidate.metadata?.source_span,
        createdAt: new Date().toISOString(),
        rationale: 'Syria document-derived hypothesis; analyst approval required before canonical graph mutation.',
      }, { merge: true });
      hypothesesCreated += 1;
      nodeCount += 1;
    });
    batch.set(hypotheses.doc(`hyp-${edge.id}`), {
      kind: 'edge',
      status: 'pending',
      confidence: edge.metadata?.confidence_score ?? 0.62,
      edge,
      sourceSpan: edge.metadata?.source_span,
      createdAt: new Date().toISOString(),
      rationale: 'Source-to-claim support edge staged from Syria document ingest.',
    }, { merge: true });
    hypothesesCreated += 1;
    edgeCount += 1;
  });

  if (hypothesesCreated > 0) await batch.commit();
  return { documentsProcessed: docsSnap.size, hypothesesCreated, nodeCount, edgeCount };
}

export async function promoteSyriaHypotheses(uid: string, situationId: string, limit = 60): Promise<{ promotedNodes: number; promotedEdges: number }> {
  if (!adminDb) return { promotedNodes: 0, promotedEdges: 0 };
  const sitRef = adminDb.collection('users').doc(uid).collection('situations').doc(situationId);
  const [graphSnap, hypothesesSnap] = await Promise.all([
    sitRef.collection('graph').doc('main').get(),
    sitRef.collection('hypotheses').where('status', '==', 'pending').limit(limit).get(),
  ]);
  const graph = graphSnap.exists ? graphSnap.data() as { nodes?: GraphNode[]; edges?: GraphEdge[] } : {};
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set(edges.map((edge) => edge.id));
  let promotedNodes = 0;
  let promotedEdges = 0;
  const batch = adminDb.batch();

  hypothesesSnap.docs.forEach((snap) => {
    const data = snap.data() as { kind?: string; node?: GraphNode; edge?: GraphEdge };
    if (data.kind === 'node' && data.node && !nodeIds.has(data.node.id)) {
      nodes.push(data.node);
      nodeIds.add(data.node.id);
      promotedNodes += 1;
    }
    if (data.kind === 'edge' && data.edge && !edgeIds.has(data.edge.id)) {
      edges.push(data.edge);
      edgeIds.add(data.edge.id);
      promotedEdges += 1;
    }
    batch.set(snap.ref, { status: 'approved', approvedAt: new Date().toISOString() }, { merge: true });
  });

  batch.set(sitRef.collection('graph').doc('main'), {
    nodes,
    edges,
    version: '2.0',
    schemaVersion: 'conflict-grammar-v1',
    lastUpdated: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
  }, { merge: true });
  await batch.commit();
  return { promotedNodes, promotedEdges };
}

function documentClaimNode(doc: SourceDocument): GraphNode {
  const title = doc.title || `Syria source ${doc.id}`;
  const excerpt = (doc.text || title).slice(0, 500);
  return {
    id: `claim-${slug(doc.id)}`,
    type: 'Claim',
    label: title,
    properties: { description: excerpt },
    createdAt: new Date().toISOString(),
    source: 'web-research',
    metadata: {
      description: excerpt,
      subtype: 'source_observation',
      confidence: 'EXTRACTED',
      confidence_score: doc.entities?.provenance?.live ? 0.72 : 0.58,
      confidence_level: 'EXTRACTED',
      source_name: doc.entities?.sourceName,
      source_url: doc.entities?.provenance?.sourceUrl,
      source_span: sourceSpan(doc, excerpt),
      extractor_version: 'syria-document-hypothesis-v1',
    },
  };
}

function documentSourceNode(doc: SourceDocument): GraphNode {
  const sourceName = doc.entities?.sourceName || doc.entities?.provenance?.sourceId || 'Syria source';
  return {
    id: `actor-source-${slug(doc.entities?.provenance?.sourceId || doc.id)}`,
    type: 'Actor',
    label: sourceName,
    properties: { description: `${sourceName} source record` },
    createdAt: new Date().toISOString(),
    source: 'web-research',
    metadata: {
      description: `${sourceName} source record`,
      subtype: 'institution',
      confidence: 'EXTRACTED',
      confidence_score: 0.8,
      confidence_level: 'EXTRACTED',
      source_url: doc.entities?.provenance?.sourceUrl,
      source_span: sourceSpan(doc, sourceName),
      extractor_version: 'syria-document-hypothesis-v1',
    },
  };
}

function sourceSupportsClaimEdge(source: GraphNode, claim: GraphNode, doc: SourceDocument): GraphEdge {
  return {
    id: `edge-${source.id}-${claim.id}`,
    source: source.id,
    target: claim.id,
    type: 'SUPPORTS_CLAIM',
    label: 'supports claim',
    weight: doc.entities?.provenance?.live ? 0.72 : 0.58,
    metadata: {
      confidence: 'EXTRACTED',
      confidence_score: doc.entities?.provenance?.live ? 0.72 : 0.58,
      confidence_level: 'EXTRACTED',
      source_span: sourceSpan(doc, (doc.text || doc.title || '').slice(0, 500)),
      extractor_version: 'syria-document-hypothesis-v1',
    },
  };
}

function sourceSpan(doc: SourceDocument, excerpt: string) {
  return {
    documentId: doc.id,
    charStart: 0,
    charEnd: excerpt.length,
    excerpt,
    retrievedAt: doc.entities?.provenance?.retrievedAt || doc.uploadedAt || new Date().toISOString(),
    retrievalMethod: doc.entities?.provenance?.retrievalMethod || 'feed',
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
