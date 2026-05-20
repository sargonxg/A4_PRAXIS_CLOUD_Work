import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  answerEnvelope?: AskAnswerEnvelope;
  runtime?: Record<string, unknown>;
  routingReceipt?: unknown;
};

type ThreadHistoryTurn = { prompt?: string; output?: string; createdAt?: string };

export type SavedConversationTurn = {
  prompt?: string;
  output?: string;
  runtime?: Record<string, unknown> | null;
  answerEnvelope?: AskAnswerEnvelope | null;
  routingReceipt?: unknown;
  createdAt?: string;
};

export type SavedConversationSummary = {
  conversationId: string;
  capsuleId?: string;
  href?: string;
  title?: string;
  updatedAt?: string;
  turnCount?: number;
  status?: string;
};

export type ConversationCapsuleChip = {
  id: string;
  label: string;
  role: string;
};

export function createConversationThreadId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `ask-${time}-${random}`;
}

export function sanitizeConversationThreadId(value: string | null | undefined): string | null {
  const clean = value?.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  return clean && clean.length >= 3 ? clean : null;
}

export function buildConversationUrl(capsuleId: string, threadId: string): string {
  const path = buildConversationPath(capsuleId, threadId);
  if (typeof window === 'undefined') return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('capsuleId', capsuleId);
  return url.toString();
}

export function buildConversationPath(capsuleId: string, threadId: string): string {
  return `/app/conversations/${encodeURIComponent(threadId)}?capsuleId=${encodeURIComponent(capsuleId)}`;
}

export function savedConversationHref(conversation: SavedConversationSummary, fallbackCapsuleId: string): string {
  if (typeof conversation.href === 'string' && conversation.href.startsWith('/app/conversations/')) return conversation.href;
  return buildConversationPath(conversation.capsuleId || fallbackCapsuleId, conversation.conversationId);
}

export function pushConversationUrl(capsuleId: string, threadId: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(buildConversationUrl(capsuleId, threadId));
  window.history.pushState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export function savedConversationTurnsToMessages(turns: SavedConversationTurn[]): ChatMessage[] {
  return turns.flatMap((turn) => {
    const prompt = typeof turn.prompt === 'string' ? turn.prompt : '';
    const output = typeof turn.output === 'string' && turn.output.trim()
      ? turn.output
      : failedTurnText(turn);
    const answerEnvelope = turn.answerEnvelope ?? (isRecord(turn.runtime?.answerEnvelope) ? turn.runtime.answerEnvelope as unknown as AskAnswerEnvelope : undefined);
    const routingReceipt = turn.routingReceipt ?? (isRecord(turn.runtime?.routingReceipt) ? turn.runtime.routingReceipt : undefined);
    return [
      { role: 'user' as const, text: prompt },
      { role: 'assistant' as const, text: output, answerEnvelope, runtime: turn.runtime ?? undefined, routingReceipt },
    ];
  }).filter((message) => message.text.trim().length > 0);
}

function failedTurnText(turn: SavedConversationTurn): string {
  const error = typeof turn.runtime?.error === 'string' ? turn.runtime.error : '';
  if (!error) return '';
  return `This Ask PRAXIS turn did not complete. ${error}`;
}

export function answerEnvelopeFromDataStreamLine(line: string): AskAnswerEnvelope | undefined {
  if (!line.startsWith('2:')) return undefined;
  try {
    const payload = JSON.parse(line.slice(2)) as { type?: string; answerEnvelope?: unknown };
    return payload.type === 'answerEnvelope' && isRecord(payload.answerEnvelope)
      ? payload.answerEnvelope as unknown as AskAnswerEnvelope
      : undefined;
  } catch {
    return undefined;
  }
}

export function safeMarkdownHref(href: string | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (/^(https?:|mailto:)/i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function loadLegacyAskThreadHistory(capsuleId: string, threadId: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    capsuleId,
    threadId,
    limit: '12',
  });
  const response = await fetch(`/api/ai/chat?${params.toString()}`, { credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? 'legacy conversation history failed');
  const turns = Array.isArray(payload?.turns) ? payload.turns as ThreadHistoryTurn[] : [];
  return turns.flatMap((turn) => [
    { role: 'user' as const, text: turn.prompt ?? '' },
    { role: 'assistant' as const, text: turn.output ?? '' },
  ]).filter((message) => message.text.trim().length > 0);
}

export async function ensureConversationRecord(threadId: string, capsuleId: string, activeCapsules: ConversationCapsuleChip[]) {
  await fetch('/api/conversations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      conversationId: threadId,
      capsuleId,
      appliedCapsules: activeCapsules.map((capsule) => ({
        id: capsule.id,
        label: capsule.label,
        role: capsule.role,
      })),
    }),
  }).catch(() => undefined);
}
