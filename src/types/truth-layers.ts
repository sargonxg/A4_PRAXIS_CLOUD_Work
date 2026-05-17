export type TruthLayer = 'source' | 'claim' | 'evidence' | 'verdict';

export interface ProvenanceRef {
  sourceId: string;
  span?: { start: number; end: number };
  retrievedAt: string;
  retriever?:
    | 'analyst'
    | 'google-grounded'
    | 'private-corpus';
}

export interface TruthLayerNode {
  id: string;
  caseId: string;
  ownerUid: string;
  layer: TruthLayer;
  confidence: number;
  provenance: ProvenanceRef[];
  validFrom: string;
  validTo: string | null;
  assertedFrom: string;
  assertedTo: string | null;
}

export function inferTruthLayerForKind(kind: string | null | undefined): TruthLayer {
  switch (kind) {
    case 'source':
      return 'source';
    case 'interest':
    case 'constraint':
    case 'leverage':
      return 'evidence';
    case 'commitment':
    case 'verdict':
      return 'verdict';
    case 'actor':
    case 'event':
    case 'claim':
    case 'narrative':
    default:
      return 'claim';
  }
}

export function isValidTruthLayerNode(node: TruthLayerNode): boolean {
  if (node.confidence < 0 || node.confidence > 1) return false;
  if (node.validTo && Date.parse(node.validFrom) > Date.parse(node.validTo)) return false;
  if (node.assertedTo && Date.parse(node.assertedFrom) > Date.parse(node.assertedTo)) return false;
  return true;
}
