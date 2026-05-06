/**
 * Stripe Meters helper — Brick #54 round 5.
 *
 * On every successful tool run, emit a Stripe Meters event so we can
 * reconcile internal credits against actual GCP cost and bill paying
 * users on real usage. Today's credit table (`AI_CREDIT_COSTS` in
 * `with-credits.ts`) is already authoritative for the analyst-facing
 * cost; meters track the underlying VRAM/inference cost in parallel
 * for finance.
 *
 * Pure helpers + a thin client that calls the Stripe Meters API. Never
 * throws — emit failures publish a `dev_backlog` row but never block
 * the tool route.
 *
 * Configuration:
 *   - STRIPE_SECRET_KEY         (Secret Manager `praxis-stripe-secret`)
 *   - STRIPE_METERS_DISABLE     ('1' to no-op the helper in dev)
 *
 * Spec: docs/ROUND_5_PLAN_2026-04-26.md item #54.
 */

import { publishBacklogEntry } from '@/lib/dev-backlog/service';

export type MeterEventName =
  | 'praxis.tool_run'        // every successful tool run
  | 'praxis.input_tokens'    // model input tokens
  | 'praxis.output_tokens'   // model output tokens
  | 'praxis.thinking_tokens' // Pro/Deep-Think thinking tokens
  | 'praxis.gdelt_query'     // legacy — kept for old customers
  | 'praxis.grounded_search_page'; // legacy meter label

export interface MeterEvent {
  /** Stripe customer id — `cus_XXX`. Resolved by the caller (typically
   *  from `users/{uid}.stripeCustomerId`). */
  stripeCustomerId: string;
  eventName: MeterEventName;
  /** Always positive; meters aggregate by sum at billing time. */
  value: number;
  /** Tool id for breakdown (e.g. "risk-monitor"). */
  toolId?: string;
  /** Optional model identifier, e.g. "gemini-2.5-pro". */
  modelId?: string;
  /** Optional ISO timestamp; Stripe defaults to now. */
  occurredAt?: string;
  /** Idempotency key to fold duplicate retries. Use `tool_runs/{id}`. */
  idempotencyKey?: string;
}

const STRIPE_METER_URL = 'https://api.stripe.com/v1/billing/meter_events';

function isDisabled(): boolean {
  return process.env.STRIPE_METERS_DISABLE === '1';
}

function getSecret(): string | null {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return key.length > 8 ? key : null;
}

/**
 * Emit a single meter event. Never throws.
 *
 * On 4xx (configuration error), publishes a `dev_backlog` row with kind
 * `error.calibration` so ops sees the misconfiguration. On 5xx
 * (transient), backlog row with kind `error.route`.
 */
export async function emitMeterEvent(event: MeterEvent): Promise<{ ok: boolean; reason?: string }> {
  if (isDisabled()) return { ok: true, reason: 'STRIPE_METERS_DISABLE=1' };
  const secret = getSecret();
  if (!secret) {
    // No-op if Stripe isn't configured. This is normal in dev / staging.
    return { ok: true, reason: 'STRIPE_SECRET_KEY not configured' };
  }
  if (!event.stripeCustomerId.startsWith('cus_')) {
    return { ok: false, reason: 'invalid stripeCustomerId' };
  }
  if (!Number.isFinite(event.value) || event.value < 0) {
    return { ok: false, reason: 'invalid value' };
  }

  const body = new URLSearchParams();
  body.set('event_name', event.eventName);
  body.set('payload[stripe_customer_id]', event.stripeCustomerId);
  body.set('payload[value]', String(event.value));
  if (event.toolId) body.set('payload[tool_id]', event.toolId);
  if (event.modelId) body.set('payload[model_id]', event.modelId);
  if (event.occurredAt) body.set('timestamp', String(Math.floor(new Date(event.occurredAt).getTime() / 1000)));
  if (event.idempotencyKey) body.set('identifier', event.idempotencyKey);

  try {
    const r = await fetch(STRIPE_METER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(event.idempotencyKey ? { 'Idempotency-Key': event.idempotencyKey } : {}),
      },
      body: body.toString(),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      const severity = r.status >= 500 ? 'high' : r.status === 429 ? 'medium' : 'medium';
      void publishBacklogEntry({
        kind: r.status >= 500 ? 'error.route' : 'error.calibration',
        source: 'auto',
        severity,
        message: `Stripe Meter ${event.eventName} failed (${r.status})`,
        toolId: event.toolId,
        route: STRIPE_METER_URL,
        httpStatus: r.status,
        detail,
        suggestedFix: r.status === 401 ? 'Rotate STRIPE_SECRET_KEY in Secret Manager' : undefined,
      });
      return { ok: false, reason: `HTTP ${r.status}` };
    }
    return { ok: true };
  } catch (err) {
    void publishBacklogEntry({
      kind: 'error.route',
      source: 'auto',
      severity: 'medium',
      message: `Stripe Meter ${event.eventName} network error`,
      toolId: event.toolId,
      route: STRIPE_METER_URL,
      detail: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, reason: err instanceof Error ? err.message : 'network' };
  }
}

/**
 * Emit a tool-run meter event with optional token usage. Single
 * call-site for every calibrated route's onSuccess hook.
 */
export async function emitToolRunMetered(input: {
  stripeCustomerId: string | null;
  toolId: string;
  modelId?: string;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  toolRunId?: string;
}): Promise<void> {
  if (!input.stripeCustomerId) return; // user not on a metered plan
  const idempotency = input.toolRunId ? `tool_run:${input.toolRunId}` : undefined;
  // 1 event per dimension. Individual emit failures don't block the others.
  void emitMeterEvent({
    stripeCustomerId: input.stripeCustomerId,
    eventName: 'praxis.tool_run',
    value: 1,
    toolId: input.toolId,
    modelId: input.modelId,
    idempotencyKey: idempotency,
  });
  if (typeof input.inputTokens === 'number' && input.inputTokens > 0) {
    void emitMeterEvent({
      stripeCustomerId: input.stripeCustomerId,
      eventName: 'praxis.input_tokens',
      value: input.inputTokens,
      toolId: input.toolId,
      modelId: input.modelId,
      idempotencyKey: idempotency ? `${idempotency}:input` : undefined,
    });
  }
  if (typeof input.outputTokens === 'number' && input.outputTokens > 0) {
    void emitMeterEvent({
      stripeCustomerId: input.stripeCustomerId,
      eventName: 'praxis.output_tokens',
      value: input.outputTokens,
      toolId: input.toolId,
      modelId: input.modelId,
      idempotencyKey: idempotency ? `${idempotency}:output` : undefined,
    });
  }
  if (typeof input.thinkingTokens === 'number' && input.thinkingTokens > 0) {
    void emitMeterEvent({
      stripeCustomerId: input.stripeCustomerId,
      eventName: 'praxis.thinking_tokens',
      value: input.thinkingTokens,
      toolId: input.toolId,
      modelId: input.modelId,
      idempotencyKey: idempotency ? `${idempotency}:thinking` : undefined,
    });
  }
}

export const __test__ = {
  isDisabled,
  getSecret,
};
