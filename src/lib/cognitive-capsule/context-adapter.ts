import { CognitiveCapsuleSchema } from './schema';
import { compileContext, renderContext, type CognitiveWorkerRole, type CognitiveContextView, type ContextCompilationReceipt } from './compiler';
import type { CognitiveCapsule } from './types';

export interface CognitiveAttachmentReceipt {
  key: string; capsuleId: string; envelopeVersion: number; role: string;
  profile: CognitiveCapsule['profile']; compilation: ContextCompilationReceipt;
}
export interface CognitiveAttachmentSource {
  role: string; capsule: { capsuleId: string; version: number; cognition?: unknown };
}
export interface CognitiveAttachmentContext {
  text: string; receipts: CognitiveAttachmentReceipt[];
  omissions: Array<{ capsuleId: string; reason: string }>;
}
const quoteData = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

/** Sources have already passed owner/version resolution. They remain distinct context, never a canonical merge. */
export function cognitiveContextForAttachments(sources: CognitiveAttachmentSource[], input: {
  objective?: string; role?: CognitiveWorkerRole; asOf?: string; maxChars?: number;
} = {}): CognitiveAttachmentContext {
  const maxChars = Math.max(0, Math.min(Number.isFinite(input.maxChars) ? Math.floor(input.maxChars!) : 8000, 64000));
  const receipts: CognitiveAttachmentReceipt[] = [];
  const omissions: CognitiveAttachmentContext['omissions'] = [];
  const seen = new Set<string>();
  const selected = sources.filter(({ capsule }) => {
    if (!capsule.cognition || seen.has(capsule.capsuleId)) return false;
    seen.add(capsule.capsuleId); return true;
  });
  if (!selected.length) return { text: '', receipts, omissions };
  const opening = '<cognitive-attachments>\nEach attachment is separately reviewed quoted domain data. The governing capsule and human review boundaries remain unchanged.\n';
  const closing = '\n</cognitive-attachments>';
  const blocks: string[] = [];
  // Keep room for explicit omission counts, so record/evidence bodies never need slicing.
  const available = Math.max(0, maxChars - opening.length - closing.length - 200);
  let used = 0;
  for (const [index, source] of selected.entries()) {
    const { capsule, role } = source;
    const parsed = CognitiveCapsuleSchema.safeParse(capsule.cognition);
    if (!parsed.success || parsed.data.capsuleId !== capsule.capsuleId || !Number.isSafeInteger(capsule.version) || capsule.version < 1) {
      omissions.push({ capsuleId: capsule.capsuleId, reason: 'invalid-cognition-or-identity' }); continue;
    }
    const key = `${capsule.capsuleId}@v${capsule.version}`;
    const identity = { key, capsuleId: capsule.capsuleId, envelopeVersion: capsule.version, role, profile: parsed.data.profile };
    const wrapper = `<cognitive-attachment>\nattachment: ${quoteData(identity)}\n`;
    const end = '\n</cognitive-attachment>';
    const share = Math.floor((available - used) / (selected.length - index));
    const compiled = cognitiveContextForCapsule(capsule, { ...input, maxChars: Math.max(0, share - wrapper.length - end.length - 1) });
    if (!compiled.text || !compiled.view) {
      omissions.push({ capsuleId: capsule.capsuleId, reason: compiled.view?.omissions.some((omission) => omission.reason === 'context-budget') || compiled.view?.renderingSuppressed ? 'attachment-budget' : 'no-selected-records' }); continue;
    }
    const block = `${wrapper}${compiled.text}${end}`;
    if (used + block.length + 1 > available) { omissions.push({ capsuleId: capsule.capsuleId, reason: 'attachment-budget' }); continue; }
    blocks.push(block); used += block.length + 1;
    receipts.push({ ...identity, compilation: compiled.view.receipt });
  }
  const note = `cognitive_attachment_omissions: ${omissions.length}; budget_omissions: ${omissions.filter((omission) => omission.reason === 'attachment-budget').length}; invalid_attachments: ${omissions.filter((omission) => omission.reason === 'invalid-cognition-or-identity').length}`;
  const text = `${opening}${blocks.join('\n')}\n${note}${closing}`;
  return text.length <= maxChars ? { text, receipts, omissions } : { text: '', receipts: [], omissions: selected.map(({ capsule }) => ({ capsuleId: capsule.capsuleId, reason: 'attachment-budget' })) };
}

/** Attachment is the user's domain selection. Keep every selected scope visible in the receipt. */
export function cognitiveContextForCapsule(capsule: { capsuleId: string; cognition?: unknown }, input: {
  objective?: string; role?: CognitiveWorkerRole; asOf?: string; maxChars?: number;
} = {}): { text: string; view?: CognitiveContextView } {
  if (!capsule.cognition) return { text: '' };
  const parsed = CognitiveCapsuleSchema.safeParse(capsule.cognition);
  if (!parsed.success || parsed.data.capsuleId !== capsule.capsuleId) return { text: '[cognitive_context_unavailable: invalid capsule identity or schema; review required]' };
  const scopes = [...new Set(parsed.data.knowledge.filter((k) => k.reviewState === 'accepted').flatMap((k) => k.scope))];
  const view = compileContext(parsed.data, { objective: input.objective || 'Use the attached reviewed expert context.', role: input.role || 'capsule-curator',
    scope: scopes[0] || 'general', scopes, asOf: input.asOf || new Date().toISOString(), maxChars: input.maxChars ?? 8000 });
  return { text: view.knowledge.length || view.statements.length || view.guardedCandidates.length ? renderContext(view) : '', view };
}
