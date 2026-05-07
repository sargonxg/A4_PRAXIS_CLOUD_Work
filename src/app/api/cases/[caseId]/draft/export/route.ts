import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { persistDraftExport } from '@/lib/workbench/draft-export-store';
import { DraftExportSchema } from '@/types/draft-export';

type RouteContext = { params: Promise<{ caseId: string }> };

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const { caseId } = await context.params;
  const parsed = DraftExportSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid draft export package', details: parsed.error.flatten() }, { status: 400 });
  }

  if (user.isDemo) {
    return NextResponse.json({
      ok: true,
      mode: 'demo-not-persisted',
      exportRecord: {
        id: `demo-${caseId}-draft-export`,
        caseId,
        artifactKind: 'draft-briefing-package',
        contentCredentials: {
          requested: parsed.data.embedC2pa,
          signed: false,
          mode: 'c2pa-ready-manifest',
        },
        auditManifest: {
          embedded: parsed.data.embedAuditManifest,
          generatedAt: new Date().toISOString(),
          checksum: 'demo',
        },
      },
    });
  }

  const exportRecord = await persistDraftExport({ uid: user.uid, caseId, exportInput: parsed.data });
  return NextResponse.json({ ok: true, mode: 'persisted', exportRecord }, { status: 201 });
});

