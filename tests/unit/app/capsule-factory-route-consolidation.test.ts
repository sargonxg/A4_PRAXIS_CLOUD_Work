import { describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: navigation.redirect,
}));

describe('Capsules route consolidation', () => {
  it('keeps /app/repository as a compatibility redirect to the Repository lane', async () => {
    const { default: RepositoryPage } = await import('@/app/app/repository/page');

    expect(() => RepositoryPage()).toThrow('NEXT_REDIRECT:/app/capsules?lane=repository');
    expect(navigation.redirect).toHaveBeenCalledWith('/app/capsules?lane=repository');
  });

  it('promotes only Capsules as the primary capsule workspace', async () => {
    const { NAV_GROUPS, PRIMARY_NAV } = await import('@/lib/navigation/primary-nav');
    const workspaceItems = NAV_GROUPS.find((group) => group.id === 'workspace')?.items ?? [];

    expect(workspaceItems.map((item) => item.id)).toEqual(['home', 'capsules']);
    expect(PRIMARY_NAV.some((item) => item.id === 'repository')).toBe(false);
    expect(PRIMARY_NAV.find((item) => item.id === 'capsules')).toMatchObject({
      label: 'Capsules',
      href: '/app/capsules',
    });
  });

  it('removes Repository as a standalone command palette destination', async () => {
    const { COMMANDS } = await import('@/components/shared/global-search');

    expect(COMMANDS.find((command) => command.id === 'open-repository')).toBeUndefined();
    expect(COMMANDS.find((command) => command.id === 'open-capsule-factory')).toMatchObject({
      label: 'Open Capsules',
      href: '/app/capsules',
    });
    expect(COMMANDS.find((command) => command.id === 'open-repository-lane')).toMatchObject({
      label: 'Open Repository lane',
      href: '/app/capsules?lane=repository',
    });
  });
});
