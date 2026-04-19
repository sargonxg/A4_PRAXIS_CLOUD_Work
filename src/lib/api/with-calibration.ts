import { withAuth, type AuthenticatedUser } from './with-auth';
import { checkAndDeductCreditsForUid } from './with-credits';
import { buildCalibratedContext, type ContextBlock } from '@/lib/context/profile-context';

export interface CalibrationCtx extends AuthenticatedUser {
  calibration: ContextBlock;
}

export type CalibratedHandler = (req: Request, ctx: CalibrationCtx) => Promise<Response>;

/**
 * Wraps a route handler with auth → credits → calibration context injection.
 *
 * Usage: `withCalibration(toolId, creditOpType)(handler)`
 *
 * @param toolId        canonical tool id (matches tool-registry)
 * @param creditOpType  key into AI_CREDIT_COSTS (e.g. 'ai_risk_assessment')
 * @param opts.retrievalQuery  optional fn that extracts a retrieval query from the request + body,
 *                             triggering SKC retrieval via buildCalibratedContext
 */
export function withCalibration(
  toolId: string,
  creditOpType: string,
  opts: { retrievalQuery?: (req: Request, body: Record<string, unknown>) => string | undefined } = {},
) {
  return (handler: CalibratedHandler) =>
    withAuth(async (req: Request, user: AuthenticatedUser) => {
      // Parse body — non-JSON bodies are fine; we just skip extraction
      let body: Record<string, unknown> = {};
      let situationId: string | undefined;
      try {
        const raw = await req.clone().text();
        if (raw) body = JSON.parse(raw) as Record<string, unknown>;
        if (typeof body.situationId === 'string') situationId = body.situationId;
      } catch { /* non-JSON body OK — proceed with empty body */ }

      // Demo users bypass credit deduction but still receive calibration context
      if (!user.isDemo) {
        const gate = await checkAndDeductCreditsForUid(
          user.uid,
          creditOpType,
          `tool:${toolId}`,
        );
        if (!gate.allowed) return gate.response;
      }

      const retrievalQuery = opts.retrievalQuery?.(req, body);

      const calibration = await buildCalibratedContext({
        uid: user.uid,
        situationId,
        toolId,
        retrievalQuery,
      });

      return handler(req, { ...user, calibration });
    });
}
