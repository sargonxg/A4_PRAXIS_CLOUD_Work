import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser } from './with-auth';
import { checkAndDeductCreditsForUid } from './with-credits';
import { buildCalibratedContext, type ContextBlock } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import {
  buildIdempotencyKey,
  startToolRun,
  completeToolRun,
  failToolRun,
} from '@/lib/jobs/job-service';
import { emitSystemEvent, emitNotification } from '@/lib/events/event-service';

export interface CalibrationCtx extends AuthenticatedUser {
  calibration: ContextBlock;
  toolRunId: string | null;
}

export type CalibratedHandler = (req: Request, ctx: CalibrationCtx) => Promise<Response>;

/**
 * Wraps a route handler with auth → credits → calibration → tool_run lifecycle.
 *
 * Side effects on every call (non-demo only):
 *   - tool_runs/{toolRunId}: created with status=running, semaphore=yellow|purple
 *   - On success: status=completed, semaphore=green
 *   - On failure: status=failed, semaphore=red, notification emitted
 *   - system_events/{...}: tool.started + tool.completed|tool.failed
 *
 * Idempotency: each call gets a per-request key (uid + toolId + timestamp).
 * AI tool calls are not retried automatically (the user re-clicks Generate),
 * so we do not collapse on idempotency the way Eventarc-driven jobs do.
 */
export function withCalibration(
  toolId: string,
  creditOpType: string,
  opts: {
    retrievalQuery?: (req: Request, body: Record<string, unknown>) => string | undefined;
    variant?: 'oneshot' | 'streaming' | 'agent';
  } = {},
) {
  const variant = opts.variant ?? 'oneshot';

  return (handler: CalibratedHandler) =>
    withAuth(async (req: Request, user: AuthenticatedUser) => {
      let body: Record<string, unknown> = {};
      let situationId: string | undefined;
      try {
        const raw = await req.clone().text();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
        if (typeof body.situationId === 'string') situationId = body.situationId;
        if (!situationId && body.situation && typeof body.situation === 'object') {
          const situation = body.situation as { id?: unknown };
          if (typeof situation.id === 'string') situationId = situation.id;
        }
      } catch { /* non-JSON body OK */ }

      // Onboarding gate (non-demo)
      if (!user.isDemo) {
        const profile = await getAnalystProfile(user.uid).catch(() => null);
        if (!profile?.meta?.completedAt) {
          return NextResponse.json({
            error: 'Onboarding required',
            message: 'Complete your analyst profile before using PRAXIS tools.',
            redirectTo: '/onboarding',
          }, { status: 403 });
        }
      }

      // Credit gate (non-demo)
      if (!user.isDemo) {
        const gate = await checkAndDeductCreditsForUid(user.uid, creditOpType, `tool:${toolId}`);
        if (!gate.allowed) return gate.response;
      }

      // Build calibration context (analyst profile + situation + SKC retrieval)
      const retrievalQuery = opts.retrievalQuery?.(req, body);
      const calibration = await buildCalibratedContext({
        uid: user.uid,
        situationId,
        toolId,
        retrievalQuery,
      });

      // Start tool_run record (non-demo only — demo users do not get persisted runs)
      let toolRunId: string | null = null;
      if (!user.isDemo) {
        try {
          const idempotencyKey = buildIdempotencyKey({
            uid: user.uid,
            situationId: situationId ?? null,
            toolId,
            trigger: `${req.method}:${new URL(req.url).pathname}:${Date.now()}`,
            payload: body,
          });
          const { run } = await startToolRun({
            uid: user.uid,
            situationId: situationId ?? null,
            toolId,
            variant,
            idempotencyKey,
            triggeredBy: 'user',
            profileVersion: calibration.provenance.profileVersion,
          });
          toolRunId = run.toolRunId;
          await emitSystemEvent({
            kind: 'tool.started',
            severity: 'info',
            uid: user.uid,
            situationId: situationId ?? null,
            toolRunId,
            message: `Tool ${toolId} started`,
            data: { variant, profileVersion: calibration.provenance.profileVersion },
            source: 'frontend',
          });
        } catch (err) {
          console.warn('[withCalibration] startToolRun failed (non-fatal):', err);
        }
      }

      // Invoke the actual handler
      let response: Response;
      try {
        response = await handler(req, { ...user, calibration, toolRunId });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (toolRunId) {
          await failToolRun(toolRunId, { code: 'handler_throw', message }).catch(() => {});
          await emitSystemEvent({
            kind: 'tool.failed',
            severity: 'error',
            uid: user.uid,
            situationId: situationId ?? null,
            toolRunId,
            message: `Tool ${toolId} threw: ${message}`,
            source: 'frontend',
          }).catch(() => {});
          await emitNotification({
            uid: user.uid,
            kind: 'tool.warning',
            semaphore: 'red',
            title: `${toolId} failed`,
            body: 'PRAXIS encountered an error generating this analysis. Try again, or contact support if it persists.',
            situationId,
            toolRunId,
          }).catch(() => {});
        }
        throw err;
      }

      // Mark tool_run terminal based on response status
      if (toolRunId) {
        const status = response.status;
        if (status >= 200 && status < 300) {
          await completeToolRun(toolRunId).catch(() => {});
          await emitSystemEvent({
            kind: 'tool.completed',
            severity: 'info',
            uid: user.uid,
            situationId: situationId ?? null,
            toolRunId,
            message: `Tool ${toolId} completed (HTTP ${status})`,
            source: 'frontend',
          }).catch(() => {});
        } else {
          await failToolRun(toolRunId, {
            code: `http_${status}`,
            message: `Tool returned HTTP ${status}`,
          }).catch(() => {});
          await emitSystemEvent({
            kind: 'tool.failed',
            severity: status >= 500 ? 'error' : 'warn',
            uid: user.uid,
            situationId: situationId ?? null,
            toolRunId,
            message: `Tool ${toolId} returned HTTP ${status}`,
            source: 'frontend',
          }).catch(() => {});
        }
      }

      return response;
    });
}
