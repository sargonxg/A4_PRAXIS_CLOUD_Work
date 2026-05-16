import { validateOutputCapsulePayload } from './schemas';
import { getOutputCapsuleTemplate } from './templates';
import { evaluateOutputCapsuleQuality } from './quality';
import type {
  OutputCapsuleCitation,
  OutputCapsuleGap,
  OutputCapsuleProvenance,
  OutputCapsuleRecord,
} from './types';

export interface CreateOutputCapsuleInput {
  id: string;
  ownerUid: string;
  situationId?: string | null;
  contextCapsuleId?: string | null;
  templateId: string;
  payload: unknown;
  citations?: OutputCapsuleCitation[];
  gaps?: OutputCapsuleGap[];
  provenance: OutputCapsuleProvenance;
}

export function createOutputCapsuleRecord(input: CreateOutputCapsuleInput): OutputCapsuleRecord {
  const template = getOutputCapsuleTemplate(input.templateId);
  if (!template) throw new Error(`Unknown OutputCapsule template: ${input.templateId}`);
  const payload = validateOutputCapsulePayload(template.schemaId, input.payload);
  const citations = input.citations ?? [];
  const gaps = input.gaps ?? [];
  const citationCoverage = estimateCitationCoverage(payload, citations);
  const quality = evaluateOutputCapsuleQuality({
    template,
    citationCoverage,
    gapCount: gaps.length,
    unsupportedClaimCount: gaps.filter((gap) => gap.severity === 'high').length,
  });
  const now = new Date().toISOString();

  return {
    id: input.id,
    ownerUid: input.ownerUid,
    situationId: input.situationId ?? null,
    contextCapsuleId: input.contextCapsuleId ?? null,
    templateId: template.id,
    family: template.family,
    status: 'draft',
    schemaId: template.schemaId,
    schemaVersion: template.schemaVersion,
    renderer: template.renderer,
    exporters: template.exporters,
    payload,
    citations,
    gaps,
    inputCapsules: [],
    provenance: input.provenance,
    quality,
    version: 1,
    parentVersionId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function composeOutputCapsules(
  targetTemplateId: string,
  inputs: OutputCapsuleRecord[],
  options: {
    id: string;
    ownerUid: string;
    situationId?: string | null;
    contextCapsuleId?: string | null;
    provenance: OutputCapsuleProvenance;
  },
): OutputCapsuleRecord {
  const template = getOutputCapsuleTemplate(targetTemplateId);
  if (!template) throw new Error(`Unknown OutputCapsule template: ${targetTemplateId}`);
  if (template.family !== 'composite') throw new Error(`${targetTemplateId} is not a composite OutputCapsule template.`);

  const allowed = new Set(template.composableWith);
  const unsupported = inputs.filter((input) => !allowed.has(input.templateId));
  if (unsupported.length > 0) {
    throw new Error(`Unsupported composite inputs: ${unsupported.map((input) => input.templateId).join(', ')}`);
  }

  const citations = dedupeById(inputs.flatMap((input) => input.citations));
  const gaps = dedupeById(inputs.flatMap((input) => input.gaps));
  const payload = {
    title: template.label,
    summary: `Composite pack assembled from ${inputs.length} output capsule(s).`,
    sections: inputs.map((input) => ({
      heading: titleFromPayload(input.payload) || input.templateId,
      body: summaryFromPayload(input.payload) || `Included ${input.templateId}.`,
      citationIds: input.citations.map((citation) => citation.id),
    })),
    inputSummaries: inputs.map((input) => ({
      templateId: input.templateId,
      title: titleFromPayload(input.payload) || input.templateId,
      summary: summaryFromPayload(input.payload) || '',
    })),
  };

  const record = createOutputCapsuleRecord({
    id: options.id,
    ownerUid: options.ownerUid,
    situationId: options.situationId,
    contextCapsuleId: options.contextCapsuleId,
    templateId: targetTemplateId,
    payload,
    citations,
    gaps,
    provenance: options.provenance,
  });

  return {
    ...record,
    inputCapsules: inputs.map((input) => ({
      id: input.id,
      templateId: input.templateId,
      version: input.version,
    })),
    quality: evaluateOutputCapsuleQuality({
      template,
      citationCoverage: Math.min(...inputs.map((input) => input.quality.citationCoverage), record.quality.citationCoverage),
      unsupportedClaimCount: inputs.reduce((sum, input) => sum + input.quality.unsupportedClaimCount, 0),
      gapCount: gaps.length,
      sourceabilityStatus: inputs.some((input) => input.quality.sourceabilityStatus === 'blocked') ? 'blocked' : 'not-run',
    }),
  };
}

function estimateCitationCoverage(payload: unknown, citations: OutputCapsuleCitation[]) {
  const sections = typeof payload === 'object' && payload !== null && 'sections' in payload
    ? (payload as { sections?: Array<{ citationIds?: string[] }> }).sections ?? []
    : [];
  if (sections.length === 0) return citations.length > 0 ? 1 : 0;
  const cited = sections.filter((section) => (section.citationIds ?? []).length > 0).length;
  return cited / sections.length;
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function titleFromPayload(payload: unknown) {
  return typeof payload === 'object' && payload !== null && 'title' in payload ? String((payload as { title?: unknown }).title ?? '') : '';
}

function summaryFromPayload(payload: unknown) {
  return typeof payload === 'object' && payload !== null && 'summary' in payload ? String((payload as { summary?: unknown }).summary ?? '') : '';
}
