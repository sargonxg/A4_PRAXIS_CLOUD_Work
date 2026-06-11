import type {
  AgentRunFailureEventSummary,
  AgentRunFailureSummary,
  AgentRunFailureToolCallSummary,
  AgentToolCall,
  AgentToolRisk,
} from '@/lib/agent-runtime/types';

export type AgentFailureDiagnosticInput = {
  category: string;
  policyAgentId: string | null;
  executionMode: string;
  failedPhase: string;
  errorName: string;
  errorMessage: string;
};

export function buildAgentRunFailureSummary(input: {
  diagnostic: AgentFailureDiagnosticInput;
  lastEventBeforeFailure?: unknown;
  failingToolCall?: AgentToolCall | AgentRunFailureToolCallSummary | null;
  createdAt?: string;
}): AgentRunFailureSummary {
  const sanitizedError = sanitizeAgentRunFailureText(input.diagnostic.errorMessage);
  const failingToolCall = normalizeToolCallSummary(input.failingToolCall)
    ?? inferFailedToolCall(input.diagnostic.failedPhase, sanitizedError);

  return {
    schemaVersion: 1,
    category: cleanToken(input.diagnostic.category, 'agent_run_failed'),
    failedPhase: cleanToken(input.diagnostic.failedPhase, 'unknown_phase'),
    executionMode: cleanToken(input.diagnostic.executionMode, 'agent'),
    policyAgentId: cleanNullableToken(input.diagnostic.policyAgentId),
    errorName: sanitizeAgentRunFailureText(input.diagnostic.errorName).slice(0, 80) || 'Error',
    sanitizedError,
    retryGuidance: retryGuidanceFor(input.diagnostic.category, input.diagnostic.failedPhase),
    lastEventBeforeFailure: normalizeEventSummary(input.lastEventBeforeFailure),
    failingToolCall,
    createdAt: safeIso(input.createdAt) ?? new Date().toISOString(),
  };
}

export function normalizeAgentRunFailureSummary(value: unknown): AgentRunFailureSummary | null {
  if (!isRecord(value)) return null;
  const category = stringValue(value.category);
  const failedPhase = stringValue(value.failedPhase);
  const executionMode = stringValue(value.executionMode);
  const sanitizedError = stringValue(value.sanitizedError);
  if (!category || !failedPhase || !executionMode || !sanitizedError) return null;

  return {
    schemaVersion: 1,
    category: cleanToken(category, 'agent_run_failed'),
    failedPhase: cleanToken(failedPhase, 'unknown_phase'),
    executionMode: cleanToken(executionMode, 'agent'),
    policyAgentId: cleanNullableToken(value.policyAgentId),
    errorName: sanitizeAgentRunFailureText(stringValue(value.errorName) ?? 'Error').slice(0, 80) || 'Error',
    sanitizedError: sanitizeAgentRunFailureText(sanitizedError),
    retryGuidance: sanitizeAgentRunFailureText(stringValue(value.retryGuidance) ?? retryGuidanceFor(category, failedPhase)).slice(0, 300),
    lastEventBeforeFailure: normalizeEventSummary(value.lastEventBeforeFailure),
    failingToolCall: normalizeToolCallSummary(value.failingToolCall),
    createdAt: safeIso(stringValue(value.createdAt)) ?? new Date(0).toISOString(),
  };
}

export function sanitizeAgentRunFailureText(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value ?? '');
  const firstUsefulLine = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((line) => line.trim() && !/^\s*at\s+/i.test(line))
    ?? '';
  const cleaned = firstUsefulLine
    .replace(/https?:\/\/[^\s)]+/gi, '[redacted-url]')
    .replace(/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+[^\s)]*/gi, '[redacted-url]')
    .replace(/[A-Za-z]:\\[^\s)]+/g, '[redacted-path]')
    .replace(/\/(?:Users|workspace|app|var|tmp)\/[^\s)]+/g, '[redacted-path]')
    .replace(/(authorization:\s*bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(token|secret|password|api[_-]?key|key)=([^&\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@(?:[^.\s]+\.)*(?:internal|local|gserviceaccount)\b/gi, '[redacted-email]')
    .replace(/\bAIza[0-9A-Za-z_-]+/g, '[REDACTED]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
  return cleaned || 'Worker failed without a public error message.';
}

function normalizeEventSummary(value: unknown): AgentRunFailureEventSummary | null {
  if (!isRecord(value)) return null;
  const eventId = stringValue(value.eventId) ?? stringValue(value.id);
  const eventType = stringValue(value.eventType);
  const createdAt = safeIso(stringValue(value.createdAt));
  if (!eventId || !eventType || !createdAt) return null;
  const data = isRecord(value.data) ? value.data : {};
  return {
    eventId: cleanToken(eventId, 'event'),
    eventType: cleanToken(eventType, 'event'),
    message: stringValue(value.message) ? sanitizeAgentRunFailureText(value.message) : null,
    phase: stringValue(value.phase) ?? stringValue(data.phase),
    createdAt,
  };
}

function normalizeToolCallSummary(value: unknown): AgentRunFailureToolCallSummary | null {
  if (!isRecord(value)) return null;
  const toolId = stringValue(value.toolId);
  if (!toolId) return null;
  return {
    toolCallId: stringValue(value.toolCallId) ?? stringValue(value.id),
    toolId: cleanToken(toolId, 'tool'),
    status: 'failed',
    risk: riskValue(value.risk),
    error: stringValue(value.error) ? sanitizeAgentRunFailureText(value.error) : null,
    startedAt: safeIso(stringValue(value.startedAt)),
    completedAt: safeIso(stringValue(value.completedAt)),
  };
}

function inferFailedToolCall(failedPhase: string, sanitizedError: string): AgentRunFailureToolCallSummary {
  const phase = failedPhase.toLowerCase();
  const toolId = phase.includes('evidence')
    ? 'capsule-evidence-pack'
    : phase.includes('sourceability')
      ? 'sourceability-reviewer'
      : phase.includes('memo')
        ? 'policy-memo'
        : phase.includes('output-capsule')
          ? 'output-capsule-save'
          : phase.includes('search') || phase.includes('grounding')
            ? 'grounded-search'
            : phase.includes('boardroom')
              ? 'boardroom-deliberation'
              : phase.includes('approval')
                ? 'approval-gate'
                : phase.includes('workflow')
                  ? 'workflow-plan'
                  : phase.includes('context')
                    ? 'context-resolve'
                    : 'worker-phase';
  return {
    toolCallId: null,
    toolId,
    status: 'failed',
    risk: null,
    error: sanitizedError,
    startedAt: null,
    completedAt: null,
  };
}

function retryGuidanceFor(category: string, failedPhase: string): string {
  const text = `${category} ${failedPhase}`.toLowerCase();
  if (text.includes('approval')) return 'Review pending approvals and retry after the gate is resolved.';
  if (text.includes('search') || text.includes('grounding')) return 'Check source/grounding provider configuration, then retry the run.';
  if (text.includes('memo') || text.includes('output')) return 'Check output persistence and export services, then retry the run.';
  if (text.includes('context') || text.includes('evidence')) return 'Refresh the capsule context and source attachments, then retry the run.';
  return 'Retry the run after checking the latest receipt and worker health.';
}

function cleanToken(value: string, fallback: string): string {
  return value.trim().replace(/[^\w:./-]/g, '-').slice(0, 120) || fallback;
}

function cleanNullableToken(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? cleanToken(value, 'agent') : null;
}

function riskValue(value: unknown): AgentToolRisk | null {
  return value === 'low' || value === 'medium' || value === 'high' ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
