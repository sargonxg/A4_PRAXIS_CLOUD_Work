import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { recommendTools } from '@/lib/tools/recommend';

const RecommendSchema = z.object({
  attached: z.object({
    user: z.boolean().default(false),
    situation: z.boolean().default(false),
    path: z.boolean().default(false),
    source: z.boolean().default(false),
    document: z.boolean().default(false),
    graph: z.boolean().default(false),
    time: z.boolean().default(false),
    tool: z.boolean().default(false),
    objective: z.boolean().default(false),
    product: z.boolean().default(false),
    output: z.boolean().default(false),
    memory: z.boolean().default(false),
  }),
  situationStage: z.string().optional().default('intake'),
  recentToolIds: z.array(z.string()).optional().default([]),
});

export const POST = withAuth(async (request) => {
  const parsed = RecommendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid recommendation request', details: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ tools: recommendTools(parsed.data) });
});
