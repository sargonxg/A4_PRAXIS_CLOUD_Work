import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ConversationContext } from '@/types/context';

const TOKEN_VERSION = 'v1';
const MAX_TOKEN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface ConversationTokenEnvelope {
  v: typeof TOKEN_VERSION;
  iat: number;
  conversation: ConversationContext;
}

export type ConversationTokenVerification =
  | { ok: true; conversation: ConversationContext }
  | { ok: false; reason: 'missing-secret' | 'malformed' | 'bad-signature' | 'expired' };

export function getConversationTokenSecret(): string | null {
  return process.env.PRAXIS_CONTEXT_TOKEN_SECRET
    || process.env.AUTH_COOKIE_SECRET
    || process.env.COOKIE_SIGNING_SECRET
    || process.env.NEXTAUTH_SECRET
    || null;
}

export function signConversationContext(
  conversation: ConversationContext,
  secret = getConversationTokenSecret(),
  issuedAt = Date.now(),
): string {
  if (!secret) throw new Error('Conversation context token secret is not configured');
  const payload = encodeBase64Url(JSON.stringify({ v: TOKEN_VERSION, iat: issuedAt, conversation } satisfies ConversationTokenEnvelope));
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyConversationContextToken(
  token: string,
  secret = getConversationTokenSecret(),
  now = Date.now(),
): ConversationTokenVerification {
  if (!secret) return { ok: false, reason: 'missing-secret' };
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return { ok: false, reason: 'malformed' };

  const expected = signPayload(payload, secret);
  if (!safeEqual(signature, expected)) return { ok: false, reason: 'bad-signature' };

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<ConversationTokenEnvelope>;
    if (parsed.v !== TOKEN_VERSION || typeof parsed.iat !== 'number' || !parsed.conversation) {
      return { ok: false, reason: 'malformed' };
    }
    if (now - parsed.iat > MAX_TOKEN_AGE_MS) return { ok: false, reason: 'expired' };
    const sanitized = sanitizeConversationContext(parsed.conversation);
    return {
      ok: true,
      conversation: {
        sessionId: sanitized.sessionId ?? 'signed-session',
        startedAt: sanitized.startedAt ?? new Date(parsed.iat).toISOString(),
        workbenchTab: sanitized.workbenchTab,
        focusedNodeId: sanitized.focusedNodeId,
        focusedToolId: sanitized.focusedToolId,
        focusedMemoBlockId: sanitized.focusedMemoBlockId,
        recentActions: sanitized.recentActions ?? [],
      },
    };
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}

export function sanitizeConversationContext(input: Partial<ConversationContext>): Partial<ConversationContext> {
  return {
    sessionId: typeof input.sessionId === 'string' ? input.sessionId.slice(0, 160) : undefined,
    startedAt: typeof input.startedAt === 'string' ? input.startedAt : undefined,
    workbenchTab: typeof input.workbenchTab === 'string' ? input.workbenchTab as ConversationContext['workbenchTab'] : undefined,
    focusedNodeId: typeof input.focusedNodeId === 'string' ? input.focusedNodeId.slice(0, 240) : undefined,
    focusedToolId: typeof input.focusedToolId === 'string' ? input.focusedToolId.slice(0, 240) : undefined,
    focusedMemoBlockId: typeof input.focusedMemoBlockId === 'string' ? input.focusedMemoBlockId.slice(0, 240) : undefined,
    recentActions: Array.isArray(input.recentActions)
      ? input.recentActions.slice(-10).flatMap((action) => {
          if (!action || typeof action !== 'object') return [];
          const item = action as Partial<ConversationContext['recentActions'][number]>;
          if (typeof item.id !== 'string' || typeof item.type !== 'string' || typeof item.label !== 'string' || typeof item.at !== 'string') return [];
          return [{
            id: item.id.slice(0, 120),
            type: item.type,
            label: item.label.slice(0, 240),
            at: item.at,
          } as ConversationContext['recentActions'][number]];
        })
      : [],
  };
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}
