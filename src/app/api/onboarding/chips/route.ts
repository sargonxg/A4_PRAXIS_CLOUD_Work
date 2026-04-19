import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FALLBACK_CHIPS, getMandateChips, getRedLineChips } from '@/lib/constants/onboarding-chips';
import type { AnalystRole } from '@/types/analyst-profile';

export const GET = withAuth(async (req, _user) => {
  const url = new URL(req.url);
  const role = (url.searchParams.get('role') ?? 'other') as AnalystRole;
  const field = url.searchParams.get('field') ?? 'mandate';

  // Try Firestore config first
  try {
    const db = getAdminDbOrThrow();
    const snap = await db.collection('config').doc('onboarding_suggestions').get();
    if (snap.exists) {
      const cfg = snap.data() as typeof FALLBACK_CHIPS;
      if (field === 'mandate' && cfg.mandateChipsByRole[role]) {
        return NextResponse.json({ chips: cfg.mandateChipsByRole[role] });
      }
      if (field === 'redLines' && cfg.redLineChips) {
        return NextResponse.json({ chips: cfg.redLineChips });
      }
      if (field === 'orgAutocomplete' && cfg.orgAutocomplete) {
        return NextResponse.json({ chips: cfg.orgAutocomplete });
      }
    }
  } catch {
    /* fall through to hardcoded */
  }

  // Hardcoded fallback
  if (field === 'mandate') return NextResponse.json({ chips: getMandateChips(role) });
  if (field === 'redLines') return NextResponse.json({ chips: getRedLineChips() });
  if (field === 'orgAutocomplete') return NextResponse.json({ chips: FALLBACK_CHIPS.orgAutocomplete });
  return NextResponse.json({ chips: [] });
});
