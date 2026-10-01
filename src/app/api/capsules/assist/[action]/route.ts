import { NextResponse } from 'next/server';
import { z } from 'zod';

import { saveToolOutput } from '@/lib/api/save-tool-output';
import { withAuth } from '@/lib/api/with-auth';
import { AI_REQUEST_LIMITS } from '@/lib/api/ai-request-limits';
import { BoundedJsonError, readBoundedJson } from '@/lib/api/bounded-json';
import { handleRouteError } from '@/lib/api/standard-error';
import { assertDocumentOwnerWritable, DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';
import { createCapsuleArchitectReviewCards } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

const ACTIONS = ['persona', 'output-schema', 'sources', 'few-shot', 'architect'] as const;
type AssistAction = typeof ACTIONS[number];

const ArchitectDocumentSchema = z.object({
  documentId: z.string().max(180).optional(),
  title: z.string().max(240).optional(),
  mimeType: z.string().max(160).optional(),
  originalUri: z.string().max(1000).optional(),
  url: z.string().max(1000).optional(),
  publisher: z.string().max(240).optional(),
  date: z.string().max(80).optional(),
  text: z.string().max(16000).optional(),
  page: z.number().int().positive().optional(),
  reliabilityTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

const ArchitectElicitationSchema = z.object({
  redLines: z.array(z.string().max(600)).max(20).optional(),
  constraints: z.array(z.string().max(600)).max(20).optional(),
  approvalPolitics: z.array(z.string().max(600)).max(20).optional(),
  heuristics: z.array(z.string().max(600)).max(20).optional(),
  stakeholderSensitivities: z.array(z.string().max(600)).max(20).optional(),
  decisionHorizon: z.string().max(240).optional(),
  validFrom: z.string().max(80).optional(),
  validUntil: z.string().max(80).optional(),
  causalDrivers: z.array(z.string().max(600)).max(20).optional(),
}).partial();

const AssistRequestSchema = z.object({
  job: z.string().min(1).max(4000),
  domain: z.string().min(1).max(120).default('generic'),
  outputFormat: z.enum(['json', 'markdown', 'report', 'brief']).default('brief'),
  capsule: z.record(z.string(), z.unknown()).optional(),
  situationId: z.string().max(160).optional(),
  capsuleId: z.string().max(180).optional(),
  documents: z.array(ArchitectDocumentSchema).max(20).optional(),
  elicitation: ArchitectElicitationSchema.optional(),
  normalizedAt: z.string().max(80).optional(),
});

// These actions compile supplied material and fixed templates without a model.
// Authentication, owner state, minute throttling and payload limits still apply;
// funded AI calibration belongs only to actual provider-backed analysis routes.
export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sign in to prepare private capsule proposals.' }, { status: 403 });
    const action = new URL(request.url).pathname.split('/').filter(Boolean).pop() ?? '';
    if (!isAssistAction(action)) {
      return NextResponse.json({ error: 'Unknown capsule assist action' }, { status: 404 });
    }

    const parsed = AssistRequestSchema.safeParse(await readBoundedJson(request, AI_REQUEST_LIMITS));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule assist request', details: parsed.error.flatten() }, { status: 400 });
    }

    await assertDocumentOwnerWritable(user.uid);
    const result = action === 'architect'
      ? await buildArchitectResult(user.uid, parsed.data)
      : buildAssistPatch(action, parsed.data);
    await saveToolOutput({
      uid: user.uid,
      situationId: parsed.data.situationId,
      toolId: `capsule-builder-${action}`,
      profileVersion: 0,
      // Architect proposals already live in the canonical review-card store.
      // A receipt must not duplicate passages/graphs or expand past 1 MiB.
      output: 'capsule' in result ? {
        summary: result.summary,
        reviewRequired: result.reviewRequired,
        capsuleId: result.capsule.capsuleId,
        capsuleVersion: result.capsule.version,
        reviewCardIds: result.cards.map((card) => card.reviewCardId),
        counts: { documents: parsed.data.documents?.length ?? 0, reviewCards: result.cards.length },
      } : result,
      metadata: {
        capsuleAssistAction: action,
        capsuleBuilder: true,
        executionKind: 'deterministic-context-preparation',
        modelExecution: false,
      },
      toolRunId: null,
      requireWritableOwner: true,
    });

    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof BoundedJsonError || error instanceof DocumentOwnerUnavailableError) {
      return NextResponse.json({ error: error.message, code: error.code }, {
        status: error.status, headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    return handleRouteError(error, 'capsules/assist');
  }
});

function isAssistAction(value: string): value is AssistAction {
  return (ACTIONS as readonly string[]).includes(value);
}

function buildAssistPatch(action: AssistAction, input: z.infer<typeof AssistRequestSchema>) {
  if (action === 'persona') {
    return {
      summary: 'Persona and framework suggestions applied.',
      patch: {
        persona: {
          systemFrame: `Act as a senior policy analyst for ${input.domain}. ${input.job} Separate facts, inferences, options, risks, and open evidence gaps.`,
          domain: input.domain,
          frameworks: inferFrameworks(input.job, input.domain),
        },
        market: {
          category: input.domain,
          tags: inferTags(input.job),
        },
      },
    };
  }

  if (action === 'output-schema') {
    return {
      summary: 'Output schema tightened for citable policy work.',
      patch: {
        output: {
          format: input.outputFormat,
          responseJsonSchema: {
            type: 'object',
            properties: {
              judgment: { type: 'string' },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              evidence: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    claim: { type: 'string' },
                    sourceIds: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['claim', 'sourceIds'],
                },
              },
              risks: { type: 'array', items: { type: 'string' } },
              options: { type: 'array', items: { type: 'string' } },
              openQuestions: { type: 'array', items: { type: 'string' } },
            },
            required: ['judgment', 'confidence', 'evidence', 'openQuestions'],
          },
          propertyOrdering: ['judgment', 'confidence', 'evidence', 'risks', 'options', 'openQuestions'],
        },
      },
    };
  }

  if (action === 'sources') {
    return {
      summary: 'Source posture suggestions applied.',
      patch: {
        sourcing: {
          mode: 'hybrid',
          minSourcesPerClaim: 2,
          requiredSourceTypes: ['official', 'expert-analysis', 'primary-document'],
          allowedDomains: inferDomains(input.domain),
          recencyWindowDays: 90,
          citationStyle: 'inline',
        },
        retrieval: {
          mode: 'hybrid',
          graphExpansionDepth: 2,
          topK: 12,
          trustRank: 'strict',
        },
        guardrails: {
          citationRequired: true,
          maxUngroundedClaims: 0,
        },
      },
    };
  }

  return {
    summary: 'Few-shot examples generated.',
    patch: {
      persona: {
        fewShot: [
          {
            id: 'builder-example-1',
            input: 'What changed in the last week and what remains uncertain?',
            output: 'A brief with judgment, cited evidence, options, and open questions.',
            notes: 'Demonstrates bounded confidence and sourceability.',
            version: '1.0.0',
          },
          {
            id: 'builder-example-2',
            input: 'Which option is most defensible given current evidence?',
            output: 'An options comparison that separates sourced claims from assumptions.',
            notes: 'Shows the desired review posture for policy teams.',
            version: '1.0.0',
          },
        ],
      },
    },
  };
}

async function buildArchitectResult(uid: string, input: z.infer<typeof AssistRequestSchema>) {
  const result = await createCapsuleArchitectReviewCards(uid, {
    capsuleId: input.capsuleId ?? (typeof input.capsule?.id === 'string' ? input.capsule.id : undefined),
    jobPrompt: input.job,
    situationId: input.situationId,
    domainId: input.domain,
    documents: input.documents ?? [],
    elicitation: input.elicitation,
    normalizedAt: input.normalizedAt,
  });
  return {
    summary: `Capsule Architect created ${result.cards.length} human-gated review card(s).`,
    reviewRequired: result.reviewRequired,
    capsule: result.capsule,
    cards: result.cards,
    proposal: result.proposal,
    patch: {
      ontologyBinding: result.proposal.ontologyBinding,
      temporality: result.proposal.temporality,
      causality: result.proposal.causality,
      embeddedGraph: result.proposal.embeddedGraph,
      sourcing: {
        mode: 'hybrid',
        minSourcesPerClaim: 2,
        requiredSourceTypes: ['uploaded-document', 'primary-document'],
        citationStyle: 'inline',
      },
      retrieval: {
        mode: 'hybrid',
        graphExpansionDepth: 2,
        topK: 12,
        trustRank: 'strict',
      },
    },
  };
}

function inferFrameworks(job: string, domain: string): string[] {
  const text = `${job} ${domain}`.toLowerCase();
  const frameworks = new Set<string>(['ach']);
  if (text.includes('mediation') || text.includes('negotiation')) frameworks.add('zartman-ripeness');
  if (text.includes('stakeholder') || text.includes('actor')) frameworks.add('stakeholder-salience');
  if (text.includes('humanitarian')) frameworks.add('ocha-humanitarian-access');
  if (text.includes('sanction')) frameworks.add('sanctions-impact-chain');
  return Array.from(frameworks);
}

function inferTags(job: string): string[] {
  return Array.from(new Set(job.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 4))).slice(0, 6);
}

function inferDomains(domain: string): string[] {
  if (domain === 'humanitarian') return ['reliefweb.int', 'unocha.org', 'unhcr.org'];
  if (domain === 'economic-sanctions') return ['home.treasury.gov', 'eur-lex.europa.eu', 'un.org'];
  if (domain === 'diplomacy-negotiation') return ['un.org', 'osce.org', 'peaceagreements.org'];
  return ['un.org', 'worldbank.org', 'oecd.org'];
}
