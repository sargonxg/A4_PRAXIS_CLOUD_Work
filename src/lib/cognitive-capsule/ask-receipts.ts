import type { TurnCapsule } from '@/lib/ai/context-kernel';
import type { CognitiveAttachmentReceipt } from './context-adapter';
import { CognitiveCapsuleSchema } from './schema';

/** Receipts describe complete context blocks actually sent, never requested attachments. */
export function cognitiveAskReceipts(turn: TurnCapsule | null): CognitiveAttachmentReceipt[] {
  if (!turn) return [];
  const receipts = structuredClone(turn.injectableContext.cognitiveReceipts ?? []);
  const packet = turn.agentContextPacket;
  const primary = turn.injectableContext.capsule;
  const parsed = CognitiveCapsuleSchema.safeParse(primary.cognition);
  if (packet?.cognitiveReceipt && parsed.success && !receipts.some((r) => r.capsuleId === primary.capsuleId)
    && packet.packetText.includes('<cognitive-context>')) {
    receipts.push({ key: `${primary.capsuleId}@v${primary.version}`, capsuleId: primary.capsuleId,
      envelopeVersion: primary.version, role: 'governing', profile: parsed.data.profile, compilation: packet.cognitiveReceipt });
  }
  return receipts;
}

export function cognitiveAskMaxStep(deep: boolean, receipts: CognitiveAttachmentReceipt[]): number {
  // Four durable memo steps plus up to four data-selected specialists.
  return deep || receipts.length > 0 ? 8 : 4;
}
