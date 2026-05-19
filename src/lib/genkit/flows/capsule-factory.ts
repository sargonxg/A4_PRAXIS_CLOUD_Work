import { z } from 'genkit';
import { ai, gemini25Flash, gemini25Pro } from '@/lib/genkit';
import {
  CapsuleFactoryDraftCoreSchema,
  CapsuleIntakeInputSchema,
  CapsuleIntakeOutputSchema,
  CapsuleResearchPlanInputSchema,
  CapsuleResearchPlanOutputSchema,
  CapsuleSynthesisInputSchema,
  CapsuleSynthesisOutputSchema,
  CapsuleWritingProfileInputSchema,
  CapsuleWritingProfileOutputSchema,
  CapsuleFactorySourceSnippetSchema,
  type CapsuleIntakeInput,
  type CapsuleIntakeOutput,
  type CapsuleResearchPlanInput,
  type CapsuleResearchPlanOutput,
  type CapsuleSynthesisInput,
  type CapsuleSynthesisOutput,
  type CapsuleWritingProfileInput,
  type CapsuleWritingProfileOutput,
} from '@/lib/genkit/schemas/capsule-factory';

type SourceSnippet = z.infer<typeof CapsuleFactorySourceSnippetSchema>;

const TEMPORAL_RE = /\b(today|yesterday|current|currently|latest|recent|now|this week|this month|202\d)\b/i;
const TALKING_POINTS_RE = /\b(talking points|remarks|speech|briefing lines)\b/i;
const BRIEF_RE = /\b(brief|one-pager|summary)\b/i;
const HANDOVER_RE = /\b(handover|handoff|transfer)\b/i;

export const capsuleIntakeFlow = ai.defineFlow(
  {
    name: 'capsuleIntakeFlow',
    inputSchema: CapsuleIntakeInputSchema,
    outputSchema: CapsuleIntakeOutputSchema,
  },
  async (input) => {
    const normalized = normalizeIntake(input);
    try {
      const prompt = ai.prompt<typeof CapsuleIntakeInputSchema, typeof CapsuleIntakeOutputSchema>('capsule-intake');
      const { output } = await prompt(normalized, { model: gemini25Flash, config: { temperature: 0 } });
      return CapsuleIntakeOutputSchema.parse(output);
    } catch (err) {
      console.warn('[genkit/capsule-factory] falling back to deterministic intake:', err);
      return deterministicIntake(normalized);
    }
  },
);

export const capsuleResearchPlanFlow = ai.defineFlow(
  {
    name: 'capsuleResearchPlanFlow',
    inputSchema: CapsuleResearchPlanInputSchema,
    outputSchema: CapsuleResearchPlanOutputSchema,
  },
  async (input) => {
    const normalized = CapsuleResearchPlanInputSchema.parse(input);
    try {
      const prompt = ai.prompt<typeof CapsuleResearchPlanInputSchema, typeof CapsuleResearchPlanOutputSchema>('capsule-research-plan');
      const { output } = await prompt(normalized, { model: gemini25Flash, config: { temperature: 0 } });
      return CapsuleResearchPlanOutputSchema.parse(output);
    } catch (err) {
      console.warn('[genkit/capsule-factory] falling back to deterministic research plan:', err);
      return deterministicResearchPlan(normalized);
    }
  },
);

export const capsuleSynthesisFlow = ai.defineFlow(
  {
    name: 'capsuleSynthesisFlow',
    inputSchema: CapsuleSynthesisInputSchema,
    outputSchema: CapsuleSynthesisOutputSchema,
  },
  async (input) => {
    const normalized = CapsuleSynthesisInputSchema.parse(input);
    try {
      const prompt = ai.prompt<typeof CapsuleSynthesisInputSchema, typeof CapsuleSynthesisOutputSchema>('capsule-synthesis');
      const { output } = await prompt(normalized, { model: gemini25Pro, config: { temperature: 0 } });
      return CapsuleSynthesisOutputSchema.parse(output);
    } catch (err) {
      console.warn('[genkit/capsule-factory] falling back to deterministic synthesis:', err);
      return deterministicSynthesis(normalized);
    }
  },
);

export const capsuleWritingProfileFlow = ai.defineFlow(
  {
    name: 'capsuleWritingProfileFlow',
    inputSchema: CapsuleWritingProfileInputSchema,
    outputSchema: CapsuleWritingProfileOutputSchema,
  },
  async (input) => {
    const normalized = CapsuleWritingProfileInputSchema.parse(input);
    try {
      const prompt = ai.prompt<typeof CapsuleWritingProfileInputSchema, typeof CapsuleWritingProfileOutputSchema>('capsule-writing-profile');
      const { output } = await prompt(normalized, { model: gemini25Flash, config: { temperature: 0 } });
      return CapsuleWritingProfileOutputSchema.parse(output);
    } catch (err) {
      console.warn('[genkit/capsule-factory] falling back to deterministic writing profile:', err);
      return deterministicWritingProfile(normalized);
    }
  },
);

function normalizeIntake(input: CapsuleIntakeInput): CapsuleIntakeInput {
  return {
    objective: clean(input.objective, 2000),
    prompt: clean(input.prompt ?? '', 6000) || undefined,
    activeCapsuleId: clean(input.activeCapsuleId ?? '', 160) || undefined,
    documents: (input.documents ?? []).slice(0, 10).map((document, index) => ({
      id: clean(document.id, 160) || `document-${index + 1}`,
      title: clean(document.title, 300) || `Document ${index + 1}`,
      text: clean(document.text, 8000),
    })).filter((document) => document.text),
    sourceSnippets: normalizeSources(input.sourceSnippets ?? []),
  };
}

function deterministicIntake(input: CapsuleIntakeInput): CapsuleIntakeOutput {
  const context = clean(`${input.objective} ${input.prompt ?? ''}`, 1200);
  const provenanceIds = [
    ...input.documents.map((document) => document.id),
    ...input.sourceSnippets.map((source) => source.id),
  ].slice(0, 20);
  const hasSources = input.documents.length > 0 || input.sourceSnippets.length > 0;
  const sourcePosture = dominantProposalSource(input.sourceSnippets);
  return {
    draftCores: [
      core('user', 'Analyst posture', `Use this capsule as a reusable expert-thinking block for the user's policy question: ${context}`, [], 'medium'),
      core('situation', titleFromObjective(input.objective), summarizeContext(input, 'Frame the situation, actors, constraints, and decision horizon.'), provenanceIds, hasSources ? 'medium' : 'low'),
      core('source', 'Source posture', hasSources ? `Source material is available from ${provenanceIds.length} receipt(s); keep provenance attached to draft cores.` : 'Source material is not attached yet; preserve this as a visible evidence gap.', provenanceIds, hasSources ? 'medium' : 'low', sourcePosture),
      core('tool', 'Capsule build tools', 'Use grounded search, sourceability review, context resolve, and memo formatting as receipt-returning tools before any write action.', [], 'medium'),
      core('output', 'Reviewable work product', 'Default to a draft memo, brief, talking points, or handover profile with export gates and human confirmation.', [], 'medium'),
    ],
    sourceGaps: hasSources ? ['Check whether each source is dated, directly relevant, and independent.'] : ['Attach dated source receipts or documents before treating claims as supported.'],
    suggestedTools: ['context-resolve', 'grounded-search', 'sourceability-reviewer', 'memo-formatter'],
    applyMode: 'draft_review',
    warnings: hasSources ? [] : ['No documents or source snippets were provided; source cores stay gap-oriented.'],
  };
}

function deterministicResearchPlan(input: CapsuleResearchPlanInput): CapsuleResearchPlanOutput {
  const sourceCount = input.sourceSnippets.length;
  const freshnessNeeds = TEMPORAL_RE.test(input.objective)
    ? ['Dated sources are required before using latest/current wording.']
    : ['Confirm source dates before final output.'];
  const labelText = input.currentCores.map((core) => core.label).join(' ');
  return {
    sourceGaps: [
      sourceCount ? 'Verify whether provided snippets directly support the capsule claims.' : 'Add at least two source receipts that directly support the situation frame.',
      'Identify actor, timeline, and decision-authority gaps before synthesis.',
    ],
    searchQueries: [
      queryFrom(input.objective),
      queryFrom(`${labelText || input.objective} source evidence dated`),
    ],
    readOnlyTools: [
      { toolId: 'grounded-search', reason: 'Find dated public source candidates and return receipts only.', approvalPosture: 'receipt_only' },
      { toolId: 'capsule-repository-read', reason: 'Read existing capsule and corpus records without mutating canonical state.', approvalPosture: 'receipt_only' },
      { toolId: 'sourceability-reviewer', reason: 'Check support posture before any output hardens.', approvalPosture: 'receipt_only' },
    ],
    corpusReads: ['capsule:active', 'library:source-receipts', 'context-package:active'],
    freshnessNeeds,
  };
}

function deterministicSynthesis(input: CapsuleSynthesisInput): CapsuleSynthesisOutput {
  const sourceIds = unique([
    ...input.sourceSnippets.map((source) => source.id),
    ...input.draftCores.flatMap((core) => core.provenanceIds),
  ]);
  const documentIds = sourceIds.filter((id) => id.toLowerCase().startsWith('doc'));
  const coreIds = input.draftCores.map((core) => `${core.kind}:${slug(core.label)}`);
  return {
    contextCapsuleDraft: {
      label: titleFromObjective(input.objective),
      summary: summarizeCores(input.draftCores),
      coreIds,
      provenance: { sourceIds, documentIds },
      assumptions: [
        'Generated capsule content remains draft-only until the user applies or forks it.',
        ...input.researchPlan.freshnessNeeds.slice(0, 3),
      ],
      status: 'draft',
    },
    proposedCores: input.draftCores,
    openQuestions: unique([...input.researchPlan.sourceGaps, ...input.researchPlan.freshnessNeeds]).slice(0, 12),
    suggestedTools: input.researchPlan.readOnlyTools.map((tool) => tool.toolId),
    applyActions: [
      { label: 'Apply as draft ContextCapsule', target: 'context_capsule', requiresConfirmation: true },
      { label: 'Fork active capsule with proposed cores', target: 'context_capsule', requiresConfirmation: true },
      { label: 'Attach source posture as Source Core draft', target: 'source_core', requiresConfirmation: true },
    ],
    laneImprovements: [
      {
        laneId: 'dialectica',
        title: 'Ontology and claim graph delta',
        summary: 'Review entities, claims, provenance ids, and graph-ready relationships before applying any capsule core changes.',
        proposedTags: ['ontology', 'claims', 'graph-delta'],
        evidenceIds: sourceIds,
        requiresConfirmation: true,
      },
      {
        laneId: 'kairos',
        title: 'Temporal freshness delta',
        summary: 'Review stale claims, event sequence, indicators, and decision-window assumptions before hardening current language.',
        proposedTags: ['temporality', 'freshness', 'indicators'],
        evidenceIds: sourceIds,
        requiresConfirmation: true,
      },
      {
        laneId: 'agon',
        title: 'Actor and human-friction delta',
        summary: 'Review actors, incentives, commitments, blockers, and mediation/legal posture before changing the active capsule.',
        proposedTags: ['actors', 'friction', 'commitments'],
        evidenceIds: sourceIds,
        requiresConfirmation: true,
      },
    ],
  };
}

function deterministicWritingProfile(input: CapsuleWritingProfileInput): CapsuleWritingProfileOutput {
  const text = `${input.outputGoal ?? ''} ${input.objective}`.toLowerCase();
  const defaultFormat = HANDOVER_RE.test(text)
    ? 'handover'
    : TALKING_POINTS_RE.test(text)
      ? 'talking_points'
      : BRIEF_RE.test(text)
        ? 'brief'
        : 'memo';
  return {
    defaultFormat,
    tone: 'Concise, caveated, source-aware, and decision-ready.',
    audience: clean(input.audience ?? 'Policy practitioner', 240) || 'Policy practitioner',
    citationPosture: input.contextCapsuleDraft.provenance.sourceIds.length
      ? 'Cite attached source receipts and keep unsupported claims in the gaps section.'
      : 'Treat citations as a blocking gap until source receipts are attached.',
    exportGates: [
      'Human confirmation before replacing the active capsule or exporting final work.',
      'Sourceability review before external circulation.',
      'Freshness check for dated or current claims.',
    ],
  };
}

function core(
  kind: z.infer<typeof CapsuleFactoryDraftCoreSchema>['kind'],
  label: string,
  summary: string,
  provenanceIds: string[],
  confidence: 'low' | 'medium' | 'high',
  source: z.infer<typeof CapsuleFactoryDraftCoreSchema>['source'] = 'firestore',
) {
  return CapsuleFactoryDraftCoreSchema.parse({
    kind,
    label: clean(label, 160),
    summary: clean(summary, 1200),
    provenanceIds,
    confidence,
    source,
  });
}

function normalizeSources(sources: SourceSnippet[]): SourceSnippet[] {
  return sources.slice(0, 20).map((source, index) => ({
    id: clean(source.id, 160) || `source-${index + 1}`,
    title: clean(source.title, 300) || `Source ${index + 1}`,
    url: clean(source.url ?? '', 1000) || undefined,
    date: clean(source.date ?? '', 80) || undefined,
    span: clean(source.span, 4000),
    source: source.source ?? 'firestore',
  })).filter((source) => source.span);
}

function dominantProposalSource(sources: SourceSnippet[]): z.infer<typeof CapsuleFactoryDraftCoreSchema>['source'] {
  if (sources.some((source) => source.source === 'future_graphiti')) return 'future_graphiti';
  if (sources.some((source) => source.source === 'cognee')) return 'cognee';
  return 'firestore';
}

function summarizeContext(input: CapsuleIntakeInput, fallback: string): string {
  const snippets = [
    input.prompt,
    ...input.documents.map((document) => `${document.title}: ${document.text}`),
    ...input.sourceSnippets.map((source) => `${source.title}: ${source.span}`),
  ].filter(Boolean).join(' ');
  return clean(snippets || fallback, 1200);
}

function summarizeCores(cores: z.infer<typeof CapsuleFactoryDraftCoreSchema>[]): string {
  return clean(cores.map((core) => `${core.label}: ${core.summary}`).join(' '), 1200);
}

function titleFromObjective(objective: string): string {
  const cleaned = clean(objective.replace(/^build\s+(a\s+)?/i, '').replace(/[.?!]+$/, ''), 120);
  return cleaned || 'Draft ContextCapsule';
}

function queryFrom(text: string): string {
  return clean(text.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' '), 220);
}

function clean(value: string, limit: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, limit);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => clean(value, 160)).filter(Boolean)));
}

function slug(value: string): string {
  return clean(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), 80) || 'draft';
}
