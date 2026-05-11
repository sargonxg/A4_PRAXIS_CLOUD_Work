import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getDraftTemplate } from '@/lib/draft/api';

type RouteContext = { params: Promise<{ draftId: string }> };

const BodySchema = z.object({
  templateId: z.string().min(1),
  caseId: z.string().optional(),
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { draftId } = await context.params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid draft auto-fill request', details: parsed.error.flatten() }, { status: 400 });
  }
  const template = getDraftTemplate(parsed.data.templateId);
  const blocks = template.sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    content: index === 0
      ? `${section.title}: ${template.label} generated from active Context.`
      : `${section.prompt} Citation policy: ${section.citationPolicy}.`,
    citations: section.citationPolicy === 'optional' ? [] : [`context:${parsed.data.caseId ?? 'active'}`],
    reviewRequired: true,
  }));

  return NextResponse.json({
    ok: true,
    draftId,
    templateId: template.id,
    generatedAt: new Date().toISOString(),
    latencyTargetMs: 30000,
    ownerUid: user.uid,
    blocks,
  });
});
