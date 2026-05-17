import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/compat/sample-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  DIPLOMATIC_DRAFTING_PLAYBOOK,
  DraftingAuditSchema,
  buildDiplomaticDraftingContext,
  buildDraftingEvidencePrompt,
  diplomaticSituationRequestFields,
  resolveSituationFromRequest,
  sourceAuditPrompt,
} from '@/lib/ai/diplomatic-drafting-service';

export const maxDuration = 60;

const PolicyOptionSchema = z.object({
  option: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
  resourceImplications: z.string(),
  // Advanced fields preserve the deeper analytical frame for exports/reuse.
  levelOneAnalysis: z.string().optional(),
  levelTwoAnalysis: z.string().optional(),
  winSet: z.string().optional(),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }).optional(),
  feasibility: z.number().min(1).max(5).optional(),
  risk: z.number().min(1).max(5).optional(),
  timeline: z.string().optional(),
  requiredResources: z.array(z.string()).optional(),
  keyActors: z.array(z.string()).optional(),
  historicalPrecedent: z.string().optional(),
});

const PolicyMemoSchema = z.object({
  classification: z.string(),
  to: z.string(),
  from: z.string(),
  subject: z.string(),
  title: z.string(),
  executiveSummary: z.string(),
  problemStatement: z.string(),
  contextAndBackground: z.string(),
  situationAssessment: z.string(),
  policyOptions: z.array(PolicyOptionSchema).min(3).max(4),
  options: z.array(PolicyOptionSchema).min(3).max(4),
  recommendation: z.string(),
  recommendedOption: z.string(),
  implementationRoadmap: z.string(),
  implementationSteps: z.array(z.string()),
  monitoringIndicators: z.array(z.string()),
  risks: z.string(),
  citations: z.array(z.string()),
  draftingAudit: DraftingAuditSchema,
});

const DEMO_RESPONSE = {
  title: 'Policy Options for the User Workspace',
  executiveSummary: 'Three policy options are available, ranging from immediate ceasefire facilitation to phased autonomy negotiations. Option 2 (Structured Autonomy Framework) is recommended as the most feasible given current domestic and international constraints.',
  situationAssessment: 'The the selected situation conflict is at Glasl Stage 5, with both parties entrenched but back-channels functional. The mutually hurting stalemate creates a narrow ripeness window.',
  options: [
    {
      title: 'Option 1: Emergency Ceasefire + Confidence-Building Measures',
      description: 'Immediate ceasefire mediated by SRSG with a 90-day CBM implementation plan.',
      levelOneAnalysis: 'Both parties have signaled openness to a ceasefire framework. Karovia and Westmark would likely support.',
      levelTwoAnalysis: 'GoN faces domestic pressure to show security gains before elections. DRM hardliners may reject without autonomy commitments.',
      winSet: 'Narrow but viable — a 90-day humanitarian corridor provision could satisfy both Level I and Level II constraints.',
      swot: {
        strengths: ['Fast to implement', 'Humanitarian relief immediate'],
        weaknesses: ['Does not address root causes', 'High violation risk'],
        opportunities: ['AU summit in 6 weeks creates momentum'],
        threats: ['DRM hardliners may spoil', 'GoN elections in 4 months'],
      },
      feasibility: 4,
      risk: 3,
      timeline: '30-45 days',
      requiredResources: ['UNMN observer expansion', 'AU mediation team'],
      keyActors: ['SRSG Santos', 'AU Commission', 'GoN Defense Ministry'],
    },
  ],
  recommendedOption: 'Option 2: Structured Autonomy Framework',
  implementationRoadmap: 'Phase 1 (0-30 days): Ceasefire. Phase 2 (30-90 days): Technical working groups. Phase 3 (90-180 days): Framework agreement.',
  risks: 'Primary risks are spoiler action by DRM hardliners, GoN election dynamics, and external patron escalation if the autonomy track is framed as a concession rather than a stabilization framework.',
  citations: ['expert conflict analysis Report #347', 'UNMN Quarterly Assessment Q1 2026'],
  classification: 'UNCLASSIFIED // POLICY PLANNING',
  to: 'Senior Policy Principals',
  from: 'PRAXIS Policy Cell',
  subject: 'Policy Options for the User Workspace',
  problemStatement: 'The ceasefire framework is deteriorating while the political process remains formally open.',
  contextAndBackground: 'the selected situation remains in a fragile conflict environment with contested legitimacy, external patronage, and humanitarian access constraints.',
  policyOptions: [
    {
      option: 'Emergency Ceasefire + Confidence-Building Measures',
      pros: ['Fast to implement', 'Humanitarian relief immediate'],
      cons: ['Does not address root causes', 'High violation risk'],
      riskLevel: 'medium' as const,
      resourceImplications: 'Requires UNMN observer expansion and AU mediation bandwidth.',
    },
    {
      option: 'Structured Autonomy Framework',
      pros: ['Addresses political drivers', 'Creates negotiating substance'],
      cons: ['Domestic ratification risk', 'Hardliners may resist'],
      riskLevel: 'medium' as const,
      resourceImplications: 'Requires technical constitutional expertise and sustained shuttle diplomacy.',
    },
    {
      option: 'Sanctions-backed Compliance Track',
      pros: ['Raises cost of obstruction', 'Signals Council seriousness'],
      cons: ['May harden positions', 'P5 unity risk'],
      riskLevel: 'high' as const,
      resourceImplications: 'Requires Panel of Experts evidence package and sanctions committee alignment.',
    },
  ],
  recommendation: 'Pursue the Structured Autonomy Framework while using ceasefire and humanitarian measures as immediate confidence-building steps.',
  implementationSteps: ['Secure AU/UN technical mandate', 'Convene working groups', 'Link humanitarian access to visible political progress'],
  monitoringIndicators: ['Ceasefire violations', 'Humanitarian access approvals', 'Participation in AU roadmap sessions'],
  draftingAudit: {
    artifactMode: 'policy-memo' as const,
    sourceUse: [{ source: 'demo situation record', claim: 'the selected situation policy options and ceasefire risks', confidence: 'medium' as const }],
    confidenceNote: 'Medium confidence because this is synthetic demo data.',
    limits: ['No live source verification in this session'],
    followUpResearch: ['Verify current UNSC posture', 'Update humanitarian access figures'],
  },
};

export const POST = withCalibration('policy_memo', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const q = typeof body.policyQuestion === 'string' ? body.policyQuestion : '';
    return [s?.name, s?.region, q].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      ...diplomaticSituationRequestFields,
      policyQuestion: z.string().optional(),
      audience: z.string().optional().default('senior policymakers'),
      directContext: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { policyQuestion, audience, directContext } = validation.data;
    const { situation, situationId } = await resolveSituationFromRequest({
      uid: ctx.uid,
      situation: validation.data.situation,
      situationData: validation.data.situationData,
      situationId: validation.data.situationId,
    });

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);

    // Credits + profile gate already handled by withCalibration above.

    const draftContext = await buildDiplomaticDraftingContext({
      ctx,
      situation,
      situationId,
      toolId: 'policy_memo',
      webPurpose: 'policy-memo',
    });
    const evidencePrompt = buildDraftingEvidencePrompt({ ...draftContext, directContext });
    const { provenance } = ctx.calibration;

    const result = await callProModel({
      output: Output.object({ schema: PolicyMemoSchema }),
      system: `You are a senior policy advisor specializing in conflict resolution, diplomatic strategy, legal-political constraints, and elite policy writing.

${DIPLOMATIC_DRAFTING_PLAYBOOK}

GROUNDING MANDATE: Web intelligence and saved situation context below are your PRIMARY source of truth. Flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient.

${draftContext.systemCalibration}`,
      prompt: `${evidencePrompt}
${policyQuestion ? `POLICY QUESTION: ${policyQuestion}` : ''}
AUDIENCE: ${audience}

## POLICY MEMO OUTPUT CONTRACT

Produce a complete policy memorandum object that the frontend can render directly.

Required memo fields:
- classification: one concise marking such as "UNCLASSIFIED // POLICY PLANNING" unless the context requires a different non-sensitive marking.
- to/from/subject: realistic internal memo header fields.
- executiveSummary: BLUF paragraph.
- problemStatement: the policy problem in one paragraph.
- contextAndBackground: facts, actor context, constraints, and evidence limits.
- situationAssessment: analytic judgement, not a repeat of background.
- policyOptions/options: same 3-4 options in both fields for compatibility.
- recommendation/recommendedOption: same recommended course in prose and short title.
- implementationRoadmap plus implementationSteps.
- monitoringIndicators.
- risks: one readable paragraph.
- citations: compact source labels or "situation record"/"web context" references; do not invent exact document numbers.

For each policy option, include:
- option, pros, cons, riskLevel, resourceImplications.
- Putnam Level I analysis, Level II analysis, and win-set.
- SWOT, feasibility, risk, timeline, requiredResources, keyActors, and historicalPrecedent where evidence supports it.

## PUTNAM TWO-LEVEL GAME FRAMEWORK

Analyze Level I international bargaining space, Level II domestic/organizational ratification constraints, and the win-set overlap for each option.

${sourceAuditPrompt('policy-memo')}

## REQUIREMENTS
- Generate 3-4 distinct policy options (not variations of the same option)
- Each option must have a full SWOT analysis
- Historical precedents from web research for each option
- Feasibility (1-5) and Risk (1-5) ratings
- Recommended option with justification
- Implementation roadmap with phases
- Use ICD 203 probability language for risk assessments`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'policy_memo', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'policy_memo',
        profileVersion: provenance.profileVersion,
        toolRunId: ctx.toolRunId,
        output: result.output as Record<string, unknown>,
        metadata: {
          artifactMode: 'policy-memo',
          audience,
          policyQuestion: policyQuestion ?? null,
          sourceReceipts: (result.output as { draftingAudit?: { sourceUse?: unknown[] } }).draftingAudit?.sourceUse ?? [],
        },
      }).catch((err) => console.warn('[policy_memo] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'policy-memo');
  }
});
