import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getSituationAdmin, updateSituationAdmin } from '@/lib/firebase/situations';

type RouteContext = { params: Promise<{ id: string; kind: string }> };

const CoreKindSchema = z.enum(['user', 'situation', 'time', 'office', 'source', 'output']);
const BodySchema = z.object({
  content: z.string().min(3).max(5000),
  source: z.string().max(80).default('ask-praxis'),
});

export function POST(req: NextRequest, ctx: RouteContext) {
  return withAuth(async (request, user) => {
    const { id, kind } = await ctx.params;
    const coreKind = CoreKindSchema.safeParse(kind);
    if (!coreKind.success) return NextResponse.json({ error: 'Invalid core kind' }, { status: 400 });

    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid core attachment', details: parsed.error.flatten() }, { status: 400 });
    }
    if (user.isDemo) {
      return NextResponse.json({ success: true, mode: 'demo-local', coreKind: coreKind.data });
    }

    const situation = await getSituationAdmin(user.uid, id);
    if (!situation) return NextResponse.json({ error: 'Situation not found' }, { status: 404 });

    const stamp = new Date().toISOString();
    const label = coreKind.data.charAt(0).toUpperCase() + coreKind.data.slice(1);
    const entry = `\n\n[${label} Core attachment · ${parsed.data.source} · ${stamp}]\n${parsed.data.content}`;
    await updateSituationAdmin(user.uid, id, {
      contextNotes: `${situation.contextNotes ?? ''}${entry}`.trim(),
    });
    return NextResponse.json({ success: true, coreKind: coreKind.data });
  })(req);
}
