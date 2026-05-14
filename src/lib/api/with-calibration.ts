import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser } from './with-auth';
import { checkAndDeductCreditsForUid } from './with-credits';
import { checkCapsuleForTool } from './capsule-gate';
import { buildCalibratedContext, type ContextBlock } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { isOnboardingComplete } from '@/lib/auth/onboarding-status';
import { listCapsules } from '@/lib/context/capsule-service';
import {
  buildIdempotencyKey,
  startToolRun,
  completeToolRun,
  failToolRun,
} from '@/lib/jobs/job-service';
import { emitSystemEvent, emitNotification } from '@/lib/events/event-service';
import { publishBacklogEntry } from '@/lib/dev-backlog/service';
import { AI_REQUEST_LIMITS } from './ai-request-limits';
import { canonicalToolId } from '@/lib/knowledge/evidence-envelope';
import { buildToolPromptContract } from '@/lib/tools/tool-operating-contracts';
import { buildToolContextBlueprintPrompt } from '@/lib/tools/tool-context-blueprints';
import { withContextAware } from '@/lib/api/with-context-aware';
import { withFirewall } from '@/lib/api/with-firewall';
import { appendContextQualityBlock, buildPromptHealthReport } from '@/lib/context/prompt-health';
import type { ContextSnapshot } from '@/types/context';
import type { Situation } from '@/types/situation';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';

export interface CalibrationCtx extends AuthenticatedUser {
  calibration: ContextBlock;
  contextSnapshot: ContextSnapshot;
  toolRunId: string | null;
}

export type CalibratedHandler = (req: Request, ctx: CalibrationCtx) => Promise<Response>;

function jsonError(status: number, error: string, message: string, details?: Record<string, unknown>): Response {
  return NextResponse.json(
    { error, message, ...(details ? { details } : {}) },
    {
      status,
      headers: {
        'X-Praxis-Safeguard': error,
      },
    },
  );
}

function estimateTextChars(value: unknown): number {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + estimateTextChars(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (sum, item) => sum + estimateTextChars(item),
      0,
    );
  }
  return 0;
}

function checkAiRequestLimits(body: Record<string, unknown>): Response | null {
  const messages = body.messages;
  if (Array.isArray(messages) && messages.length > AI_REQUEST_LIMITS.maxMessages) {
    return jsonError(
      413,
      'ai_request_too_many_messages',
      'This AI request includes too many chat messages. Start a new thread or summarize earlier context before continuing.',
      { maxMessages: AI_REQUEST_LIMITS.maxMessages, receivedMessages: messages.length },
    );
  }

  const textChars = estimateTextChars(body);
  if (textChars > AI_REQUEST_LIMITS.maxTextChars) {
    return jsonError(
      413,
      'ai_request_too_large',
      'This AI request is too large. Upload large source material as documents or split the request into smaller sections.',
      { maxTextChars: AI_REQUEST_LIMITS.maxTextChars, receivedTextChars: textChars },
    );
  }

  return null;
}

export function enrichCalibrationWithToolBackbone(calibration: ContextBlock, toolId: string): ContextBlock {
  const canonical = canonicalToolId(toolId);
  const toolBackbone = [
    buildToolPromptContract(canonical),
    buildToolContextBlueprintPrompt(canonical),
  ].join('\n\n');
  return {
    ...calibration,
    systemPromptBlock: `${calibration.systemPromptBlock}\n\n${toolBackbone}`,
  };
}

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
 *
 * Routes with unusual body shapes can provide `opts.situationId`; otherwise
 * the wrapper reads `body.situationId` or `body.situation.id`.
 */
export function withCalibration(
  toolId: string,
  creditOpType: string,
  opts: {
    retrievalQuery?: (req: Request, body: Record<string, unknown>) => string | undefined;
    situationId?: (req: Request, body: Record<string, unknown>) => string | undefined;
    variant?: 'oneshot' | 'streaming' | 'agent';
  } = {},
) {
  const variant = opts.variant ?? 'oneshot';

  return (handler: CalibratedHandler) =>
    withAuth(async (req: Request, user: AuthenticatedUser) => {
      const requestStartedAt = Date.now();
      const routePath = new URL(req.url).pathname;
      let body: Record<string, unknown> = {};
      let situationId: string | undefined;
      let providedSituation: Partial<Situation> | null = null;
      try {
        const raw = await req.clone().text();
        const rawBytes = new TextEncoder().encode(raw).byteLength;
        if (rawBytes > AI_REQUEST_LIMITS.maxBytes) {
          return jsonError(
            413,
            'ai_request_payload_too_large',
            'This AI request payload is too large. Upload source material as documents or split it into smaller requests.',
            { maxBytes: AI_REQUEST_LIMITS.maxBytes, receivedBytes: rawBytes },
          );
        }
        if (raw) {
          try {
            body = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            if ((req.headers.get('content-type') ?? '').includes('application/json')) {
              return jsonError(400, 'malformed_json', 'The AI request body is not valid JSON.');
            }
          }
        }
        const limitResponse = checkAiRequestLimits(body);
        if (limitResponse) return limitResponse;
        if (typeof body.situationId === 'string') situationId = body.situationId;
        if (!situationId && body.situation && typeof body.situation === 'object') {
          const situation = body.situation as { id?: unknown };
          providedSituation = body.situation as Partial<Situation>;
          if (typeof situation.id === 'string') situationId = situation.id;
        }
      } catch { /* non-JSON body OK */ }
      situationId = opts.situationId?.(req, body) ?? situationId;

      // Onboarding gate (non-demo)
      if (!user.isDemo) {
        const profile = await getAnalystProfile(user.uid).catch(() => null);
        if (!isOnboardingComplete(profile)) {
          return NextResponse.json({
            error: 'Onboarding required',
            message: 'Complete your analyst profile before using PRAXIS tools.',
            redirectTo: '/onboarding',
          }, { status: 403 });
        }
      }

      // Capsule contract gate (non-demo, situation-scoped): refuse 412 when
      // the active capsule is missing cores the tool declares as required.
      // Client renders FixThisFirstPanel from the response payload.
      if (!user.isDemo && situationId) {
        try {
          const capsules = await listCapsules(user.uid, { situationId });
          const activeCapsule =
            capsules.find((capsule) => capsule.activeForSituationIds.includes(situationId)) ?? null;
          const gate = checkCapsuleForTool(activeCapsule, toolId);
          if (gate.missingCores.length > 0 || gate.staleCores.length > 0) {
            await emitTelemetrySafe({
              eventName: 'calibration.refusal',
              uid: user.uid,
              orgId: orgIdOf(user),
              caseId: situationId,
              route: routePath,
              toolId,
              status: 'blocked',
              latencyMs: Date.now() - requestStartedAt,
              details: {
                reason: 'capsule-missing-cores',
                missingCores: gate.missingCores,
                staleCores: gate.staleCores,
                capsuleId: activeCapsule?.capsuleId ?? null,
              },
            });
            return NextResponse.json(
              {
                error: 'capsule_missing_cores',
                message:
                  'The active capsule is missing one or more cores this tool requires. Repair the capsule, then re-run.',
                missingCores: gate.missingCores,
                staleCores: gate.staleCores,
                capsuleId: activeCapsule?.capsuleId ?? null,
              },
              {
                status: 412,
                headers: { 'X-Praxis-Safeguard': 'capsule_missing_cores' },
              },
            );
          }
        } catch (err) {
          // Capsule lookup failure is non-fatal — fall through to the
          // existing context-thin gate which will catch most real cases.
          console.warn('[withCalibration] capsule gate skipped:', err);
        }
      }

      const contextAware = await withContextAware({
        req,
        user,
        situationId,
        situation: providedSituation,
        spec: {
          user: { role: true, preferences: true },
          workspace: { methodologyDocs: true },
          caseGraph: { minNodeCount: 1 },
          minHealthScore: 60,
          graceful: true,
        },
      });
      const promptHealth = buildPromptHealthReport(contextAware.snapshot);
      if (promptHealth.forceRunRequired && body.forceRun !== true) {
        await emitTelemetrySafe({
          eventName: 'calibration.refusal',
          uid: user.uid,
          orgId: orgIdOf(user),
          caseId: situationId ?? null,
          route: routePath,
          toolId,
          status: 'blocked',
          latencyMs: Date.now() - requestStartedAt,
          details: {
            reason: 'context-too-thin',
            score: promptHealth.score,
            missingLayerCount: promptHealth.missingLayers.length,
          },
        });
        const response = NextResponse.json({
          error: 'context_too_thin',
          message: 'This case file is too thin for a trustworthy calibrated AI run. Add context first, or run anyway with visible caveats.',
          refusal: true,
          reason: 'context-too-thin',
          score: promptHealth.score,
          missingLayers: promptHealth.missingLayers,
          weakLayers: promptHealth.weakLayers,
          suggestedFlow: promptHealth.suggestedFlow,
          promptHealth,
        }, {
          status: 422,
          headers: {
            'X-Praxis-Safeguard': 'context_too_thin',
            'X-Praxis-Context-Health-State': promptHealth.state,
          },
        });
        contextAware.headers.forEach((value, key) => response.headers.set(key, value));
        return response;
      }

      // Credit gate (non-demo)
      if (!user.isDemo) {
        const gate = await checkAndDeductCreditsForUid(user.uid, creditOpType, `tool:${toolId}`, situationId);
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
      const enrichedCalibration = enrichCalibrationWithToolBackbone(calibration, toolId);
      const calibratedWithPromptHealth = {
        ...enrichedCalibration,
        systemPromptBlock: appendContextQualityBlock(enrichedCalibration.systemPromptBlock, promptHealth),
      };
      await emitTelemetrySafe({
        eventName: 'calibration.snapshot-built',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: situationId ?? null,
        route: routePath,
        toolId,
        status: 'ok',
        latencyMs: Date.now() - requestStartedAt,
        details: {
          profileVersion: calibratedWithPromptHealth.provenance.profileVersion ?? null,
          promptHealthState: promptHealth.state,
          promptHealthScore: promptHealth.score,
          forceRun: body.forceRun === true,
        },
      });
      if (body.forceRun === true) {
        await emitTelemetrySafe({
          eventName: 'calibration.force-run',
          uid: user.uid,
          orgId: orgIdOf(user),
          caseId: situationId ?? null,
          route: routePath,
          toolId,
          status: 'ok',
          latencyMs: Date.now() - requestStartedAt,
          details: {
            promptHealthState: promptHealth.state,
            promptHealthScore: promptHealth.score,
          },
        });
      }
      await emitTelemetrySafe({
        eventName: 'tool.run-start',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: situationId ?? null,
        route: routePath,
        toolId,
        status: 'queued',
        details: { variant },
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
            profileVersion: calibratedWithPromptHealth.provenance.profileVersion,
          });
          toolRunId = run.toolRunId;
          await emitSystemEvent({
            kind: 'tool.started',
            severity: 'info',
            uid: user.uid,
            situationId: situationId ?? null,
            toolRunId,
            message: `Tool ${toolId} started`,
            data: {
              variant,
              profileVersion: calibratedWithPromptHealth.provenance.profileVersion,
              promptHealth: {
                score: promptHealth.score,
                state: promptHealth.state,
                missingLayers: promptHealth.missingLayers,
              },
            },
            source: 'frontend',
          });
        } catch (err) {
          console.warn('[withCalibration] startToolRun failed (non-fatal):', err);
        }
      }

      // Invoke the actual handler
      let response: Response;
      try {
        response = await handler(req, {
          ...user,
          calibration: calibratedWithPromptHealth,
          contextSnapshot: contextAware.snapshot,
          toolRunId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await emitTelemetrySafe({
          eventName: 'tool.run-fail',
          uid: user.uid,
          orgId: orgIdOf(user),
          caseId: situationId ?? null,
          route: routePath,
          toolId,
          status: 'fail',
          latencyMs: Date.now() - requestStartedAt,
          details: {
            code: 'handler_throw',
            message: message.slice(0, 240),
          },
        });
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
          // Auto-file the failure into the developer backlog so code agents
          // see it on their next planning sweep.
          await publishBacklogEntry({
            kind: 'error.route',
            source: 'auto',
            severity: 'high',
            message: `Tool ${toolId} threw: ${message}`,
            toolId,
            situationId: situationId ?? undefined,
            uid: user.uid,
            route: routePath,
            httpStatus: 500,
          }).catch(() => {});
        }
        throw err;
      }

      const terminalStatus = response.status;
      await emitTelemetrySafe({
        eventName: terminalStatus >= 200 && terminalStatus < 300 ? 'tool.run-complete' : 'tool.run-fail',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: situationId ?? null,
        route: routePath,
        toolId,
        status: terminalStatus >= 200 && terminalStatus < 300 ? 'ok' : 'fail',
        latencyMs: Date.now() - requestStartedAt,
        details: { httpStatus: terminalStatus, variant },
      });

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
          // Backlog row for non-2xx (5xx = high, 4xx = medium, 401/403 = low).
          if (status >= 400) {
            const severity = status >= 500 ? 'high' : status === 401 || status === 403 ? 'low' : 'medium';
            await publishBacklogEntry({
              kind: 'error.route',
              source: 'auto',
              severity,
              message: `Tool ${toolId} returned HTTP ${status}`,
              toolId,
              situationId: situationId ?? undefined,
              uid: user.uid,
              route: routePath,
              httpStatus: status,
            }).catch(() => {});
          }
        }
      }

      contextAware.headers.forEach((value, key) => response.headers.set(key, value));
      response.headers.set('X-Praxis-Context-Health-State', promptHealth.state);

      return withFirewall({
        req,
        response,
        user,
        situationId,
        toolId,
        toolRunId,
      });
    });
}

function orgIdOf(user: AuthenticatedUser): string | null {
  return (user as AuthenticatedUser & { orgId?: string }).orgId ?? null;
}
