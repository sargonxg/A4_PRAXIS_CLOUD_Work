import type { GateCoreKind } from '@/lib/api/capsule-gate';

export interface CapsuleGateError {
  error: 'capsule_missing_cores';
  message: string;
  missingCores: GateCoreKind[];
  staleCores: GateCoreKind[];
  capsuleId: string | null;
}

const ALLOWED_KINDS: ReadonlySet<string> = new Set([
  'user', 'situation', 'source', 'graph', 'time', 'output',
]);

function asGateKindArray(value: unknown): GateCoreKind[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is GateCoreKind => typeof v === 'string' && ALLOWED_KINDS.has(v));
}

/**
 * Parses a 412 response body from `withCalibration`'s capsule gate.
 * Returns `null` if the response is not a structured capsule-gate
 * refusal — callers should fall through to their generic error path.
 *
 * The parser is intentionally lenient: routes that return 412 for
 * unrelated reasons (precondition mismatches, etc.) won't be
 * misinterpreted because we require the explicit error tag.
 */
export function parseCapsuleGateResponse(body: unknown): CapsuleGateError | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (record.error !== 'capsule_missing_cores') return null;
  return {
    error: 'capsule_missing_cores',
    message: typeof record.message === 'string' ? record.message : 'Capsule is missing cores this tool requires.',
    missingCores: asGateKindArray(record.missingCores),
    staleCores: asGateKindArray(record.staleCores),
    capsuleId: typeof record.capsuleId === 'string' ? record.capsuleId : null,
  };
}

/**
 * Convenience wrapper: takes a `Response` from `fetch`, returns the
 * parsed capsule-gate error when status === 412 and the body matches,
 * otherwise returns `null`.
 */
export async function readCapsuleGateError(response: Response): Promise<CapsuleGateError | null> {
  if (response.status !== 412) return null;
  try {
    const body = (await response.clone().json()) as unknown;
    return parseCapsuleGateResponse(body);
  } catch {
    return null;
  }
}
