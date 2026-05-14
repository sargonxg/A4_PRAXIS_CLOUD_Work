import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { classifyPathFlow } from '@/lib/genkit/flows/classify-path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  domainId: z.string().max(120).optional(),
  name: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  seedText: z.string().max(6000).optional(),
  sourceUrls: z.array(z.string().max(500)).max(16).default([]),
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({
      pathId: null,
      confidence: 0,
      rationale: 'Demo users do not classify persistent Path Cores.',
      alternates: [],
    });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const result = await classifyPathFlow({
    domainId: parsed.data.domainId,
    name: parsed.data.name,
    description: parsed.data.seedText ?? parsed.data.description,
    sourceUrls: parsed.data.sourceUrls,
  });

  return NextResponse.json(result);
});
