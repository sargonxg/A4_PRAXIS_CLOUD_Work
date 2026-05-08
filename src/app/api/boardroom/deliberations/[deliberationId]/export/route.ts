import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { boardroomExportFilename, renderBoardroomDocxBuffer, renderBoardroomMarkdown } from '@/lib/boardroom/export';
import { buildDemoDeliberation, getDeliberation } from '@/lib/boardroom/store';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ deliberationId: string }> };

const QuerySchema = z.object({
  caseId: z.string().min(1),
  format: z.enum(['docx', 'md']).default('docx'),
});

function parseQuery(request: Request) {
  const url = new URL(request.url);
  return QuerySchema.safeParse({
    caseId: url.searchParams.get('caseId')?.trim(),
    format: url.searchParams.get('format')?.trim() || 'docx',
  });
}

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const parsed = parseQuery(request);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid export request', details: parsed.error.flatten() }, { status: 400 });
    }

    const deliberation = user.isDemo
      ? buildDemoDeliberation({ uid: user.uid, caseId: parsed.data.caseId, id: deliberationId })
      : await getDeliberation(user.uid, parsed.data.caseId, deliberationId);

    if (!deliberation) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });

    if (parsed.data.format === 'md') {
      await emitTelemetrySafe({
        eventName: 'export.boardroom',
        uid: user.uid,
        orgId: orgIdOf(user),
        caseId: parsed.data.caseId,
        route: '/api/boardroom/deliberations/[deliberationId]/export',
        status: 'ok',
        details: {
          deliberationId,
          format: 'md',
          contributionCount: deliberation.contributions.length,
        },
      });
      return new Response(renderBoardroomMarkdown(deliberation), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${boardroomExportFilename(deliberation, 'md')}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const buffer = await renderBoardroomDocxBuffer(deliberation);
    await emitTelemetrySafe({
      eventName: 'export.boardroom',
      uid: user.uid,
      orgId: orgIdOf(user),
      caseId: parsed.data.caseId,
      route: '/api/boardroom/deliberations/[deliberationId]/export',
      status: 'ok',
      details: {
        deliberationId,
        format: 'docx',
        contributionCount: deliberation.contributions.length,
        sizeBytes: buffer.length,
      },
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${boardroomExportFilename(deliberation, 'docx')}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/export');
  }
});

function orgIdOf(user: AuthenticatedUser): string | null {
  return (user as AuthenticatedUser & { orgId?: string }).orgId ?? null;
}
