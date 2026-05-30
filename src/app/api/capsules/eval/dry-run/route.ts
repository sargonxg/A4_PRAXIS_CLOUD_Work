import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAuth } from '@/lib/api/with-auth';
import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';
import { runCapsuleDryRunEval } from '@/lib/capsules/dry-run-eval';
import type { ContextCapsule } from '@/types/context-capsule';

const CapsuleEvalClaimSchema = z.object({
  id: z.string().min(1).max(180),
  text: z.string().min(1).max(4000),
  sourceIds: z.array(z.string().min(1).max(180)).max(100).default([]),
});

const CapsuleEvalSampleSchema = z.object({
  prompt: z.string().min(1).max(4000),
  output: z.unknown(),
  claims: z.array(CapsuleEvalClaimSchema).max(100).default([]),
});

const DryRunEvalRequestSchema = z.object({
  capsule: ContextCapsuleSchema,
  samples: z.array(CapsuleEvalSampleSchema).min(1).max(20),
  sourceSnippets: z.array(z.object({
    id: z.string().min(1).max(180),
    text: z.string().min(1).max(8000),
  })).max(200).default([]),
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Capsule eval requires a PRAXIS account' }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = DryRunEvalRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid dry-run eval request', issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json(runCapsuleDryRunEval({
    ...parsed.data,
    capsule: parsed.data.capsule as unknown as ContextCapsule,
  }));
});
