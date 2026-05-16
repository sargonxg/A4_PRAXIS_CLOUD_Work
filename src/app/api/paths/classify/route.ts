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
      policyPathId: 'generic-policy',
      confidence: 0,
      rationale: 'Demo users do not classify persistent ContextCapsule paths.',
      suggestedUserCore: {
        role: 'Generic policy worker',
        audience: 'Policy team',
        workingStyle: 'Use demo context only; copy a capsule before saving persistent defaults.',
        evidencePosture: 'Do not treat demo material as user-owned evidence.',
      },
      suggestedSituationCore: {
        problemFrame: 'Sample mode does not create a persistent situation core.',
        actors: [],
        geography: null,
        decisionContext: 'Copy or create a user-owned capsule before using path defaults.',
        timeHorizon: 'Demo session',
      },
      suggestedTools: [],
      suggestedOutputs: [],
      missingInformationQuestions: ['What user-owned policy problem should PRAXIS classify after sign-in?'],
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
