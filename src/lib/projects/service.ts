import { createHash } from 'node:crypto';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { withDocumentOwnerWrite } from '@/lib/documents/owner-write';
import { sanitizeCapsule, type PraxisCapsule } from '@/lib/context/capsule-service';
import { getCapsuleAtVersion } from '@/lib/context/capsule-version-resolution';
import { CreateProjectSchema, ProjectIdSchema, ProjectMutationSchema, projectScope, type ProjectContextPin, type ProjectRecord, type ProjectView } from './schema';

export class ProjectError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
interface ProjectDeps { db?: Firestore; now?: () => string }
function resources(uid: string, deps: ProjectDeps) {
  ProjectIdSchema.parse(uid);
  const db = deps.db ?? getAdminDbOrThrow();
  return { db, collection: db.collection('users').doc(uid).collection('projects'), now: deps.now?.() ?? new Date().toISOString() };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
const digest = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
/** Hash evidence-bearing content; operational badges/favorites are not evidence changes. */
export function projectCapsuleHash(capsule: PraxisCapsule): string {
  const { capsuleId, ownerUid, version, label, summary, scope, coreRefs, v3, sourceRefs, claimLedger, outputContracts, temporality, ontologyBinding, humanTacitKnowledge, agentPermissions } = capsule;
  const semanticV3 = v3 ? {
    businessUseCase: { purpose: v3.businessUseCase.purpose, useCase: v3.businessUseCase.useCase, audience: v3.businessUseCase.audience, domainTags: v3.businessUseCase.domainTags, decisionHorizon: v3.businessUseCase.decisionHorizon, updateCadence: v3.businessUseCase.updateCadence },
    humanTacitKnowledge: v3.humanTacitKnowledge, sourceSpine: v3.sourceSpine, contextCaptureProfile: v3.contextCaptureProfile,
    grounding: v3.grounding, claimLedger: v3.claimLedger, reasoningScaffold: v3.reasoningScaffold,
    agentOperatingContract: v3.agentOperatingContract, memoryPosture: v3.memoryPosture,
    governance: v3.governance, outputContracts: v3.outputContracts,
  } : undefined;
  return digest({ capsuleId, ownerUid, version, label, summary, scope, coreRefs, semanticV3, sourceRefs, claimLedger, outputContracts, temporality, ontologyBinding, humanTacitKnowledge, agentPermissions });
}
function owned(raw: unknown, uid: string, id: string): ProjectRecord | null {
  const record = raw as ProjectRecord | undefined;
  return record?.ownerUid === uid && record.projectId === id && record.schemaVersion === 1 && record.access === 'private' ? record : null;
}
function unavailable(): never { throw new ProjectError(404, 'project_unavailable', 'Project unavailable.'); }

export async function createProject(uid: string, input: unknown, deps: ProjectDeps = {}): Promise<ProjectRecord> {
  const parsed = CreateProjectSchema.parse(input);
  const { db, collection, now } = resources(uid, deps);
  const id = `project_${digest([uid, parsed.operationId]).slice(0, 32)}`;
  const ref = collection.doc(id);
  const createHash = digest(parsed.scope);
  return withDocumentOwnerWrite(uid, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      const project = owned(existing.data(), uid, id) ?? unavailable();
      if (project.createHash !== createHash) throw new ProjectError(409, 'operation_conflict', 'This submission key already belongs to another project.');
      return project;
    }
    const project: ProjectRecord = { ...parsed.scope, schemaVersion: 1, projectId: id, ownerUid: uid, workspaceId: `private:${uid}`, access: 'private', revision: 1,
      context: [], workItems: [], createdAt: now, updatedAt: now, createHash,
      history: [{ revision: 1, actorUid: uid, at: now, action: 'create' }], operations: [] };
    tx.set(ref, project);
    tx.set(ref.collection('revisions').doc('r1'), project);
    return project;
  }, db);
}

export async function listProjects(uid: string, deps: ProjectDeps = {}): Promise<ProjectRecord[]> {
  const { collection } = resources(uid, deps);
  const result = await collection.orderBy('updatedAt', 'desc').limit(100).get();
  return result.docs.flatMap((doc) => { const project = owned(doc.data(), uid, doc.id); return project ? [project] : []; }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(uid: string, id: string, deps: ProjectDeps = {}): Promise<ProjectView | null> {
  ProjectIdSchema.parse(id);
  const { db, collection } = resources(uid, deps);
  const snapshot = await collection.doc(id).get();
  const project = owned(snapshot.data(), uid, id);
  if (!project) return null;
  const contextStatus = await Promise.all(project.context.map(async (pin) => {
    const capsule = await getCapsuleAtVersion(uid, pin.capsuleId, pin.version, { db });
    const latest = await db.collection('users').doc(uid).collection('capsules').doc(pin.capsuleId).get();
    const latestRaw = latest.data();
    const latestVersion = latestRaw?.ownerUid === uid && latestRaw.capsuleId === pin.capsuleId && !latestRaw.archivedAt && Number.isSafeInteger(latestRaw.version) ? latestRaw.version as number : null;
    return { capsuleId: pin.capsuleId, status: !capsule || latestVersion === null ? 'unavailable' as const : projectCapsuleHash(capsule) !== pin.contentHash ? 'changed' as const : 'available' as const, latestVersion };
  }));
  return { ...project, contextStatus };
}

/** Read inside the commit transaction so an in-place legacy edit conflicts with pin/use. */
async function readPin(tx: Transaction, db: Firestore, uid: string, capsuleId: string, version: number): Promise<PraxisCapsule> {
  const ref = db.collection('users').doc(uid).collection('capsules').doc(capsuleId);
  const current = await tx.get(ref);
  if (!current.exists || current.data()?.ownerUid !== uid || current.data()?.capsuleId !== capsuleId || current.data()?.archivedAt) throw new ProjectError(409, 'context_unavailable', 'Selected context is unavailable. Inspect and select an accessible revision.');
  const snapshot = current.data()?.version === version ? current : await tx.get(ref.collection('versions').doc(`v${version}`));
  const raw = snapshot.data();
  if (!snapshot.exists || raw?.ownerUid !== uid || raw.capsuleId !== capsuleId || raw.version !== version || raw.archivedAt) throw new ProjectError(409, 'context_unavailable', 'Selected context is unavailable. Inspect and select an accessible revision.');
  return sanitizeCapsule(raw);
}

export async function mutateProject(uid: string, id: string, input: unknown, deps: ProjectDeps = {}): Promise<ProjectRecord> {
  ProjectIdSchema.parse(id);
  const command = ProjectMutationSchema.parse(input);
  const { db, collection, now } = resources(uid, deps);
  const ref = collection.doc(id);
  const hash = digest(command);
  return withDocumentOwnerWrite(uid, async (tx) => {
    const snapshot = await tx.get(ref);
    const current = owned(snapshot.data(), uid, id) ?? unavailable();
    const replay = current.operations.find((operation) => operation.id === command.operationId);
    if (replay) {
      if (replay.hash !== hash) throw new ProjectError(409, 'operation_conflict', 'This submission key has already been used. Reload before submitting different work.');
      return current;
    }
    if (command.expectedRevision !== current.revision) throw new ProjectError(409, 'revision_conflict', 'This project changed elsewhere. Your edits remain in the form; reload the saved project before applying them.');
    // Never evict idempotency receipts: an evicted key could create duplicate work on reconnect.
    if (current.operations.length >= 200) throw new ProjectError(409, 'project_capacity', 'This project reached its local revision limit. Export/revision compaction is not yet available.');
    let next: ProjectRecord = structuredClone(current);
    if (command.action === 'scope') next = { ...next, ...command.scope };
    if (command.action === 'attach') {
      const capsule = await readPin(tx, db, uid, command.capsuleId, command.version);
      const pin: ProjectContextPin = { capsuleId: capsule.capsuleId, version: capsule.version, role: command.role, label: capsule.label,
        contentHash: projectCapsuleHash(capsule), documentIds: capsule.coreRefs.documentCoreIds, sourceIds: capsule.coreRefs.sourceCoreIds };
      next.context = [...next.context.filter((item) => item.capsuleId !== pin.capsuleId), pin];
      if (next.context.length > 20) throw new ProjectError(400, 'context_limit', 'Select up to 20 capsule revisions.');
    }
    if (command.action === 'detach') next.context = next.context.filter((pin) => pin.capsuleId !== command.capsuleId);
    if (command.action === 'add-work') {
      if (next.workItems.length >= 40) throw new ProjectError(400, 'work_limit', 'This project supports up to 40 draft work items.');
      for (const pin of next.context) {
        const capsule = await readPin(tx, db, uid, pin.capsuleId, pin.version);
        if (projectCapsuleHash(capsule) !== pin.contentHash) throw new ProjectError(409, 'context_changed', 'Selected context changed under its version number. Inspect it and deliberately attach a reviewed revision before creating new work.');
      }
      next.workItems.push({ workItemId: `work_${digest([uid, id, command.operationId]).slice(0, 32)}`, title: command.title, instruction: command.instruction, output: command.output,
        state: 'draft', createdAt: now, updatedAt: now, projectRevision: current.revision, scope: projectScope(current), context: structuredClone(current.context) });
    }
    if (command.action === 'cancel-work') {
      const work = next.workItems.find((item) => item.workItemId === command.workItemId);
      if (!work) throw new ProjectError(404, 'work_unavailable', 'Work item unavailable.');
      work.state = 'cancelled'; work.updatedAt = now;
    }
    next.revision++; next.updatedAt = now;
    next.history.push({ revision: next.revision, actorUid: uid, at: now, action: command.action });
    next.operations.push({ id: command.operationId, hash });
    if (Buffer.byteLength(JSON.stringify(next)) > 700_000) throw new ProjectError(400, 'project_size', 'Project size limit reached.');
    tx.set(ref, next);
    tx.set(ref.collection('revisions').doc(`r${next.revision}`), next);
    return next;
  }, db);
}
