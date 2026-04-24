import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { getAdvisor, saveAdvisor } from '@/lib/firebase/advisor-service';
import { AdvisorConfigSchema, ADVISOR_IDS, type AdvisorId } from '@/types/advisor';

function isAdvisorId(id: string): id is AdvisorId {
  return (ADVISOR_IDS as readonly string[]).includes(id);
}

export const GET = withAuth(async (_req, _user, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  if (!isAdvisorId(id)) {
    return NextResponse.json({ error: 'unknown advisor id' }, { status: 400 });
  }
  const cfg = await getAdvisor(id);
  if (!cfg) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(cfg);
});

export const POST = withAuth(async (req, user, context: { params: Promise<{ id: string }> }) => {
  const denied = requireAdmin(user.uid);
  if (denied) return denied;

  const { id } = await context.params;
  if (!isAdvisorId(id)) {
    return NextResponse.json({ error: 'unknown advisor id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const candidate = { ...(body as Record<string, unknown>), id };
  const parsed = AdvisorConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid advisor config', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const saved = await saveAdvisor(parsed.data);
  return NextResponse.json(saved);
});
