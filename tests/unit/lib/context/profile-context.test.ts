import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn(),
}));
vi.mock('@/lib/firebase/situations', () => ({
  getSituationById: vi.fn(),
}));
vi.mock('@/lib/knowledge/profile-weighted-retrieval', () => ({
  retrieveForProfile: vi.fn(),
}));
vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: vi.fn(),
  sanitizeCapsule: (input: unknown) => input,
}));

const versionStore = vi.hoisted(() => ({ documents: new Map<string, unknown>() }));
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: null,
  getAdminDbOrThrow: () => ({
    collection: (name: string) => scopedRef(name),
  }),
}));

function scopedRef(path: string): unknown {
  return {
    doc: (id: string) => scopedRef(`${path}/${id}`),
    collection: (name: string) => scopedRef(`${path}/${name}`),
    get: async () => ({ exists: versionStore.documents.has(path), data: () => versionStore.documents.get(path) }),
  };
}

import { buildCalibratedContext } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationById } from '@/lib/firebase/situations';
import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import { getCapsule } from '@/lib/context/capsule-service';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('buildCalibratedContext', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCapsule).mockReset(); versionStore.documents.clear(); });

  it('uses the exact pinned capsule contents after a newer version is saved', async () => {
    const historical = { ...makeCapsule('pinned', 'Pinned capsule', ['Saved version two claim.']), version: 2 };
    const latest = makeCapsule('pinned', 'Pinned capsule', ['New version three claim.']);
    versionStore.documents.set('users/u1/capsules/pinned', latest);
    versionStore.documents.set('users/u1/capsules/pinned/versions/v2', historical);
    vi.mocked(getCapsule).mockResolvedValueOnce(latest as never);

    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'chat', capsuleId: 'pinned', activeContextStack: {
      capsuleRefs: [{ capsuleId: 'pinned', role: 'primary', version: 2 }],
    } });
    expect(ctx.systemPromptBlock).toContain('Saved version two claim.');
    expect(ctx.systemPromptBlock).not.toContain('New version three claim.');
    expect(ctx.toolContext.capsules?.[0].version).toBe(2);
  });

  it('refuses a missing pin instead of omitting it from an otherwise usable context', async () => {
    const latest = makeCapsule('missing-pin', 'Missing version', ['New version three claim.']);
    versionStore.documents.set('users/u1/capsules/missing-pin', latest);
    vi.mocked(getCapsule).mockResolvedValueOnce(latest as never);
    await expect(buildCalibratedContext({ uid: 'u1', toolId: 'chat', activeContextStack: {
      capsuleRefs: [{ capsuleId: 'missing-pin', role: 'reference', version: 2 }],
    } })).rejects.toMatchObject({ name: 'CapsuleVersionConflictError', code: 'capsule_version_unavailable' });
  });

  it('returns neutral context when profile missing and situation missing', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor' });
    expect(ctx.provenance.profileVersion).toBe(0);
    expect(ctx.provenance.situationVersion).toBeNull();
    expect(ctx.systemPromptBlock).toContain('No profile set');
    expect(ctx.systemPromptBlock).toContain('No active situation');
    expect(ctx.outputConstraints.language).toBe('en');
  });

  it('includes situation and profile when both exist', async () => {
    const profile = { ...DEFAULT_ANALYST_PROFILE, meta: { ...DEFAULT_ANALYST_PROFILE.meta, version: 4 } };
    const situation = { id: 's1', name: 'Sudan', type: 'civil', region: 'Horn of Africa', actors: [], userRole: 'analyst', status: 'active', description: 'Ceasefire context', createdAt: null, updatedAt: null };
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (getSituationById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(situation);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor', situationId: 's1' });
    expect(ctx.provenance.profileVersion).toBe(4);
    expect(ctx.systemPromptBlock).toContain('Sudan');
    expect(retrieveForProfile).toHaveBeenCalledWith({
      uid: 'u1',
      situationId: 's1',
      query: expect.stringContaining('risk-monitor | Sudan'),
      topK: 5,
    });
  });

  it('calls retrieval when retrievalQuery provided', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(DEFAULT_ANALYST_PROFILE);
    (getSituationById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (retrieveForProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'c1', text: 'hit', source: 'wiki' }]);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'chat', retrievalQuery: 'why', retrievalTopK: 5 });
    expect(retrieveForProfile).toHaveBeenCalledWith({ uid: 'u1', situationId: undefined, query: 'why', topK: 5 });
    expect(ctx.systemPromptBlock).toContain('<retrieved-knowledge>');
  });

  it('never throws when embedding or retrieval fails — returns neutral fallback', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('firestore down'));
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor' });
    expect(ctx.provenance.profileVersion).toBe(0);
  });

  it('loads attached capsule refs into the calibrated capsule-frame', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(DEFAULT_ANALYST_PROFILE);
    (getCapsule as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(makeCapsule('cap-primary', 'Primary governance file', ['Claim from the primary capsule.']))
      .mockResolvedValueOnce(makeCapsule('cap-reference', 'Reference sanctions file', ['Claim from the reference capsule.']));

    const ctx = await buildCalibratedContext({
      uid: 'u1',
      toolId: 'chat',
      capsuleId: 'cap-primary',
      activeContextStack: {
        capsuleRefs: [
          { capsuleId: 'cap-reference', label: 'Reference sanctions file', role: 'reference' },
          { capsuleId: 'cap-primary', label: 'Primary governance file', role: 'primary' },
        ],
      },
    });

    expect(getCapsule).toHaveBeenNthCalledWith(1, 'u1', 'cap-primary');
    expect(getCapsule).toHaveBeenNthCalledWith(2, 'u1', 'cap-reference');
    expect(ctx.systemPromptBlock).toContain('<capsule-frame count="2"');
    expect(ctx.systemPromptBlock.indexOf('Primary governance file')).toBeLessThan(ctx.systemPromptBlock.indexOf('Reference sanctions file'));
    expect(ctx.systemPromptBlock).toContain('Claim from the primary capsule.');
    expect(ctx.systemPromptBlock).toContain('Claim from the reference capsule.');
    expect(ctx.toolContext.capsules?.map((capsule) => capsule.capsuleId)).toEqual(['cap-primary', 'cap-reference']);
  });
});

function makeCapsule(capsuleId: string, label: string, claims: string[]) {
  return {
    capsuleId,
    ownerUid: 'u1',
    label,
    version: 3,
    scope: 'user',
    updatedAt: '2026-05-10T00:00:00.000Z',
    health: { score: 82, warnings: [] },
    coreRefs: {
      userCoreId: 'user-core',
      situationCoreId: 'situation-core',
      sourceCoreIds: ['src-1'],
      documentCoreIds: [],
      graphCoreId: null,
      outputCoreIds: ['memo'],
      toolCoreIds: ['sourceability-reviewer'],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    v3: {
      identity: { capsuleId, label, capsuleVersion: 3 },
      grounding: {
        temporality: { asOf: '2026-05-10', validFrom: '2026-05-01', validUntil: '2026-06-30' },
        ontologyBinding: {
          domainId: 'governance-rule-of-law',
          taxonomyPath: ['generic', 'governance-rule-of-law'],
          ontologyIds: ['governance'],
          acoPrimitives: ['Actor', 'Claim'],
          bindingRationale: 'Use governance ontology.',
        },
      },
      sourceSpine: {
        sourceRefs: [{
          sourceId: 'src-1',
          label: 'Official source',
          url: 'https://example.test/source',
          date: '2026-05-01',
          reliabilityTier: 1,
        }],
      },
      claimLedger: {
        allClaims: claims.map((text, index) => ({
          claimId: `claim-${index + 1}`,
          text,
          support: 'supported',
          sourceRefIds: ['src-1'],
        })),
      },
      agentOperatingContract: {
        allowedActions: ['suggest', 'source', 'draft'],
        forbiddenActions: ['publish', 'mutate_canonical_without_review'],
        sourceRequirements: ['Every claim needs a source receipt.'],
        reviewCheckpoints: ['sourceability_review'],
        toolRecommendations: ['sourceability-reviewer'],
        bestNextAction: 'Run sourceability before drafting.',
        handoffInstructions: ['Carry source ids into outputs.'],
        stopConditions: ['Stop before external publish.'],
      },
    },
  };
}
