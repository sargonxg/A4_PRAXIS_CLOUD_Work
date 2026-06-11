import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { bumpCapsuleVersion, getCapsule, type CapsuleCoreRefs, type PraxisCapsule } from '@/lib/context/capsule-service';
import { CapsuleFactoryReviewDiffSchema, type CapsuleFactoryReviewDiff } from '@/lib/genkit/schemas/capsule-factory';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ addedCoreRefs: [], removedCoreRefs: [], changedRetrievalPolicy: false, healthDelta: 0 });
    }
    const { capsuleId } = await context.params;
    const url = new URL(request.url);
    const fromVersion = parseVersion(url.searchParams.get('from'));
    const toVersion = parseVersion(url.searchParams.get('to'));
    if (!fromVersion || !toVersion) {
      return NextResponse.json({ error: 'from and to must look like v3 or 3' }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      loadCapsuleVersion(user.uid, capsuleId, fromVersion),
      loadCapsuleVersion(user.uid, capsuleId, toVersion),
    ]);
    if (!from || !to) return NextResponse.json({ error: 'Capsule version not found' }, { status: 404 });

    const fromRefs = flattenCoreRefs(from);
    const toRefs = flattenCoreRefs(to);
    return NextResponse.json({
      addedCoreRefs: [...toRefs].filter((ref) => !fromRefs.has(ref)).sort(),
      removedCoreRefs: [...fromRefs].filter((ref) => !toRefs.has(ref)).sort(),
      changedRetrievalPolicy: JSON.stringify(from.retrievalPolicy) !== JSON.stringify(to.retrievalPolicy),
      healthDelta: (to.health?.score ?? 0) - (from.health?.score ?? 0),
      fieldDiffs: buildCapsuleFieldDiffs(from, to),
    });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/diff');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot apply private capsule diffs' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const action = typeof raw?.action === 'string' ? raw.action : 'create-review-diff';
    const parsed = CapsuleFactoryReviewDiffSchema.safeParse(raw?.diff ?? raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule factory diff', details: parsed.error.flatten() }, { status: 400 });
    }
    const diff = { ...parsed.data, capsuleId };
    const ref = getAdminDbOrThrow()
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsuleId)
      .collection('factory_diffs')
      .doc(diff.diffId);

    if (action === 'reject') {
      const rejected = { ...diff, reviewState: 'rejected' as const };
      await ref.set({ ...rejected, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ diff: rejected });
    }

    if (action === 'apply') {
      if (!diff.confirmation.confirmedAt || !diff.confirmation.confirmedBy) {
        return NextResponse.json({ error: 'Factory diff apply requires explicit confirmation' }, { status: 409 });
      }
      const capsule = await getCapsule(user.uid, capsuleId);
      if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
      const capsulePatch = patchFromFactoryDiff(capsule, diff);
      const updated = await bumpCapsuleVersion(user.uid, capsuleId, capsulePatch);
      const applied = { ...diff, reviewState: 'applied' as const, appliedVersion: updated?.version ?? null };
      await ref.set({ ...applied, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ diff: applied, capsule: updated });
    }

    if (action !== 'create-review-diff') {
      return NextResponse.json({ error: 'Unsupported capsule diff action' }, { status: 400 });
    }

    await ref.set({ ...diff, reviewState: 'reviewed', updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ diff: { ...diff, reviewState: 'reviewed' } }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/diff/factory');
  }
});

async function loadCapsuleVersion(uid: string, capsuleId: string, version: number): Promise<PraxisCapsule | null> {
  const current = await getCapsule(uid, capsuleId);
  if (current?.version === version) return current;
  const snap = await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('capsules')
    .doc(capsuleId)
    .collection('versions')
    .doc(`v${version}`)
    .get();
  return snap.exists ? (snap.data() as PraxisCapsule) : null;
}

type DiffRow = {
  id: string;
  label: string;
  state: 'added' | 'removed' | 'changed';
  before: unknown;
  after: unknown;
};

function buildCapsuleFieldDiffs(from: PraxisCapsule, to: PraxisCapsule): Record<'label' | 'summary' | 'claimLedger' | 'sourceRefs', DiffRow[]> {
  return {
    label: scalarDiffRows('label', 'Label', from.label, to.label),
    summary: scalarDiffRows('summary', 'Summary', from.summary ?? '', to.summary ?? ''),
    claimLedger: listDiffRows(from.claimLedger, to.claimLedger, 'claim'),
    sourceRefs: listDiffRows(from.sourceRefs, to.sourceRefs, 'source'),
  };
}

function scalarDiffRows(id: string, label: string, before: unknown, after: unknown): DiffRow[] {
  return stableJson(before) === stableJson(after)
    ? []
    : [{ id, label, state: 'changed', before, after }];
}

function listDiffRows(before: unknown, after: unknown, fallbackPrefix: string): DiffRow[] {
  const beforeRows = rowMap(before, fallbackPrefix);
  const afterRows = rowMap(after, fallbackPrefix);
  const ids = unique([...beforeRows.keys(), ...afterRows.keys()]).sort();
  return ids.flatMap((id): DiffRow[] => {
    const oldRow = beforeRows.get(id);
    const newRow = afterRows.get(id);
    if (!oldRow && newRow) return [{ id, label: newRow.label, state: 'added', before: null, after: newRow.value }];
    if (oldRow && !newRow) return [{ id, label: oldRow.label, state: 'removed', before: oldRow.value, after: null }];
    if (oldRow && newRow && stableJson(oldRow.value) !== stableJson(newRow.value)) {
      return [{ id, label: newRow.label || oldRow.label, state: 'changed', before: oldRow.value, after: newRow.value }];
    }
    return [];
  });
}

function rowMap(value: unknown, fallbackPrefix: string): Map<string, { label: string; value: unknown }> {
  const rows = Array.isArray(value) ? value : [];
  return new Map(rows.map((row, index) => {
    const record: Record<string, unknown> = isRecord(row) ? row : { value: row };
    const id = stringField(record.claimId)
      ?? stringField(record.sourceId)
      ?? stringField(record.id)
      ?? `${fallbackPrefix}-${index + 1}`;
    const label = stringField(record.text)
      ?? stringField(record.label)
      ?? stringField(record.title)
      ?? id;
    return [id, { label, value: row }];
  }));
}

function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseVersion(value: string | null): number | null {
  const match = value?.match(/^v?(\d+)$/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function flattenCoreRefs(capsule: PraxisCapsule): Set<string> {
  const refs = capsule.coreRefs;
  return new Set([
    refs.userCoreId ? `user:${refs.userCoreId}` : null,
    refs.teamCoreId ? `team:${refs.teamCoreId}` : null,
    refs.situationCoreId ? `situation:${refs.situationCoreId}` : null,
    refs.graphCoreId ? `graph:${refs.graphCoreId}` : null,
    ...refs.sourceCoreIds.map((id) => `source:${id}`),
    ...refs.documentCoreIds.map((id) => `document:${id}`),
    ...refs.outputCoreIds.map((id) => `output:${id}`),
  ].filter((ref): ref is string => Boolean(ref)));
}

function patchFromFactoryDiff(capsule: PraxisCapsule, diff: CapsuleFactoryReviewDiff) {
  const laneTags = diff.laneImprovements.flatMap((lane) => [
    `factory:${lane.laneId}`,
    ...lane.proposedTags.map((tag) => `factory:${tag.replace(/^factory:/, '')}`),
  ]);
  const proposed = diff.proposedCores;
  const coreRefs: Partial<CapsuleCoreRefs> = {
    userCoreId: proposed.find((core) => core.kind === 'user')?.label ?? capsule.coreRefs.userCoreId,
    situationCoreId: proposed.find((core) => core.kind === 'situation')?.label ?? capsule.coreRefs.situationCoreId,
    sourceCoreIds: unique([
      ...capsule.coreRefs.sourceCoreIds,
      ...proposed.filter((core) => core.kind === 'source').flatMap((core) => core.provenanceIds.length ? core.provenanceIds : [stableCoreId(core.label)]),
    ]),
    toolCoreIds: unique([
      ...(capsule.coreRefs.toolCoreIds ?? []),
      ...proposed.filter((core) => core.kind === 'tool').map((core) => stableCoreId(core.label)),
    ]),
    outputCoreIds: unique([
      ...capsule.coreRefs.outputCoreIds,
      ...proposed.filter((core) => core.kind === 'output').map((core) => stableCoreId(core.label)),
    ]),
  };
  return {
    coreRefs,
    community: {
      tags: unique([
        ...(capsule.community.tags ?? []),
        'factory:applied',
        'factory:review-confirmed',
        ...laneTags,
      ]).slice(0, 40),
    },
  };
}

function stableCoreId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'factory-core';
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
