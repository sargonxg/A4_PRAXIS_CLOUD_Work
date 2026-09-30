import { describe, expect, it } from 'vitest';
import { detachMemoArtifactContext, memoArtifactContextSaveFields, savedMemoArtifactContext } from '@/lib/memo/artifact-context';

const snapshot = (fields: Record<string, unknown> = {}) => ({ schemaVersion: 1, binding: 'recorded', capsuleId: null, capsuleVersion: null,
  sourceReceiptIds: [], sourceReceipts: [], unsupportedClaims: [], claimChecks: [], conversationId: null, runId: null, outputTarget: null, outputCapsuleId: null, ...fields });

describe('saved memo artifact context', () => {
  it('reopens the exact named version rather than combining old metadata or the current chat', () => {
    const context = savedMemoArtifactContext({ memo: { currentVersionId: 'v2', capsuleId: null, sourceReceiptIds: ['stale'], contextSnapshot: snapshot({ capsuleId: 'capsule-old', capsuleVersion: 1 }) }, versions: [
      { id: 'v1', contextSnapshot: snapshot({ capsuleId: 'capsule-a', capsuleVersion: 3 }) },
      { id: 'v2', contextSnapshot: snapshot({ capsuleId: 'capsule-b', capsuleVersion: 7, sourceReceiptIds: ['source-b'], sourceReceipts: [{ id: 'source-b', snippet: 'Exact captured text' }], unsupportedClaims: ['Unresolved claim'] }) },
    ] });
    expect(context).toMatchObject({ capsuleId: 'capsule-b', capsuleVersion: 7, sourceReceiptIds: ['source-b'], unsupportedClaims: ['Unresolved claim'] });
    expect(context.sourceReceipts[0].snippet).toBe('Exact captured text');
  });
  it('keeps a recorded detached memo detached when reopened and passed to Save', () => {
    const payload = { memo: { currentVersionId: 'v2', caseId: 'capsule-old', capsuleId: null, sourceReceiptIds: ['stale'] }, versions: [{ id: 'v2', contextSnapshot: snapshot(), blocks: [{ metadata: { capsuleId: 'capsule-old', capsuleVersion: 3, sourceReceiptIds: ['stale'] } }] }] };
    const reopened = savedMemoArtifactContext(payload);
    const saveFields = { capsuleId: reopened.capsuleId, capsuleVersion: reopened.capsuleVersion, sourceReceiptIds: reopened.sourceReceiptIds, sourceReceipts: reopened.sourceReceipts };
    expect(saveFields).toEqual({ capsuleId: null, capsuleVersion: null, sourceReceiptIds: [], sourceReceipts: [] });
    expect(savedMemoArtifactContext({ memo: { currentVersionId: 'v3', capsuleId: null }, versions: [{ id: 'v3', contextSnapshot: snapshot(saveFields) }] })).toMatchObject(saveFields);
  });
  it('honors a flat explicit null even when stale context or fallback metadata exists', () => {
    expect(savedMemoArtifactContext({ memo: { currentVersionId: 'v1', capsuleId: null, contextSnapshot: snapshot({ capsuleId: 'old', capsuleVersion: 1 }) } })).toMatchObject({ capsuleId: null, capsuleVersion: null, sourceReceiptIds: [] });
  });
  it('leaves legacy records unbound and never turns case IDs or metadata into a pin', () => {
    expect(savedMemoArtifactContext({ memo: { capsuleId: 'old', capsuleVersion: 9, caseId: 'case' }, versions: [{ blocks: [{ metadata: { capsuleId: 'old', sourceReceiptIds: ['stale'] } }] }] })).toMatchObject({ binding: 'legacy-unbound', capsuleId: null, capsuleVersion: null, sourceReceiptIds: [] });
  });
  it('does not promote malformed or unsnapshotted legacy versions even if the envelope has a recorded snapshot', () => {
    expect(savedMemoArtifactContext({ memo: { currentVersionId: 'v1', contextSnapshot: snapshot({ capsuleId: 'stale', capsuleVersion: 1 }) }, versions: [{ id: 'v1' }] }).binding).toBe('legacy-unbound');
    expect(savedMemoArtifactContext({ memo: { currentVersionId: 'v1' }, versions: [{ id: 'v1', contextSnapshot: snapshot({ capsuleId: 'broken', capsuleVersion: null }) }] })).toMatchObject({ binding: 'legacy-unbound', capsuleId: null, capsuleVersion: null });
  });
  it('omits legacy context on ordinary Save and records explicit no-capsule recovery only after a deliberate choice', () => {
    const context = savedMemoArtifactContext({ memo: { currentVersionId: 'legacy' }, versions: [{ id: 'legacy' }] });
    const artifact = { ...context, contextBinding: context.binding, savedBody: 'Old body', savedTitle: 'Old title' };
    expect(memoArtifactContextSaveFields(artifact)).toEqual({});
    const detached = detachMemoArtifactContext(artifact);
    expect(detached).toMatchObject({ contextBinding: 'recorded', savedBody: null, savedTitle: null });
    expect(memoArtifactContextSaveFields(detached)).toMatchObject({ capsuleId: null, capsuleVersion: null, sourceReceiptIds: [], sourceReceipts: [] });
  });
});
