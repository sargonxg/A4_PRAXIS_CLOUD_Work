import { describe, expect, it } from 'vitest';
import { memoDocumentId } from '@/lib/firebase/memo-service';

describe('memo service helpers', () => {
  it('builds stable Firestore document ids for case/template drafts', () => {
    expect(memoDocumentId('case/with#unsafe', 'policy-memo')).toBe('case_with_unsafe__policy-memo');
  });
});
