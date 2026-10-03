import { z } from 'zod';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { getCapsuleAtVersion } from '@/lib/context/capsule-version-resolution';
import { COMPILER_VERSION, WORKER_ROLES } from '@/lib/cognitive-capsule/compiler';
import type { CognitiveAttachmentReceipt } from '@/lib/cognitive-capsule/context-adapter';
import { CognitiveCapsuleSchema } from '@/lib/cognitive-capsule/schema';
import { capsuleDigest } from '@/lib/cognitive-capsule/integrity';
import type { FrozenCognitiveAttachmentInput } from './index';

const id = z.string().min(1).max(240); const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/); const ids = z.array(id).max(10000);
const CompilationSchema = z.object({ compilerVersion: id, capsuleId: id, capsuleVersion: z.string().regex(/^\d+\.\d+\.\d+$/), capsuleDigest: digest,
  role: z.enum(WORKER_ROLES), objective: z.string().max(64000), scope: id, scopes: z.array(id).max(2000), asOf: z.iso.datetime({ offset: true }),
  knowledgeIds: ids, guardedKnowledgeIds: ids, statementIds: ids, evidenceSpans: z.array(z.object({ id, sourceId: id, sourceVersion: id, digest }).strict()).max(10000),
  dependencies: CognitiveCapsuleSchema.shape.dependencies, viewDigest: digest,
  attentionPolicy: z.object({ algorithm: z.literal('task-terms-and-kinds/1'), objectiveTerms: z.array(z.string().max(100)).max(2000), prioritizedKinds: z.array(z.enum(['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger'])).max(12) }).strict(),
}).strict();
const ReceiptSchema = z.object({ key: z.string().min(1).max(300), capsuleId: id, envelopeVersion: z.number().int().positive(), role: z.string().min(1).max(100),
  profile: z.enum(['situation', 'expertise', 'method', 'language', 'organization', 'role', 'casebook', 'output']),
  compilation: CompilationSchema,
}).strict();
export async function resolveRunCognitiveAttachments(run: AgentRun, resolve: typeof getCapsuleAtVersion): Promise<FrozenCognitiveAttachmentInput[]> {
  const execution = run.metadata.capsuleAgentExecutionContext;
  if (!execution || typeof execution !== 'object' || Array.isArray(execution)) return [];
  const raw = (execution as Record<string, unknown>).cognitiveReceipts;
  if (raw === undefined) return [];
  const receipts = z.array(ReceiptSchema).max(30).parse(raw) as CognitiveAttachmentReceipt[];
  const seen = new Set<string>(); const attachments: FrozenCognitiveAttachmentInput[] = [];
  for (const captured of receipts) {
    if (captured.key !== `${captured.capsuleId}@v${captured.envelopeVersion}` || captured.compilation.capsuleId !== captured.capsuleId) throw new Error('Attached cognitive receipt identity is invalid.');
    if (captured.compilation.compilerVersion !== COMPILER_VERSION) throw new Error('Stale attached cognitive compiler receipt; restart from reviewed context.');
    const capsule = await resolve(run.ownerUid, captured.capsuleId, captured.envelopeVersion);
    if (!capsule || capsule.ownerUid !== run.ownerUid || capsule.capsuleId !== captured.capsuleId || capsule.version !== captured.envelopeVersion || capsule.archivedAt || !capsule.cognition) throw new Error('The exact authorized attached cognitive capsule is unavailable.');
    const cognition = CognitiveCapsuleSchema.parse(capsule.cognition);
    if (cognition.capsuleId !== capsule.capsuleId || cognition.profile !== captured.profile || cognition.version !== captured.compilation.capsuleVersion
      || capsuleDigest(cognition) !== captured.compilation.capsuleDigest) throw new Error('Stale attached cognitive capsule digest; restart from reviewed context.');
    // Governing cognition is already frozen by its exact primary version. Revalidate its receipt nevertheless.
    if (captured.capsuleId === run.capsuleId) continue;
    if (seen.has(captured.key)) throw new Error('Duplicate attached cognitive capsule receipt.');
    seen.add(captured.key);
    attachments.push({ capsuleId: captured.capsuleId, capsuleVersion: captured.envelopeVersion, cognition, receipt: captured.compilation, capturedReceipt: captured });
  }
  return attachments;
}
