import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { CANONICAL_PERSONAS } from '@/lib/boardroom/personas';
import { buildCustomPersonaSpec, listCustomPersonaSpecs, saveCustomPersonaSpec } from '@/lib/boardroom/custom-personas-store';

export const dynamic = 'force-dynamic';

const DraftSchema = z.object({
  displayName: z.string().min(3).max(80),
  shortRole: z.string().min(3).max(60),
  professionalProfile: z.string().min(40).max(2000),
  domains: z.array(z.string().min(1)).default([]),
  frameworks: z.array(z.string().min(1)).default([]),
  signatureQuestions: z.array(z.string().min(1)).default([]),
  blindSpots: z.array(z.string().min(1)).default([]),
  toolIds: z.array(z.string().min(1)).default([]),
  corpusEntries: z.array(z.object({
    title: z.string().min(1),
    citation: z.string().min(1),
    license: z.string().min(1),
  })).default([]),
  voiceRegister: z.enum(['formal', 'professional', 'plainspoken']).default('professional'),
});

export const GET = withAuth(async (_request, user) => {
  try {
    const custom = user.isDemo ? [] : await listCustomPersonaSpecs(user.uid);
    return NextResponse.json({
      canonical: CANONICAL_PERSONAS,
      custom,
      limits: { customPersonas: 10, corpusDocuments: 50, corpusMegabytes: 50 },
    });
  } catch (err) {
    return handleRouteError(err, 'boardroom/personas/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const parsed = DraftSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid custom persona', details: parsed.error.flatten() }, { status: 400 });
    }

    if (user.isDemo) {
      return NextResponse.json({
        persona: buildCustomPersonaSpec(parsed.data),
        persistence: { persisted: false, reason: 'demo_mode' },
      }, { status: 201 });
    }

    const persona = await saveCustomPersonaSpec(user.uid, parsed.data);
    return NextResponse.json({
      persona,
      persistence: { persisted: true, collection: 'users/{uid}/workspace/personas/items' },
    }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'boardroom/personas/create');
  }
});
