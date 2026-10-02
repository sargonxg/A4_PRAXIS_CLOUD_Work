import { beforeEach, describe, expect, it } from 'vitest';
import { projectFirestore } from '../../../helpers/project-firestore';
import { createProject, getProject, listProjects, mutateProject, projectCapsuleHash } from '@/lib/projects/service';
import { sanitizeCapsule } from '@/lib/context/capsule-service';

const scope = { title: 'Example Advisory — synthetic', question: 'What remains undecided?', purpose: 'Internal assessment', audience: 'Research director', jurisdiction: 'Fictional jurisdiction', asOfDate: '2026-01-15', language: 'en', mandate: 'Describe qualified evidence', conventions: 'Keep proposals distinct from adopted rules' };
let fixture: ReturnType<typeof projectFirestore>;
const deps = () => ({ db: fixture.db, now: () => '2026-10-02T12:00:00.000Z' });
const create = (uid = 'owner', key = 'create-001') => createProject(uid, { scope, operationId: key }, deps());
const mutation = (projectId: string, input: unknown, uid = 'owner') => mutateProject(uid, projectId, input, deps());

describe('private continuing projects', () => {
  beforeEach(() => {
    fixture = projectFirestore();
    fixture.records.set('users/owner', { uid: 'owner' });
    fixture.records.set('users/outsider', { uid: 'outsider' });
    fixture.records.set('users/owner/capsules/dossier', sanitizeCapsule({ capsuleId: 'dossier', ownerUid: 'owner', version: 2, label: 'Reporting proposal', summary: 'Funding remains undecided. A pilot is optional.', coreRefs: { documentCoreIds: ['day-1'], sourceCoreIds: ['consultation-1'] } }));
  });

  it('creates, persists and reopens scope without changing existing capsules or conversations', async () => {
    fixture.records.set('users/owner/ask_conversations/old', { text: 'Existing work' });
    const prior = structuredClone(fixture.records.get('users/owner/capsules/dossier'));
    const project = await create();
    expect(await getProject('owner', project.projectId, deps())).toMatchObject({ ...scope, ownerUid: 'owner', revision: 1, access: 'private', workItems: [] });
    expect((await listProjects('owner', deps()))[0].projectId).toBe(project.projectId);
    expect(fixture.records.get('users/owner/capsules/dossier')).toEqual(prior);
    expect(fixture.records.get('users/owner/ask_conversations/old')).toEqual({ text: 'Existing work' });
  });

  it('makes creation and repeated submissions idempotent, rejecting changed payloads for a reused key', async () => {
    const project = await create();
    expect((await create()).projectId).toBe(project.projectId);
    await expect(createProject('owner', { scope: { ...scope, title: 'Changed' }, operationId: 'create-001' }, deps())).rejects.toMatchObject({ status: 409 });
    const command = { action: 'add-work', expectedRevision: 1, operationId: 'work-001', title: 'Brief', instruction: 'Funding remains undecided; pilot is optional.', output: 'brief' };
    const saved = await mutation(project.projectId, command);
    expect((await mutation(project.projectId, command)).workItems).toEqual(saved.workItems);
    expect(saved.workItems[0]).toMatchObject({ state: 'draft', projectRevision: 1, context: [] });
    await expect(mutation(project.projectId, { ...command, instruction: 'Invented mandate' })).rejects.toMatchObject({ status: 409 });
  });

  it('orders before limiting so the newest project remains visible beyond the first 100 hashed IDs', async () => {
    const project = await create();
    for (let index = 0; index < 101; index++) fixture.records.set(`users/owner/projects/old_${index}`, { ...project, projectId: `old_${index}`, updatedAt: '2020-01-01T00:00:00Z' });
    const recent = await listProjects('owner', deps());
    expect(recent).toHaveLength(100); expect(recent[0].projectId).toBe(project.projectId);
  });

  it('pins exact snapshot content and retains work context when project scope or selected context changes', async () => {
    const project = await create();
    const attached = await mutation(project.projectId, { action: 'attach', expectedRevision: 1, operationId: 'attach-001', capsuleId: 'dossier', version: 2, role: 'situation' });
    expect(attached.context[0]).toMatchObject({ capsuleId: 'dossier', version: 2, role: 'situation', sourceIds: ['consultation-1'], documentIds: ['day-1'] });
    expect(attached.context[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
    const saved = await mutation(project.projectId, { action: 'add-work', expectedRevision: 2, operationId: 'work-001', title: 'Map', instruction: 'Attribute positions', output: 'stakeholder-map' });
    const edited = await mutation(project.projectId, { action: 'scope', expectedRevision: 3, operationId: 'scope-001', scope: { ...scope, asOfDate: null } });
    expect(edited.workItems[0].context).toEqual(saved.context);
    expect(edited.workItems[0].scope.asOfDate).toBe('2026-01-15');
    expect(edited.asOfDate).toBeNull();
  });

  it('fails closed on missing, foreign or changed capsule snapshots without leaking titles', async () => {
    const project = await create();
    await expect(mutation(project.projectId, { action: 'attach', expectedRevision: 1, operationId: 'attach-001', capsuleId: 'foreign', version: 1, role: 'tool' })).rejects.toMatchObject({ status: 409 });
    const attached = await mutation(project.projectId, { action: 'attach', expectedRevision: 1, operationId: 'attach-002', capsuleId: 'dossier', version: 2, role: 'situation' });
    const capsule = fixture.records.get('users/owner/capsules/dossier') as Record<string, unknown>;
    fixture.records.set('users/owner/capsules/dossier', { ...capsule, summary: 'Capital secured. Pilot mandatory.' });
    expect((await getProject('owner', project.projectId, deps()))?.contextStatus[0].status).toBe('changed');
    await expect(mutation(project.projectId, { action: 'add-work', expectedRevision: attached.revision, operationId: 'work-001', title: 'Brief', instruction: 'Use selected evidence', output: 'brief' })).rejects.toMatchObject({ status: 409, code: 'context_changed' });
    expect(await getProject('outsider', project.projectId, deps())).toBeNull();
    expect(await listProjects('outsider', deps())).toEqual([]);
    await expect(mutation(project.projectId, { action: 'scope', expectedRevision: 2, operationId: 'scope-001', scope }, 'outsider')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects stale concurrent corrections and records actual actor and immutable project revisions', async () => {
    const project = await create();
    const outcomes = await Promise.allSettled([
      mutation(project.projectId, { action: 'scope', expectedRevision: 1, operationId: 'scope-001', scope: { ...scope, title: 'Correction A' } }),
      mutation(project.projectId, { action: 'scope', expectedRevision: 1, operationId: 'scope-002', scope: { ...scope, title: 'Correction B' } }),
    ]);
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const reloaded = await getProject('owner', project.projectId, deps());
    expect(reloaded?.history.at(-1)).toMatchObject({ actorUid: 'owner', action: 'scope', revision: 2 });
    expect(fixture.records.get(`users/owner/projects/${project.projectId}/revisions/r1`)).toMatchObject({ title: scope.title });
  });

  it('keeps a pin usable after an ordinary read receipt but detects semantic rationale changes', async () => {
    const project = await create();
    const attached = await mutation(project.projectId, { action: 'attach', expectedRevision: 1, operationId: 'attach-001', capsuleId: 'dossier', version: 2, role: 'situation' });
    const original = sanitizeCapsule(fixture.records.get('users/owner/capsules/dossier'));
    const receipt = sanitizeCapsule({ ...original, updatedAt: '2026-10-02T13:00:00Z', usage: { readCount: 3, updatedAt: '2026-10-02T13:00:00Z' } });
    expect(projectCapsuleHash(receipt)).toBe(projectCapsuleHash(original));
    fixture.records.set('users/owner/capsules/dossier', receipt);
    expect((await getProject('owner', project.projectId, deps()))?.contextStatus[0].status).toBe('available');
    expect((await mutation(project.projectId, { action: 'add-work', expectedRevision: attached.revision, operationId: 'work-001', title: 'Brief', instruction: 'Use qualified evidence', output: 'brief' })).workItems).toHaveLength(1);
    const changed = structuredClone(receipt); changed.v3!.reasoningScaffold.caveats.push('Changed evidence qualification');
    expect(projectCapsuleHash(changed)).not.toBe(projectCapsuleHash(original));
  });

  it('rejects privileged imports, invalid calendar dates, deleting owners and cancellation of nonexistent work', async () => {
    await expect(createProject('owner', { scope: { ...scope, asOfDate: '2026-02-30' }, operationId: 'create-001' }, deps())).rejects.toMatchObject({ name: 'ZodError' });
    await expect(createProject('owner', { scope, operationId: 'create-001', ownerUid: 'outsider', access: 'public' }, deps())).rejects.toMatchObject({ name: 'ZodError' });
    const project = await create();
    await expect(mutation(project.projectId, { action: 'cancel-work', expectedRevision: 1, operationId: 'cancel-001', workItemId: 'missing' })).rejects.toMatchObject({ status: 404 });
    fixture.records.set('users/owner', { accountDeletionStatus: 'deleting' });
    await expect(create('owner', 'create-002')).rejects.toMatchObject({ status: 409 });
  });
});
