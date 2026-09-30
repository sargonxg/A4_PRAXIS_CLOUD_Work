import { describe, expect, it } from 'vitest';
import { HOME_SIDEBAR_DESTINATIONS, itemMatchesPath, primaryNavForPath } from '@/lib/navigation/primary-nav';

describe('primary navigation selection', () => {
  it('does not select Home for every app descendant', () => {
    expect(itemMatchesPath({ href: '/app' }, '/app/capsules/new')).toBe(false);
    expect(itemMatchesPath({ href: '/app/capsules' }, '/app/capsules/new')).toBe(true);
  });
  it('selects the query-specific marketplace without also selecting Capsules', () => {
    expect(primaryNavForPath('/app/capsules?lane=marketplace')?.id).toBe('marketplace');
    expect(primaryNavForPath('/app/capsules?lane=repository')?.id).toBe('capsules');
    expect(itemMatchesPath({ href: '/app/capsules?lane=marketplace' }, '/app/capsules')).toBe(false);
  });
  it('keeps Drafts within Home and aligns destination names with the app', () => {
    expect(HOME_SIDEBAR_DESTINATIONS.map(({ label }) => label)).toEqual(['Home', 'Capsules', 'Boardroom', 'Recent work', 'Drafts']);
    expect(itemMatchesPath({ href: '/app?panel=memo' }, '/app?panel=memo')).toBe(true);
    expect(itemMatchesPath({ href: '/app?panel=memo' }, '/app?panel=builder')).toBe(false);
  });
});
