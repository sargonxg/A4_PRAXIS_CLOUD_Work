import type { ConflictEntity, ConflictEntityType } from './conflict-grammar';
import type { Report, ReportSection } from './report';
import type { Source } from './index';

// ============================================================================
// Base API Types
// ============================================================================

export interface ApiRequest {
  timestamp: string;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

// ============================================================================
// Chat API Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
}

export interface ChatRequest extends ApiRequest {
  messages: ChatMessage[];
  conflictId?: string;
  conversationId?: string;
  enabledTools?: string[];
  systemPromptOverride?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  sources?: Source[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Report Generation API Types
// ============================================================================

export interface ReportGenerationRequest extends ApiRequest {
  reportId: string;
  sectionId: string;
  templateType: string;
  context?: string;
  instructions?: string;
  wordLimit?: number;
  tone?: 'formal' | 'analytical' | 'balanced' | 'urgent' | 'cautious';
  conflictId?: string;
}

export interface ReportGenerationResponse {
  reportId: string;
  section: ReportSection;
  report?: Report;
  generationTime: number;
}

// ============================================================================
// Conflict Graph API Types
// ============================================================================

export interface ConflictGraphQueryRequest extends ApiRequest {
  conflictId: string;
  entityType?: ConflictEntityType | 'all';
  actorId?: string;
  query?: string;
  timeRange?: {
    start?: string;
    end?: string;
  };
  limit?: number;
  offset?: number;
}

export interface ConflictGraphQueryResponse {
  conflictId: string;
  entities: ConflictEntity[];
  totalCount: number;
  query?: string;
}

// ============================================================================
// Media Analysis API Types
// ============================================================================

export interface MediaAnalysisRequest extends ApiRequest {
  sourceName?: string;
  sourceUrl?: string;
  topic?: string;
  sourceNames?: string[];
  analysisType: 'source_profile' | 'coverage_comparison' | 'bias_detection' | 'narrative_analysis';
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export interface MediaAnalysisResponse {
  analysisType: string;
  results: Record<string, unknown>;
  sources: Source[];
  confidence: number;
  processingTime: number;
}

// ============================================================================
// Terminology Check API Types
// ============================================================================

export interface TerminologyCheckRequest extends ApiRequest {
  text: string;
  context?: 'resolution' | 'report' | 'briefing' | 'statement' | 'correspondence' | 'general';
}

export interface TerminologyCheckResponse {
  text: string;
  issues: Array<{
    term: string;
    suggestion: string;
    reason: string;
    severity: 'error' | 'warning' | 'info';
    position?: {
      start: number;
      end: number;
    };
  }>;
  overallCompliance: 'compliant' | 'non_compliant' | 'needs_review';
  editedText?: string;
}

// ============================================================================
// Document Upload API Types
// ============================================================================

export interface DocumentUploadRequest extends ApiRequest {
  fileName: string;
  mimeType: string;
  size: number;
  conflictId?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  uploadUrl: string;
  status: 'processing' | 'ready' | 'error';
}

// ============================================================================
// Search API Types
// ============================================================================

export interface SearchRequest extends ApiRequest {
  query: string;
  filters?: {
    entityTypes?: ConflictEntityType[];
    conflictIds?: string[];
    dateRange?: { start?: string; end?: string };
    actorIds?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  processingTime: number;
}
