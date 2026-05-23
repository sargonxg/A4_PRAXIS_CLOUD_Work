import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCapsuleInventorySummary,
  sanitizeCapsule,
} from '../src/lib/context/capsule-service';

const root = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function requireIncludes(relativePath: string, snippets: string[]) {
  const source = read(relativePath);
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${relativePath} missing required inventory contract snippet: ${snippet}`);
  }
}

const activeRaw = {
  capsuleId: 'inventory-active',
  ownerUid: 'u1',
  label: 'Inventory active',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  schemaVersion: 2,
  version: 1,
  access: { visibility: 'public' },
  community: { tags: ['type:situation', 'domain:diplomacy', 'team:diplomatic'] },
  coreRefs: {
    sourceCoreIds: ['src-1', 'src-1', ''],
    documentCoreIds: ['doc-1'],
    toolCoreIds: ['ask-praxis', 'ask-praxis'],
    outputCoreIds: ['options-memo'],
    productCoreIds: ['options-memo'],
  },
};

const archivedLegacyRaw = {
  capsuleId: 'inventory-archived',
  ownerUid: 'u1',
  label: 'Inventory archived',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  schemaVersion: 1,
  version: 1,
  archivedAt: '2026-05-13T00:00:00.000Z',
  activeForSituationIds: ['sit-archived'],
  community: { tags: ['starter', 'type:tool', 'domain:audit-review'] },
  coreRefs: {
    sourceCoreIds: ['archived-src'],
    documentCoreIds: ['archived-doc'],
    toolCoreIds: ['sourceability'],
    outputCoreIds: ['archived-output'],
  },
};

const summary = buildCapsuleInventorySummary([
  sanitizeCapsule(activeRaw),
  sanitizeCapsule(archivedLegacyRaw),
], {
  rawCapsules: [activeRaw, archivedLegacyRaw],
});

assert(summary.storedCapsules === 2, 'storedCapsules should include archived capsules');
assert(summary.activeCapsules === 1, 'activeCapsules should exclude archived capsules');
assert(summary.archivedCapsules === 1, 'archivedCapsules should be reported separately');
assert(summary.publicCapsules === 1, 'public capsule count should use active capsules only');
assert(summary.privateCapsules === 0, 'private count should not include archived capsules');
assert(summary.sourceReferences === 1, 'sourceReferences should dedupe active refs and exclude archived refs');
assert(summary.documentReferences === 1, 'documentReferences should count active refs only');
assert(summary.toolReferences === 1, 'toolReferences should dedupe active refs');
assert(summary.outputReferences === 1, 'outputReferences should dedupe output/product refs together');
assert(summary.byDomain.some((item) => item.id === 'diplomacy' && item.count === 1), 'active domain bucket missing');
assert(!summary.byDomain.some((item) => item.id === 'audit-review'), 'archived domain leaked into active buckets');
assert(summary.integrityWarnings.some((warning) => warning.reason === 'core_refs_normalized'), 'normalized ref warning missing');
assert(summary.integrityWarnings.some((warning) => warning.reason === 'legacy_v1_normalized_to_v2'), 'legacy v1 warning missing');
assert(summary.integrityWarnings.some((warning) => warning.reason === 'archived_capsule_has_active_situations'), 'archived active situation warning missing');
assert(summary.integrityWarnings.some((warning) => warning.reason === 'starter_missing_snapshot'), 'starter snapshot warning missing');

requireIncludes('src/app/api/context/capsules/route.ts', [
  'listCapsuleInventory',
  'createEmptyCapsuleInventorySummary',
  'return NextResponse.json({ ...inventory, persisted: true })',
]);

requireIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'CapsuleInventorySummary',
  'setCapsuleInventorySummary(library.summary',
  'activeCapsules',
  'archivedCapsules',
  'countUniqueCoreRefs',
]);

requireIncludes('src/lib/product/context-capsules.ts', [
  'if (isArchived) continue;',
  'uniqueStrings(capsule.coreRefs?.sourceCoreIds ?? []).length',
]);

requireIncludes('tests/unit/lib/context/capsule-service.test.ts', [
  'builds an active inventory summary while keeping archived capsules separately counted',
  'reports advisory inventory integrity warnings without mutating stored capsules',
]);

console.log('capsule inventory audit passed');
