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
}

export interface CanonicalSourceReceipt {
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
  excerpt?: string;
  contentHash?: string;
  span?: SourceReceiptSpan;
  graphPath?: string[];
  advisorId?: string;
  toolRunId?: string;
}
