import { NextResponse, type NextRequest } from 'next/server';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import {
  getSituationAdmin,
  updateSituationAdmin,
  deleteSituationAdmin,
} from '@/lib/firebase/situations';
import type { Situation } from '@/types/situation';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';

type RouteContext = { params: Promise<{ id: string }> };

function rejectDemo(user: AuthenticatedUser) {
  if (user.isDemo) {
    return NextResponse.json(
      { error: 'Not available for this session' },
      { status: 403 }
    );
  }
  return null;
}

export function GET(_req: NextRequest, ctx: RouteContext) {
  return withAuth(async (_r, user) => {
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    const situation = await getSituationAdmin(user.uid, id);
    if (!situation) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }
    return NextResponse.json({ situation });
  })(_req);
}

// Fields the client is allowed to PATCH directly. New preference fields
// (languageOverride, dateRangeFrom, dateRangeTo, sourceCategoriesEnabled)
// are accepted without strict schema validation — they default gracefully
// server- and client-side, so open pass-through is safe.
const PATCHABLE_FIELDS: ReadonlyArray<keyof Situation> = [
  'name',
  'type',
  'region',
  'description',
  'userRole',
  'status',
  'actors',
  'sourceUrls',
  'contextNotes',
  'tags',
  'domain',
  'domainConfidence',
  'domainOverriddenByUser',
  'domainVersion',
  'domainClassifiedAt',
  'languageOverride',
  'dateRangeFrom',
  'dateRangeTo',
  'sourceCategoriesEnabled',
  'riskScore',
  'glaslStage',
  'escalationTrend',
] as const;

function sanitizePatch(body: unknown): Partial<Situation> {
  if (!body || typeof body !== 'object') return {};
  const src = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of PATCHABLE_FIELDS) {
    if (key in src) out[key as string] = src[key as string];
  }
  return out as Partial<Situation>;
}

export function PATCH(req: NextRequest, ctx: RouteContext) {
  return withAuth(async (r, user) => {
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    const body = await r.json().catch(() => ({}));
    const patch = sanitizePatch(body);
    await updateSituationAdmin(user.uid, id, patch);
    return NextResponse.json({ success: true });
  })(req);
}

export function DELETE(_req: NextRequest, ctx: RouteContext) {
  return withAuth(async (_r, user) => {
    const startedAt = Date.now();
    const demoErr = rejectDemo(user);
    if (demoErr) return demoErr;

    const { id } = await ctx.params;
    try {
      await deleteSituationAdmin(user.uid, id);
      await emitTelemetrySafe({
        eventName: 'case.delete',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: id,
        route: `/api/situations/${id}`,
        status: 'ok',
        latencyMs: Date.now() - startedAt,
        details: {},
      });
    } catch (err) {
      await emitTelemetrySafe({
        eventName: 'case.delete',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: id,
        route: `/api/situations/${id}`,
        status: 'fail',
        latencyMs: Date.now() - startedAt,
        details: { message: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240) },
      });
      throw err;
    }
    return NextResponse.json({ success: true });
  })(_req);
}

function orgIdOf(user: AuthenticatedUser & { orgId?: string }): string | null {
  return user.orgId ?? null;
}
