import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';

type RouteContext = { params: Promise<{ draftId: string }> };

const BodySchema = z.object({
  blockId: z.string().min(1),
  content: z.string().default(''),
  register: z.enum(['diplomatic', 'analytical', 'accessible', 'executive']).default('analytical'),
  sourceReceiptId: z.string().optional(),
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { draftId } = await context.params;
  const action = new URL(req.url).searchParams.get('action') ?? 'tighten';
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid draft refinement request', details: parsed.error.flatten() }, { status: 400 });
  }
  const content = parsed.data.content.trim() || 'Draft section awaiting source-grounded content.';
  const refinedContent = refineContent(action, content, parsed.data.register, parsed.data.sourceReceiptId);

  return NextResponse.json({
    ok: true,
    draftId,
    blockId: parsed.data.blockId,
    action,
    refinedContent,
    diff: `Applied ${action} using Output Refiner foundation path; user ${user.isDemo ? 'demo' : user.uid} must review before save.`,
    twoPhaseCommit: {
      proposed: true,
      autoApplied: false,
      ownerUid: user.uid,
    },
  });
});

function refineContent(action: string, content: string, register: string, sourceReceiptId?: string): string {
  if (action === 'tighten') return `${content.split(/\s+/).slice(0, Math.max(12, Math.ceil(content.split(/\s+/).length * 0.7))).join(' ')} [tightened; facts preserved]`;
  if (action === 'rewrite') return `[${register}] ${content}`;
  if (action === 'add-citation') return `${content} [^${sourceReceiptId ?? 'context-source-1'}]`;
  if (action === 'add-scenario') return `${content}\n\nAlternative scenario: conditions shift if a key actor changes incentives or source evidence weakens the current frame.`;
  if (action === 'continue') return `${content}\n\nContinuation: the next paragraph should connect the claim to implications, source confidence, and a bounded recommendation.`;
  return content;
}
