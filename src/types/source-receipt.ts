export type SourceReceiptKind = 'web-result' | 'scraped-excerpt' | 'structured-data' | 'document' | 'tool-output';
export type SourceReceiptConfidence = 'high' | 'medium' | 'low';
export type SourceReceiptRetrievalMethod =
  | 'web_search'
  | 'scrape'
  | 'structured_data'
  | 'document'
  | 'tool'
  | 'vector'
  | 'bm25'
  | 'graph_path'
  | 'user_upload';

export interface SourceReceiptSpan {
  start?: number;
  end?: number;
  quote?: string;
  pageNumber?: number;
  coords?: import('@/types/spatial-source').SpatialBoundingBox;
  citationRef?: import('@/types/spatial-source').SpatialCitationRef;
}

export interface CanonicalSourceReceipt extends Partial<import('@/lib/ai/source-passage').OriginalSourceCapture> {
  receiptId: string;
  sourceId: string;
  name: string;
  title: string;
  url?: string;
  provider: string;
  source: string;
  kind: SourceReceiptKind;
  retrievalMethod: SourceReceiptRetrievalMethod;
  timestamp: string;
  publishedDate?: string;
  query?: string;
  reliabilityScore: number;
  confidence: SourceReceiptConfidence;
  tier?: import('@/lib/sources/tiers').SourceTier;
  excerpt?: string;
  contentHash?: string;
  span?: SourceReceiptSpan;
  spatialCitationRefs?: import('@/types/spatial-source').SpatialCitationRef[];
  graphPath?: string[];
  advisorId?: string;
  toolRunId?: string;
  generatedGroundingSegments?: import('@/lib/ai/web-research').GeneratedGroundingSegment[];
}
