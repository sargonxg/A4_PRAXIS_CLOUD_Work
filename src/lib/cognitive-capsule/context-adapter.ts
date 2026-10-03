import { CognitiveCapsuleSchema } from './schema';
import { compileContext, renderContext, type CognitiveWorkerRole, type CognitiveContextView } from './compiler';

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
