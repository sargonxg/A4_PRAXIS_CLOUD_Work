/**
 * POST /api/situations/classify-domain
 *
 * Used by the situation-creation wizard's Review step to preview the
 * auto-classified domain before the user confirms. Returns the same
 * shape as classifyDomain() — { domainId, confidence, rationale,
 * alternatives[] }.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §7, §10
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { classifyDomain } from '@/lib/domain/classifier';
import { classifyOntologySignals } from '@/lib/ontology/classifier';

const BodySchema = z.object({
  name: z.string().max(300),
  description: z.string().max(4000).default(''),
  sourceUrls: z.array(z.string().url().or(z.string().max(500))).max(16).default([]),
  userRole: z.string().max(80).optional(),
});

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({
      domainId: 'generic',
      confidence: 0,
      rationale: 'Demo users do not persist situations.',
      alternatives: [],
      ontologyId: 'conflict',
      ontologyIds: ['conflict'],
      primaryOntologyId: 'conflict',
      ontologyConfidence: 0,
      ontologyRationale: 'Demo users do not persist situations.',
    });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  let userPrimaryDomain: string | undefined;
  try {
    const profile = await getAnalystProfile(user.uid);
    userPrimaryDomain = profile?.perspective?.primaryDomain;
  } catch {
    /* ignore — classifier handles missing profile */
  }

  const result = await classifyDomain({
    name: parsed.data.name,
    description: parsed.data.description,
    sourceUrls: parsed.data.sourceUrls,
    hints: userPrimaryDomain ? { userPrimaryDomain } : undefined,
  });
  const ontology = classifyOntologySignals({
    name: parsed.data.name,
    description: parsed.data.description,
    sourceUrls: parsed.data.sourceUrls,
    role: parsed.data.userRole,
  });

  return NextResponse.json({
    ...result,
    ontologyId: ontology.ontologyId,
    ontologyIds: ontology.ontologyIds,
    primaryOntologyId: ontology.primaryOntologyId,
    ontologyConfidence: ontology.confidence,
    ontologyRationale: ontology.rationale,
  });
});
