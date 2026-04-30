import { z } from 'zod';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { getSituationById } from '@/lib/firebase/situations';
import { situationContextSchema } from '@/lib/api/schemas';
import type { CalibrationCtx } from '@/lib/api/with-calibration';
import type { Situation } from '@/types/situation';

export const DiplomaticArtifactModeSchema = z.enum([
  'policy-memo',
  'decision-memo',
  'diplomatic-cable',
  'legal-brief',
  'non-paper',
  'demarche',
  'communique',
  'security-council-resolution',
  'presidential-statement',
  'talking-points',
]);

export type DiplomaticArtifactMode = z.infer<typeof DiplomaticArtifactModeSchema>;

export const diplomaticSituationRequestFields = {
  situationId: z.string().min(1).optional(),
  situation: situationContextSchema.optional(),
  situationData: situationContextSchema.optional(),
};

export const SourceUseSchema = z.object({
  source: z.string(),
  claim: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const DraftingAuditSchema = z.object({
  artifactMode: DiplomaticArtifactModeSchema,
  sourceUse: z.array(SourceUseSchema),
  confidenceNote: z.string(),
  limits: z.array(z.string()),
  followUpResearch: z.array(z.string()),
});

export const DIPLOMATIC_DRAFTING_PLAYBOOK = `## PRAXIS Diplomatic Drafting Contract

You are producing a durable policy artifact, not a casual answer.

Artifact rules:
- Be specific to the situation, actors, constraints, evidence, audience, and user's question.
- Use source-grounded claims where available. If evidence is thin, say so explicitly.
- Separate facts, judgement, options, recommendation, and implementation.
- Preserve diplomatic optionality: show softer/harder language where useful.
- Treat legal and diplomatic documents as related production modes: cables, non-papers, demarches, communiques, legal notes, policy memos, and Council products all require structure, provenance, and careful wording.
- Never invent resolution numbers, case names, formal legal findings, or document quotations. Use "INTELLIGENCE GAP" or "LEGAL GAP" when exact authority is unavailable.
- Include a confidence note and follow-up research needs for every artifact.

Quality bar:
- A serious policy user should be able to brief from the output, challenge its assumptions, and reopen the artifact later as a versioned record.`;

export function buildLanguageDirectives(ctx: CalibrationCtx): string {
  const { outputConstraints } = ctx.calibration;
  const langDirective = outputConstraints.language !== 'en'
    ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
    : '';
  const redLineDirective = outputConstraints.redLineClauses.length
    ? `\n\nRED LINES - DO NOT:\n${outputConstraints.redLineClauses.map((r) => `  - ${r}`).join('\n')}`
    : '';
  return `${langDirective}${redLineDirective}`;
}

export async function resolveSituationFromRequest(input: {
  uid: string;
  situation?: unknown;
  situationData?: unknown;
  situationId?: string;
}): Promise<{ situation: Situation | undefined; situationId: string }> {
  const candidate = (input.situation && typeof input.situation === 'object')
    ? input.situation
    : (input.situationData && typeof input.situationData === 'object')
      ? input.situationData
      : undefined;
  const embedded = candidate as Situation | undefined;
  const situationId = input.situationId ?? embedded?.id ?? '';

  if (embedded?.id || embedded?.name) {
    return { situation: embedded, situationId: situationId || embedded.id || '' };
  }

  if (situationId) {
    const loaded = await getSituationById(input.uid, situationId).catch((err) => {
      console.warn('[diplomatic-drafting] getSituationById failed:', err);
      return null;
    });
    if (loaded) return { situation: loaded as Situation, situationId };
  }

  return { situation: undefined, situationId };
}

export async function buildDiplomaticDraftingContext(input: {
  ctx: CalibrationCtx;
  situation?: Situation;
  situationId: string;
  toolId: string;
  webPurpose: string;
}): Promise<{
  graphCtx: string;
  sitContext: string;
  webCtx: string;
  systemCalibration: string;
}> {
  const { ctx, situation, situationId, toolId, webPurpose } = input;
  const [graphCtx, webCtx] = await Promise.all([
    situationId ? buildGraphContext(ctx.uid, situationId, toolId).catch(() => '') : Promise.resolve(''),
    situation
      ? buildWebGroundedContext(
          { name: situation.name, region: situation.region, actors: situation.actors },
          webPurpose,
          ctx.uid,
        ).catch(() => '')
      : Promise.resolve(''),
  ]);

  return {
    graphCtx,
    sitContext: situation ? buildToolContext(situation) : '',
    webCtx,
    systemCalibration: `${ctx.calibration.systemPromptBlock}\n\nCalibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${buildLanguageDirectives(ctx)}`,
  };
}

export function buildDraftingEvidencePrompt(parts: {
  graphCtx?: string;
  sitContext?: string;
  webCtx?: string;
  directContext?: string;
}): string {
  const blocks = [
    parts.webCtx ? `WEB AND OPEN-SOURCE CONTEXT:\n${parts.webCtx}` : '',
    parts.graphCtx ? `SITUATION GRAPH / SAVED TOOL CONTEXT:\n${parts.graphCtx}` : '',
    parts.sitContext ? `SITUATION RECORD:\n${parts.sitContext}` : '',
    parts.directContext ? `USER-PROVIDED WORKING CONTEXT:\n${parts.directContext}` : '',
  ].filter(Boolean);
  return blocks.length ? blocks.join('\n\n') : 'No external evidence was available. State limits clearly and avoid unsupported specificity.';
}

export function sourceAuditPrompt(mode: DiplomaticArtifactMode): string {
  return `## REQUIRED AUDIT FIELDS

Set draftingAudit.artifactMode to "${mode}".
For draftingAudit.sourceUse, list the concrete evidence inputs you relied on. Use "situation record", "graph context", "web context", or named sources when visible.
For draftingAudit.confidenceNote, explain the confidence level in one concise paragraph.
For draftingAudit.limits, identify what is not known or not verified.
For draftingAudit.followUpResearch, provide 2-5 specific research tasks that would improve the artifact.`;
}
