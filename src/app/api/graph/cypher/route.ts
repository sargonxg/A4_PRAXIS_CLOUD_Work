import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { validateReadOnlyCypher, tenantScopeCypher } from '@/lib/graph/cypher';

export const POST = withAuth(async (req: Request, user) => {
  const body = (await req.json().catch(() => ({}))) as { cypher?: string; params?: Record<string, unknown> };
  const cypher = body.cypher ?? '';
  const validation = validateReadOnlyCypher(cypher);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error ?? 'Read-only Cypher rejected.' }, { status: 400 });
  }

  return NextResponse.json({
    columns: ['query', 'params', 'mode'],
    rows: [
      {
        query: tenantScopeCypher(cypher),
        params: { ...(body.params ?? {}), tenantId: user.uid },
        mode: 'validated-read-only',
      },
    ],
    validation: 'Accepted by read-only validator; production execution is tenant-scoped server-side.',
  });
});
