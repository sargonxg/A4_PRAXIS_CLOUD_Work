import type { ContextRetrievalPolicy } from '@/types/context-engine';
import type {
  CapsuleAccessPolicy,
  CapsuleCommunityProfile,
  CapsuleCoreRefs,
  CapsuleLockKind,
  CapsuleTrustSemaphore,
  PraxisCapsule,
} from '@/lib/context/capsule-service';

export const CORE_PACKAGE_FORMAT = 'praxis.context-core.package';
export const CORE_PACKAGE_SCHEMA_VERSION = 1;
export const CORE_PACKAGE_EXTENSION = '.core';
export const CORE_PACKAGE_MIME = 'application/praxis-core+json';

export interface PraxisCorePackageV1 {
  format: typeof CORE_PACKAGE_FORMAT;
  schemaVersion: typeof CORE_PACKAGE_SCHEMA_VERSION;
  packageId: string;
  exportedAt: string;
  capsule: {
    capsuleId: string;
    label: string;
    scope: PraxisCapsule['scope'];
    version: number;
    schemaVersion: PraxisCapsule['schemaVersion'];
    coreRefs: CapsuleCoreRefs;
    retrievalPolicy: ContextRetrievalPolicy;
    lockedCoreKinds: CapsuleLockKind[];
    health: PraxisCapsule['health'];
    trust: CapsuleTrustSemaphore;
    access: CapsuleAccessPolicy;
    community: CapsuleCommunityProfile;
    provenance: PraxisCapsule['provenance'];
    createdAt: string;
    updatedAt: string;
  };
  portability: {
    extension: typeof CORE_PACKAGE_EXTENSION;
    mimeType: typeof CORE_PACKAGE_MIME;
    privateByDefault: true;
    ownerScopedUnlessPublic: true;
    cloneCreatesNewOwnerObject: true;
  };
}

export function buildCorePackage(capsule: PraxisCapsule, now = new Date()): PraxisCorePackageV1 {
  const exportedAt = now.toISOString();
  return {
    format: CORE_PACKAGE_FORMAT,
    schemaVersion: CORE_PACKAGE_SCHEMA_VERSION,
    packageId: `${capsule.capsuleId}@v${capsule.version}`,
    exportedAt,
    capsule: {
      capsuleId: capsule.capsuleId,
      label: capsule.label,
      scope: capsule.scope,
      version: capsule.version,
      schemaVersion: capsule.schemaVersion,
      coreRefs: capsule.coreRefs,
      retrievalPolicy: capsule.retrievalPolicy,
      lockedCoreKinds: capsule.lockedCoreKinds,
      health: capsule.health,
      trust: capsule.trust,
      access: capsule.access,
      community: capsule.community,
      provenance: capsule.provenance,
      createdAt: capsule.createdAt,
      updatedAt: capsule.updatedAt,
    },
    portability: {
      extension: CORE_PACKAGE_EXTENSION,
      mimeType: CORE_PACKAGE_MIME,
      privateByDefault: true,
      ownerScopedUnlessPublic: true,
      cloneCreatesNewOwnerObject: true,
    },
  };
}

export function corePackageFilename(capsule: Pick<PraxisCapsule, 'label' | 'capsuleId'>): string {
  const slug = (capsule.label || capsule.capsuleId)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${slug || capsule.capsuleId}${CORE_PACKAGE_EXTENSION}`;
}

export function parseCorePackage(input: unknown): PraxisCorePackageV1 | null {
  if (!isRecord(input)) return null;
  if (input.format !== CORE_PACKAGE_FORMAT || input.schemaVersion !== CORE_PACKAGE_SCHEMA_VERSION) return null;
  const capsule = isRecord(input.capsule) ? input.capsule : null;
  if (!capsule) return null;
  if (typeof capsule.label !== 'string' || typeof capsule.coreRefs !== 'object' || typeof capsule.retrievalPolicy !== 'object') {
    return null;
  }
  return input as unknown as PraxisCorePackageV1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
