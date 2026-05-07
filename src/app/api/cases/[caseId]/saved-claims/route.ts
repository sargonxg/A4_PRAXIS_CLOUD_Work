import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { createSavedClaim, listSavedClaims } from '@/lib/workbench/saved-claims-store';

type RouteContext = { params: Promise<{ caseId: string }> };

const CreateSavedClaimSchema = z.object({
  text: z.string().min(8).max(4000),
  title: z.string().max(160).optional(),
  sourceRef: z.string().max(500).optional(),
  trustScore: z.number().min(0).max(100).optional(),
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  const { caseId } = await context.params;
  if (user.isDemo) return NextResponse.json({ claims: [] });
  const claims = await listSavedClaims(user.uid, caseId);
  return NextResponse.json({ claims });
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const { caseId } = await context.params;
  const parsed = CreateSavedClaimSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid saved claim', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo cases cannot persist saved claims.' }, { status: 403 });
  }
  const claim = await createSavedClaim({ uid: user.uid, caseId, ...parsed.data });
  return NextResponse.json({ claim }, { status: 201 });
});

