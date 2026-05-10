#!/usr/bin/env tsx
/**
 * v4-readiness stub: User-model versioning.
 *
 * When implemented, will check that the user_model_versions store (Postgres
 * target, Firestore profile_versions interim) is append-only — every profile
 * mutation produces a new immutable version, prior versions are never
 * overwritten or deleted.
 */
const PHASE = "v4 Phase 3 (Module M3 User Model)";
console.error(
  `[audit:user-model-versioning] not yet implemented — see ${PHASE}. ` +
    `Will enforce append-only user_model_versions storage.`,
);
process.exit(2);

export {};
