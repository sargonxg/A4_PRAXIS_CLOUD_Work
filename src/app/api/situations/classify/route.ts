import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { classifyDomainAndPath } from '@/lib/domain/classifier';
import { classifyCaseTypeSignals } from '@/lib/ontology/case-types';
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
      domain: { domainId: 'generic', confidence: 0, rationale: 'Demo users do not persist situations.', alternatives: [] },
      path: { pathId: null, confidence: 0, rationale: 'Demo users do not persist situations.', alternatives: [] },
      confidence: 0,
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
    /* classifier handles missing profile */
  }

  const result = await classifyDomainAndPath({
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
  const caseType = classifyCaseTypeSignals({
    name: parsed.data.name,
    description: parsed.data.description,
    sourceUrls: parsed.data.sourceUrls,
    role: parsed.data.userRole,
  });

  return NextResponse.json({
    domain: {
      domainId: result.domainId,
      confidence: result.confidence,
      rationale: result.rationale,
      alternatives: result.alternatives,
    },
    path: {
      pathId: result.pathId,
      confidence: result.pathConfidence,
      rationale: result.pathRationale,
      alternatives: result.pathAlternatives,
    },
    confidence: Math.min(result.confidence, result.pathConfidence || result.confidence),
    ontologyId: ontology.ontologyId,
    ontologyIds: ontology.ontologyIds,
    primaryOntologyId: ontology.primaryOntologyId,
    ontologyConfidence: ontology.confidence,
    ontologyRationale: ontology.rationale,
    caseType: caseType.caseType,
    caseTypeSecondary: caseType.caseTypeSecondary,
    caseTypeConfidence: caseType.confidence,
    caseTypeRationale: caseType.rationale,
  });
});
