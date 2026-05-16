// ============================================================================
// Core Type Definitions for TACITUS
// ============================================================================

// conflict-grammar removed during MVP cleanup. Permissive aliases live here
// so callers keep compiling until the grammar is rebuilt around capsule cores.
export type Actor = { id: string; type: string; name?: string; [k: string]: unknown };
export type Claim = { id: string; statement: string; [k: string]: unknown };
export type Interest = { id: string; statement: string; [k: string]: unknown };
export type Constraint = { id: string; kind: string; [k: string]: unknown };
export type Leverage = { id: string; kind: string; [k: string]: unknown };
export type Commitment = { id: string; statement: string; [k: string]: unknown };
export type Event = { id: string; kind: string; [k: string]: unknown };
export type Narrative = { id: string; summary: string; [k: string]: unknown };
export type ConflictEntityType = string;
export interface ConflictEntity {
  id: string;
  type: ConflictEntityType;
  label?: string;
  [k: string]: unknown;
}
export interface ConflictGraph {
  nodes: ConflictEntity[];
  edges: Array<{ source: string; target: string; type?: string }>;
}

export type { Report, ReportSection } from './report';

export type {
  ApiRequest,
  ApiResponse,
  ApiError,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ReportGenerationRequest,
  ReportGenerationResponse,
  ConflictGraphQueryRequest,
  ConflictGraphQueryResponse,
  MediaAnalysisRequest,
  MediaAnalysisResponse,
  TerminologyCheckRequest,
  TerminologyCheckResponse,
} from './api';

// ============================================================================
// User and Organization Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  role: UserRole;
  avatar?: string;
  preferences?: LegacyUIPreferences;
}

export type UserRole =
  | 'admin'
  | 'analyst'
  | 'drafter'
  | 'reviewer'
  | 'viewer';

export interface LegacyUIPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTemplate: string;
  language: string;
  timezone: string;
  sidebarCollapsed: boolean;
}

export type { UserPreferences } from './preferences';

export interface Organization {
  id: string;
  name: string;
  type: 'un_agency' | 'un_mission' | 'government' | 'ngo' | 'research' | 'other';
  members: string[];
}

// ============================================================================
// Navigation and UI Types
// ============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
  requiresRole?: UserRole[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string | number;
}

// ============================================================================
// Document and Source Types
// ============================================================================

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content?: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  mimeType: string;
  status: 'processing' | 'ready' | 'error';
  extractedEntities?: number;
  metadata?: Record<string, unknown>;
}

export type DocumentType =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'html'
  | 'url'
  | 'image'
  | 'spreadsheet'
  | 'other';

export interface Source {
  type: 'document' | 'web' | 'graph' | 'manual';
  title: string;
  reference: string;
  confidence?: number;
  retrievedAt?: string;
}

// ============================================================================
// Chat and Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  title: string;
  conflictId?: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCallRecord[];
  sources?: Source[];
  timestamp: string;
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  duration?: number;
}

// ============================================================================
// Template Types
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSectionDefinition[];
  defaultWordCount?: number;
  audience: string;
  classification?: string;
}

export interface TemplateSectionDefinition {
  id: string;
  title: string;
  description: string;
  required: boolean;
  defaultWordCount?: number;
  order: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
}
