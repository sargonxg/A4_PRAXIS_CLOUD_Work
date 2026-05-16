import { buildInitialACHMatrix } from '@/lib/sats/ach-store';

export const SAMPLE_ACH_MATRIX = buildInitialACHMatrix({
  uid: 'sample-user',
  caseId: 'user-case',
  achId: 'sample-ach',
  title: 'User workspace ACH',
  now: '2026-05-16T00:00:00.000Z',
});
