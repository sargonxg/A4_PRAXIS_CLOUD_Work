/**
 * GET /api/profile/resolved
 *
 * Returns the full "working profile" — everything the AI sees about the user:
 *   { profile, domain, domainVersion, versionsHistory }
 *
 * - profile           → raw AnalystProfile at users/{uid}/profile/analyst
 * - domain            → merged user domain (primary + secondaries) via
 *                       resolveUserDomain()
 * - domainVersion     → version of the resolved domain config
 * - versionsHistory   → last 5 immutable snapshots from
 *                       users/{uid}/profile_versions/{vN}
 *
 * Consumed by the read-only /app/profile page.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { resolveUserDomain } from '@/lib/domain/resolve';
import {
  DEFAULT_ANALYST_PROFILE,
  type AnalystProfile,
} from '@/types/analyst-profile';

interface VersionEntry {
  versionId: string;
  version: number;
  completedAt: unknown;
  snapshotAt: unknown;
  primaryDomain: string;
  lenses: string[];
  audience: string;
}

export const GET = withAuth(async (_req, user) => {
  try {
    const raw = await getAnalystProfile(user.uid);
    const profile: AnalystProfile = raw ?? DEFAULT_ANALYST_PROFILE;

    const domain = await resolveUserDomain({
      perspective: {
        primaryDomain: profile.perspective.primaryDomain,
        secondaryDomains: profile.perspective.secondaryDomains,
      },
    });

    // Last 5 profile versions, newest first
    let versionsHistory: VersionEntry[] = [];
    try {
      const db = getAdminDbOrThrow();
      const snap = await db
        .collection('users')
        .doc(user.uid)
        .collection('profile_versions')
        .get();
      const entries: VersionEntry[] = snap.docs.map((d) => {
        const data = d.data() as Partial<AnalystProfile> & {
          _snapshotAt?: unknown;
        };
        const version = data.meta?.version ?? 0;
        return {
          versionId: d.id,
          version,
          completedAt: data.meta?.completedAt ?? null,
          snapshotAt: data._snapshotAt ?? null,
          primaryDomain: data.perspective?.primaryDomain ?? 'generic',
          lenses: Array.isArray(data.perspective?.lenses)
            ? (data.perspective!.lenses as string[])
            : [],
          audience: data.perspective?.audience ?? 'myself',
        };
      });
      // Sort by version desc, keep top 5
      entries.sort((a, b) => b.version - a.version);
      versionsHistory = entries.slice(0, 5);
    } catch (err) {
      console.warn('[profile/resolved] versions read failed:', err);
      versionsHistory = [];
    }

    return NextResponse.json({
      profile,
      domain,
      domainVersion: domain.version,
      versionsHistory,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[profile/resolved] error:', msg);
    return NextResponse.json({ error: 'Failed to resolve profile' }, { status: 500 });
  }
});
