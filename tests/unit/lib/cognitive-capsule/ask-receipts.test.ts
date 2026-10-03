import { describe, expect, it } from 'vitest';
import type { TurnCapsule } from '@/lib/ai/context-kernel';
import { cognitiveAskReceipts, cognitiveAskMaxStep } from '@/lib/cognitive-capsule/ask-receipts';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { cognitiveContextForCapsule } from '@/lib/cognitive-capsule/context-adapter';

const at = '2026-10-03T12:00:00Z';
const cognition = createCognitiveCapsule('primary', '1.0.0');
const actor = { type: 'human', id: 'owner', at };
cognition.knowledge.push(KnowledgeSchema.parse({ id: 'd1', kind: 'distinction', label: 'Funding stages', scope: ['finance'],
  conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Approval does not establish spending.', whyItMatters: 'Evidence for each stage is separate.',
  commonMistake: 'Equating approval with spending', reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] } }));
const compiled = cognitiveContextForCapsule({ capsuleId: 'primary', cognition }, { asOf: at });
const receipt = { key: 'primary@v2', capsuleId: 'primary', envelopeVersion: 2, role: 'governing', profile: cognition.profile, compilation: compiled.view!.receipt };
function turn(receipts = [receipt], packetText = compiled.text) {
  return { injectableContext: { capsule: { capsuleId: 'primary', version: 2, cognition }, cognitiveReceipts: receipts },
    agentContextPacket: { packetText, cognitiveReceipt: compiled.view!.receipt } } as unknown as TurnCapsule;
}
describe('durable Ask cognitive attachment receipts', () => {
  it('keeps transmitted historical receipts and does not duplicate a primary packet', () => {
    const result = cognitiveAskReceipts(turn());
    expect(result).toEqual([receipt]);
    result[0].compilation.knowledgeIds.push('tampered');
    expect(receipt.compilation.knowledgeIds).toEqual(['d1']);
  });
  it('records a separately rendered primary packet but excludes a suppressed packet', () => {
    expect(cognitiveAskReceipts(turn([]))).toEqual([receipt]);
    expect(cognitiveAskReceipts(turn([], 'No cognitive data'))).toEqual([]);
    expect(cognitiveAskReceipts(null)).toEqual([]);
  });
  it('budgets all selected specialists without changing a plain standard run', () => {
    expect(cognitiveAskMaxStep(false, [receipt])).toBe(8);
    expect(cognitiveAskMaxStep(false, [])).toBe(4);
    expect(cognitiveAskMaxStep(true, [])).toBe(8);
  });
});
