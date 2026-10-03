import { FieldPath, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDbOrThrow, getAdminStorage, getDefaultBucketName } from '@/lib/firebase/admin';
import { assertDocumentOwnerWritable, withDocumentOwnerWrite } from '@/lib/documents/owner-write';
import { getCapsuleAtVersion } from '@/lib/context/capsule-version-resolution';
import { normalizeToLatest } from '@/lib/context/capsule-schema';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import { CognitiveCapsuleSchema } from './schema';
import { fromV3 } from './from-v3';
import { canonicalJson, capsuleDigest, contentDigest } from './integrity';
import { bytesDigest, CAPSULE_MIMETYPE, PACKAGE_LIMITS, packCapsule, readCapsulePackage } from './package';
import { cognitiveQuality } from './quality';
import { validateRegistryDependencies } from './registry-validation';
import { RegistryNameSchema, RegistryVersionSchema, type HostedRegistryEntry, type HostedRegistryInstallation, type HostedRegistryList, type HostedRegistryLock, type HostedRegistryRequest } from './hosted-registry-contract';
import type { CognitiveCapsule } from './types';

export class HostedRegistryError extends Error {
  constructor(readonly code: string, message: string, readonly status: 400 | 403 | 404 | 409 | 503 = 400) { super(message); this.name = 'HostedRegistryError'; }
}
export interface RegistryArtifactBucket {
  file: (name: string) => {
    save: (bytes: Buffer, options: { resumable: false; preconditionOpts: { ifGenerationMatch: 0 }; metadata: { contentType: string; cacheControl: string } }) => Promise<unknown>;
    getMetadata: () => Promise<[{ size?: number | string }, ...unknown[]]>;
    download: () => Promise<[Uint8Array, ...unknown[]]>;
    delete: (options: { ignoreNotFound: true }) => Promise<unknown>;
  };
}
type StageInput = { cognition: CognitiveCapsule; registryName: string; registryVersion: string; artifactDigest: string; sourceCapsuleId: string; sourceEnvelopeVersion: number; lock: HostedRegistryLock[]; previousDraftCapsuleId?: string };
export interface HostedRegistryDeps {
  db?: Firestore; bucket?: RegistryArtifactBucket; now?: () => Date;
  stageInstallation?: (uid: string, input: StageInput, transaction: Transaction) => Promise<{ draftCapsuleId: string; reviewCardId: string }>;
}
type StoredEntry = HostedRegistryEntry & { storageObject: string };
const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const LockSchema = z.object({ name: RegistryNameSchema, version: RegistryVersionSchema, digest, capsuleDigest: digest }).strict();
const EntrySchema = LockSchema.extend({ ownerUid: z.string().min(1), sourceCapsuleId: z.string().min(1), sourceEnvelopeVersion: z.number().int().positive(),
  profile: z.string().min(1), publishedAt: z.iso.datetime({ offset: true }), deprecated: z.string().max(600).optional(),
  rights: CognitiveCapsuleSchema.shape.rights, dependencies: CognitiveCapsuleSchema.shape.dependencies,
  quality: z.object({ cognitiveDepth: z.number(), evaluationPosture: z.string(), structuralValidationPassed: z.boolean(), dimensions: z.record(z.string(), z.number()) }).strict(),
  trust: z.object({ structuralValidation: z.literal('passed'), factualTruthVerified: z.literal(false), attestationPosture: z.literal('not-signed'), humanReviewedRecords: z.number(), proposedRecords: z.number() }).strict(),
  storageObject: z.string().min(1),
}).strict();
const InstallationSchema = LockSchema.extend({ ownerUid: z.string().min(1), lock: z.array(LockSchema).max(201), installedAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }), promotion: z.literal('not-promoted'), draftCapsuleId: z.string().min(1), reviewCardId: z.string().min(1) }).strict();

/** Private owner distribution only. Original sources, canonical promotion, organizations and commerce are outside this store. */
export class HostedCapsuleRegistry {
  private readonly db: Firestore;
  private readonly bucket: RegistryArtifactBucket;
  constructor(readonly uid: string, private readonly deps: HostedRegistryDeps = {}) {
    if (!/^[a-zA-Z0-9:_-]{1,180}$/.test(uid)) throw new HostedRegistryError('invalid_owner', 'Invalid registry owner.');
    this.db = deps.db ?? getAdminDbOrThrow();
    this.bucket = deps.bucket ?? getAdminStorage().bucket(getDefaultBucketName());
  }
  private entries() { return this.db.collection('users').doc(this.uid).collection('capsuleRegistry'); }
  private installations() { return this.db.collection('users').doc(this.uid).collection('capsuleRegistryInstallations'); }
  private entryId(name: string, version: string) { RegistryNameSchema.parse(name); RegistryVersionSchema.parse(version); return contentDigest([name, version]).slice(7); }
  private objectPath(digestValue: string) { digest.parse(digestValue); return `users/${this.uid}/capsule-registry/objects/${digestValue.slice(7)}.capsule`; }
  private parseEntry(value: unknown): StoredEntry {
    const entry = EntrySchema.parse(value);
    if (entry.ownerUid !== this.uid || entry.storageObject !== this.objectPath(entry.digest)) throw new HostedRegistryError('registry_identity_mismatch', 'The registry artifact identity is invalid.', 409);
    return entry;
  }
  private parseInstallation(value: unknown): HostedRegistryInstallation {
    const installation = InstallationSchema.parse(value);
    if (installation.ownerUid !== this.uid) throw new HostedRegistryError('registry_identity_mismatch', 'The registry installation owner is invalid.', 409);
    return installation;
  }
  private publicEntry(entry: StoredEntry): HostedRegistryEntry { const { storageObject: _object, ...metadata } = entry; return metadata; }
  private lock(entry: HostedRegistryEntry): HostedRegistryLock { return { name: entry.name, version: entry.version, digest: entry.digest, capsuleDigest: entry.capsuleDigest }; }
  private async entry(name: string, version: string): Promise<StoredEntry> {
    const snapshot = await this.entries().doc(this.entryId(name, version)).get();
    if (!snapshot.exists) throw new HostedRegistryError('registry_version_not_found', 'That immutable version is not present in your private registry.', 404);
    const entry = this.parseEntry(snapshot.data());
    if (entry.name !== name || entry.version !== version) throw new HostedRegistryError('registry_identity_mismatch', 'The registry version identity is invalid.', 409);
    return entry;
  }
  private async artifact(entry: StoredEntry) {
    const file = this.bucket.file(entry.storageObject);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);
    if (!Number.isSafeInteger(size) || size < 1 || size > PACKAGE_LIMITS.maxArchiveBytes) throw new HostedRegistryError('invalid_registry_artifact', 'The registry artifact exceeds the download budget.', 409);
    const [raw] = await file.download(); const bytes = new Uint8Array(raw);
    if (bytes.length !== size || bytesDigest(bytes) !== entry.digest) throw new HostedRegistryError('registry_digest_mismatch', 'The stored artifact digest does not match its immutable version.', 409);
    const { capsule, manifest } = await readCapsulePackage(bytes);
    if (capsule.capsuleId !== entry.name || capsule.version !== entry.version || manifest.capsuleDigest !== entry.capsuleDigest || canonicalJson(capsule.dependencies) !== canonicalJson(entry.dependencies) || canonicalJson(capsule.rights) !== canonicalJson(entry.rights))
      throw new HostedRegistryError('registry_identity_mismatch', 'The stored artifact identity, rights or dependency locks do not match.', 409);
    return { capsule, bytes };
  }
  private requireRights(capsule: CognitiveCapsule) {
    if (capsule.rights.mode === 'licensed' || capsule.rights.mode === 'organization') throw new HostedRegistryError('rights_grant_required', 'This private registry cannot infer organization or licensed distribution rights.', 403);
  }
  private async dependencies(capsule: CognitiveCapsule): Promise<StoredEntry[]> {
    const entries: StoredEntry[] = [];
    try {
      await validateRegistryDependencies(capsule, async (dependency) => {
        const entry = await this.entry(dependency.name, dependency.version);
        const artifact = await this.artifact(entry); this.requireRights(artifact.capsule); entries.push(entry);
        return { entry, capsule: artifact.capsule };
      }, { maxNodes: 200 });
    } catch (error) {
      if (error instanceof HostedRegistryError) throw error;
      throw new HostedRegistryError('dependency_validation_failed', error instanceof Error ? error.message : 'Registry dependencies could not be verified.');
    }
    return entries;
  }
  private async checkLocks(transaction: Transaction, locks: StoredEntry[]): Promise<void> {
    for (const locked of locks) {
      const snapshot = await transaction.get(this.entries().doc(this.entryId(locked.name, locked.version)));
      if (!snapshot.exists) throw new HostedRegistryError('dependency_version_changed', 'A locked dependency is unavailable. Refresh the registry before continuing.', 409);
      const current = this.parseEntry(snapshot.data());
      if (current.digest !== locked.digest || current.deprecated) throw new HostedRegistryError('dependency_version_changed', 'A locked dependency changed or was deprecated. Refresh the registry before continuing.', 409);
    }
  }
  /** Resolve every transitive exact artifact before generation; this never installs or promotes context. */
  async verifyDependencies(capsule: CognitiveCapsule): Promise<HostedRegistryLock[]> {
    await assertDocumentOwnerWritable(this.uid, this.db);
    const parsed = CognitiveCapsuleSchema.parse(capsule); this.requireRights(parsed);
    return (await this.dependencies(parsed)).map((entry) => this.lock(entry))
      .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  }
  async list(options: { cursor?: string; limit?: number } = {}): Promise<HostedRegistryList> {
    await assertDocumentOwnerWritable(this.uid, this.db);
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 50)));
    if (options.cursor && !/^[a-f0-9]{64}$/.test(options.cursor)) throw new HostedRegistryError('invalid_registry_cursor', 'Invalid registry cursor.');
    let query = this.entries().orderBy(FieldPath.documentId()).limit(limit + 1);
    if (options.cursor) query = query.startAfter(options.cursor);
    const [page, installs] = await Promise.all([query.get(), this.installations().limit(501).get()]);
    const installations = installs.docs.slice(0, 500).map((document) => this.parseInstallation(document.data()));
    const entries = page.docs.slice(0, limit).map((document) => {
      const entry = this.publicEntry(this.parseEntry(document.data()));
      return { ...entry, installed: installations.some((installation) => installation.lock.some((locked) => locked.name === entry.name && locked.version === entry.version && locked.digest === entry.digest)) };
    });
    return { entries, installations, hasMore: page.docs.length > limit, nextCursor: page.docs.length > limit ? page.docs[limit - 1].id : null, installationListingComplete: installs.docs.length <= 500, scope: 'owner-private' };
  }
  async publish(input: Extract<HostedRegistryRequest, { operation: 'publish' }>): Promise<HostedRegistryEntry> {
    RegistryNameSchema.parse(input.name); await assertDocumentOwnerWritable(this.uid, this.db);
    const source = await getCapsuleAtVersion(this.uid, input.capsuleId, input.envelopeVersion, { db: this.db, now: this.deps.now });
    if (!source) throw new HostedRegistryError('source_version_not_found', 'That exact saved capsule version is unavailable.', 404);
    if (source.access?.allowDownload !== true) throw new HostedRegistryError('source_download_disabled', 'Enable downloads on the saved capsule before publishing its private package.', 403);
    const original = source.cognition ? CognitiveCapsuleSchema.parse(source.cognition) : fromV3(source.v3 ?? normalizeToLatest(source));
    this.requireRights(original);
    const capsule = { ...original, capsuleId: input.name };
    const bytes = await packCapsule(capsule); const artifactDigest = bytesDigest(bytes);
    const dependencies = await this.dependencies(capsule);
    const ref = this.entries().doc(this.entryId(capsule.capsuleId, capsule.version));
    const prior = await ref.get();
    if (prior.exists) {
      const existing = this.parseEntry(prior.data());
      if (existing.digest !== artifactDigest) throw new HostedRegistryError('immutable_registry_version', 'Published versions are immutable. Save a new semantic version before publishing changes.', 409);
      await this.artifact(existing);
    }
    const quality = cognitiveQuality(capsule);
    const reviewed = [...capsule.nodes, ...capsule.statements, ...capsule.knowledge];
    const entry: StoredEntry = { ownerUid: this.uid, name: capsule.capsuleId, version: capsule.version, digest: artifactDigest, capsuleDigest: capsuleDigest(capsule),
      sourceCapsuleId: source.capsuleId, sourceEnvelopeVersion: source.version, profile: capsule.profile, publishedAt: (this.deps.now?.() ?? new Date()).toISOString(), rights: capsule.rights, dependencies: capsule.dependencies,
      quality: { cognitiveDepth: quality.cognitiveDepth, evaluationPosture: quality.evaluationPosture, structuralValidationPassed: quality.structuralValidationPassed, dimensions: quality.dimensions },
      trust: { structuralValidation: 'passed', factualTruthVerified: false, attestationPosture: 'not-signed', humanReviewedRecords: reviewed.filter((record) => ['accepted', 'reviewed'].includes(record.reviewState)).length, proposedRecords: reviewed.filter((record) => record.reviewState === 'proposed').length },
      storageObject: this.objectPath(artifactDigest) };
    const file = this.bucket.file(entry.storageObject);
    let created = false;
    try { await file.save(Buffer.from(bytes), { resumable: false, preconditionOpts: { ifGenerationMatch: 0 }, metadata: { contentType: CAPSULE_MIMETYPE, cacheControl: 'private, no-store' } }); created = true; }
    catch (error) { if (!error || typeof error !== 'object' || !('code' in error) || Number(error.code) !== 412) throw error; await this.artifact(entry); }
    try {
      return await withDocumentOwnerWrite(this.uid, async (transaction) => {
        const existing = await transaction.get(ref);
        await this.checkLocks(transaction, dependencies);
        const sourceRef = this.db.collection('users').doc(this.uid).collection('capsules').doc(source.capsuleId);
        const currentSource = await transaction.get(sourceRef);
        const latest = currentSource.data();
        if (!currentSource.exists || latest?.ownerUid !== this.uid || latest?.capsuleId !== source.capsuleId || latest?.archivedAt || latest?.access?.allowDownload !== true)
          throw new HostedRegistryError('source_permission_changed', 'The source capsule is no longer available for private publication.', 409);
        const exact = latest.version === source.version ? currentSource : await transaction.get(sourceRef.collection('versions').doc(`v${source.version}`));
        const raw = exact.data();
        if (!exact.exists || raw?.ownerUid !== this.uid || raw?.capsuleId !== source.capsuleId || raw?.version !== source.version || raw?.archivedAt || raw?.access?.allowDownload !== true)
          throw new HostedRegistryError('source_version_changed', 'The exact saved source is no longer available for publication.', 409);
        const pinned = sanitizeCapsule(raw);
        const pinnedCognition = pinned.cognition ? CognitiveCapsuleSchema.parse(pinned.cognition) : fromV3(pinned.v3 ?? normalizeToLatest(pinned));
        if (capsuleDigest(pinnedCognition) !== capsuleDigest(original))
          throw new HostedRegistryError('source_version_changed', 'The saved source changed while preparing publication. Save and select a new version.', 409);
        if (existing.exists) {
          const current = this.parseEntry(existing.data());
          if (current.digest !== artifactDigest) throw new HostedRegistryError('immutable_registry_version', 'Another publication already occupies that immutable version.', 409);
          return this.publicEntry(current);
        }
        transaction.set(ref, JSON.parse(JSON.stringify(EntrySchema.parse(entry)))); return this.publicEntry(entry);
      }, this.db);
    } catch (error) {
      // A late upload must not survive an account-erasure race. Other ordinary failures leave only owner-scoped retryable artifacts.
      const owner = await this.db.collection('users').doc(this.uid).get().catch(() => null);
      if (created && (!owner?.exists || ['deleting', 'deleted'].includes(String(owner.data()?.accountDeletionStatus)))) await file.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw error;
    }
  }
  async pull(name: string, version: string) {
    await assertDocumentOwnerWritable(this.uid, this.db); const entry = await this.entry(name, version);
    const { bytes } = await this.artifact(entry); return { entry: this.publicEntry(entry), bytes };
  }
  private async installVersion(name: string, version: string, expectedDigest?: string): Promise<HostedRegistryInstallation> {
    await assertDocumentOwnerWritable(this.uid, this.db);
    const entry = await this.entry(name, version); const artifact = await this.artifact(entry); this.requireRights(artifact.capsule);
    if (entry.deprecated) throw new HostedRegistryError('registry_version_deprecated', 'Choose a current version before installing.', 409);
    const dependencies = await this.dependencies(artifact.capsule);
    const installationRef = this.installations().doc(contentDigest(name).slice(7));
    const saved = await installationRef.get(); const previous = saved.exists ? this.parseInstallation(saved.data()) : null;
    if (expectedDigest && previous?.digest !== expectedDigest) throw new HostedRegistryError('installation_changed', 'The installed version changed. Refresh before updating.', 409);
    if (!expectedDigest && previous && previous.digest !== entry.digest) throw new HostedRegistryError('explicit_update_required', 'A different version is already installed. Review an explicit update.', 409);
    if (previous?.digest === entry.digest) return previous;
    const lock = [entry, ...dependencies].map((record) => this.lock(record)).sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
    const stagedInput: StageInput = { cognition: artifact.capsule, registryName: name, registryVersion: version, artifactDigest: entry.digest, sourceCapsuleId: entry.sourceCapsuleId, sourceEnvelopeVersion: entry.sourceEnvelopeVersion, lock,
      ...(previous ? { previousDraftCapsuleId: previous.draftCapsuleId } : {}) };
    return withDocumentOwnerWrite(this.uid, async (transaction) => {
      const current = await transaction.get(installationRef); await this.checkLocks(transaction, [entry, ...dependencies]);
      const actual = current.exists ? this.parseInstallation(current.data()) : null;
      if (actual?.digest === entry.digest) return actual;
      if (actual?.digest !== previous?.digest) throw new HostedRegistryError('installation_changed', 'The installation changed while preparing review. Refresh before continuing.', 409);
      // The staging helper performs its reads before writes in this same transaction.
      // A failed CAS/lock validation cannot leave a reviewable draft or change context.
      const staged = this.deps.stageInstallation ? await this.deps.stageInstallation(this.uid, stagedInput, transaction) : await this.stage(stagedInput, transaction);
      const now = (this.deps.now?.() ?? new Date()).toISOString();
      const installation: HostedRegistryInstallation = { ...this.lock(entry), ownerUid: this.uid, lock, installedAt: actual?.installedAt ?? now, updatedAt: now, promotion: 'not-promoted', ...staged };
      transaction.set(installationRef, JSON.parse(JSON.stringify(InstallationSchema.parse(installation)))); return installation;
    }, this.db);
  }
  private async stage(input: StageInput, transaction: Transaction) {
    const { stageCognitiveCapsuleDraft } = await import('@/lib/context/capsule-service');
    const result = await stageCognitiveCapsuleDraft(this.uid, input.cognition, { capsuleId: `registry-${contentDigest([this.uid, input.registryName, input.registryVersion, input.artifactDigest]).slice(7, 39)}`, label: input.registryName,
      memoryPosture: { registryInstallation: { registryName: input.registryName, registryVersion: input.registryVersion, artifactDigest: input.artifactDigest, lockedDependencies: input.lock, sourceCapsuleId: input.sourceCapsuleId, sourceEnvelopeVersion: input.sourceEnvelopeVersion,
        ...(input.previousDraftCapsuleId ? { previousDraftCapsuleId: input.previousDraftCapsuleId } : {}) } } }, { db: this.db, now: this.deps.now }, transaction);
    return { draftCapsuleId: result.capsule.capsuleId, reviewCardId: result.reviewCard.reviewCardId };
  }
  install(name: string, version: string) { return this.installVersion(name, version); }
  update(name: string, version: string, expectedDigest: string) { digest.parse(expectedDigest); return this.installVersion(name, version, expectedDigest); }
  async deprecate(name: string, version: string, reason: string) {
    const note = z.string().trim().min(1).max(600).parse(reason);
    return withDocumentOwnerWrite(this.uid, async (transaction) => {
      const ref = this.entries().doc(this.entryId(name, version)); const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HostedRegistryError('registry_version_not_found', 'That private registry version is unavailable.', 404);
      const entry = this.parseEntry(snapshot.data()); const next = { ...entry, deprecated: note };
      transaction.set(ref, JSON.parse(JSON.stringify(next))); return this.publicEntry(next);
    }, this.db);
  }
  async fork(name: string, version: string, newName: string) {
    RegistryNameSchema.parse(newName); if (newName === name) throw new HostedRegistryError('distinct_fork_required', 'A fork needs a distinct publisher/name.');
    await assertDocumentOwnerWritable(this.uid, this.db); const entry = await this.entry(name, version); const { capsule } = await this.artifact(entry); this.requireRights(capsule);
    const fork = { ...capsule, capsuleId: newName, version: '0.1.0' };
    const bytes = await packCapsule(fork); return { bytes, name: newName, version: fork.version, digest: bytesDigest(bytes), published: false as const };
  }
  async impact(name: string, version: string) {
    await assertDocumentOwnerWritable(this.uid, this.db); const target = await this.entry(name, version);
    const [versions, installations, capsules] = await Promise.all([this.entries().limit(501).get(), this.installations().limit(501).get(), this.db.collection('users').doc(this.uid).collection('capsules').limit(501).get()]);
    const entries = versions.docs.slice(0, 500).map((document) => this.parseEntry(document.data()));
    const dependsOn = (entry: StoredEntry, names: Set<string>) => entry.dependencies.some((dependency) => names.has(`${dependency.name}@${dependency.version}#${dependency.digest}`));
    const targetKey = `${target.name}@${target.version}#${target.digest}`;
    const direct = entries.filter((entry) => dependsOn(entry, new Set([targetKey])));
    const affected = new Set([targetKey]); let changed = true;
    while (changed) { changed = false; for (const entry of entries) { const key = `${entry.name}@${entry.version}#${entry.digest}`; if (!affected.has(key) && dependsOn(entry, affected)) { affected.add(key); changed = true; } } }
    const transitive = entries.filter((entry) => affected.has(`${entry.name}@${entry.version}#${entry.digest}`) && entry.name !== target.name);
    const uses = installations.docs.slice(0, 500).map((document) => this.parseInstallation(document.data())).filter((installation) => installation.lock.some((locked) => locked.digest === target.digest));
    const capsuleConsumers = capsules.docs.slice(0, 500).flatMap((document) => {
      const capsule = document.data(); const parsed = CognitiveCapsuleSchema.safeParse(capsule.cognition);
      if (capsule.ownerUid !== this.uid || capsule.archivedAt || !parsed.success || !parsed.data.dependencies.some((dependency) => dependency.name === target.name && dependency.version === target.version && dependency.digest === target.digest)) return [];
      return [{ capsuleId: String(capsule.capsuleId), version: Number(capsule.version), label: String(capsule.label ?? capsule.capsuleId) }];
    });
    return { scope: 'owner-registry-and-capsules' as const, target: this.publicEntry(target), directDependents: direct.map((entry) => this.publicEntry(entry)), transitiveDependents: transitive.map((entry) => this.publicEntry(entry)), installations: uses, capsuleConsumers,
      complete: versions.docs.length <= 500 && installations.docs.length <= 500 && capsules.docs.length <= 500, activeRunImpact: 'not-indexed' as const };
  }
}
