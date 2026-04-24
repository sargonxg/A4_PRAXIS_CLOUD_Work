import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  getAnalystProfile,
  upsertAnalystProfile,
} from '@/lib/firebase/analyst-profile-admin';
import {
  AnalystProfileSchema,
  type AnalystProfile,
} from '@/types/analyst-profile';

export const GET = withAuth(async (_req, user) => {
  const profile = await getAnalystProfile(user.uid);
  return NextResponse.json({ profile });
});

type PatchOp = 'add' | 'remove' | 'replace';
interface AssistantPatch {
  path: string;
  op: PatchOp;
  value: unknown;
}

/**
 * Applies an assistant-proposed patch to a profile snapshot and returns the
 * minimal partial-profile that captures the change. The caller passes this
 * partial to `upsertAnalystProfile`, which handles the Firestore merge.
 *
 * Supported paths: any dotted two-segment path into `identity`, `perspective`,
 * or `workingStyle`. Unknown paths throw.
 */
function applyAssistantPatch(
  profile: AnalystProfile | null,
  patch: AssistantPatch,
): Partial<AnalystProfile> {
  const [top, field] = patch.path.split('.');
  if (!top || !field) throw new Error(`invalid path: ${patch.path}`);

  const group = (profile?.[top as keyof AnalystProfile] ?? {}) as Record<string, unknown>;
  const current = group[field];

  let next: unknown;
  if (patch.op === 'replace') {
    next = patch.value;
  } else if (patch.op === 'add') {
    const list = Array.isArray(current) ? [...current] : [];
    if (!list.includes(patch.value)) list.push(patch.value);
    next = list;
  } else if (patch.op === 'remove') {
    const list = Array.isArray(current) ? [...current] : [];
    next = list.filter((v) => v !== patch.value);
  } else {
    throw new Error(`invalid op: ${String(patch.op)}`);
  }

  return { [top]: { ...group, [field]: next } } as Partial<AnalystProfile>;
}

export const PATCH = withAuth(async (req, user) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Assistant-proposed single-field patch: { patch: { path, op, value } }
  if (body && typeof body === 'object' && 'patch' in body && body.patch) {
    try {
      const profile = await getAnalystProfile(user.uid);
      const partial = applyAssistantPatch(profile, body.patch as AssistantPatch);
      const parsed = AnalystProfileSchema.partial().safeParse(partial);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Patch produced invalid profile', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      await upsertAnalystProfile(user.uid, parsed.data);
      return NextResponse.json({ ok: true, applied: body.patch });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'patch failed' },
        { status: 400 },
      );
    }
  }

  // Legacy shape: partial AnalystProfile merged directly
  const partialSchema = AnalystProfileSchema.partial();
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile patch', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await upsertAnalystProfile(user.uid, parsed.data);
  return NextResponse.json({ ok: true });
});
