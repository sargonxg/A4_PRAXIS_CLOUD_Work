import { describe, expect, it } from 'vitest';
import { HOME_SIDEBAR_DESTINATIONS, NAV_GROUPS, itemMatchesPath, primaryNavForPath } from '@/lib/navigation/primary-nav';

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
  it('keeps Chat and Capsules primary with deeper work available under More', () => {
    expect(HOME_SIDEBAR_DESTINATIONS.map(({ label }) => label)).toEqual(['Chat', 'Capsules']);
    expect(NAV_GROUPS.find((group) => group.id === 'workspace')?.items.map(({ id }) => id)).toEqual(['home', 'capsules']);
    expect(NAV_GROUPS.find((group) => group.id === 'advanced')).toMatchObject({ label: 'More', defaultOpen: false });
    expect(primaryNavForPath('/app/boardroom')?.id).toBe('boardroom');
    expect(primaryNavForPath('/signal')?.id).toBe('signal');
    expect(primaryNavForPath('/app/conversations/saved-a?capsuleId=case-a')?.id).toBe('home');
    expect(itemMatchesPath({ href: '/app?panel=memo' }, '/app?panel=memo')).toBe(true);
    expect(itemMatchesPath({ href: '/app?panel=memo' }, '/app?panel=builder')).toBe(false);
  });
});
