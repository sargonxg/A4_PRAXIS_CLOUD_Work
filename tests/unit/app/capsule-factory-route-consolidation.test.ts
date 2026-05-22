import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const capsuleRouteSource = readFileSync(join(process.cwd(), 'src/app/api/context/capsules/route.ts'), 'utf8');
const capsuleServiceSource = readFileSync(join(process.cwd(), 'src/lib/context/capsule-service.ts'), 'utf8');

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

  it('keeps new capsule creation private by default', () => {
    expect(capsuleServiceSource).toContain("body.visibility");
    expect(capsuleServiceSource).toContain(": 'private'");
    expect(capsuleRouteSource).toContain('createCapsule(user.uid');
    expect(workbenchSource).toContain('New capsules start private.');
    const createLiteBody = workbenchSource.slice(
      workbenchSource.indexOf('async function createCapsuleLite'),
      workbenchSource.indexOf('async function createCapsuleFromBuilder'),
    );
    expect(createLiteBody).not.toContain("visibility: 'public'");
  });

  it('keeps public/private actions on the existing visibility behavior', () => {
    expect(workbenchSource).toContain("action: 'set-visibility'");
    expect(workbenchSource).toContain("allowDownload: visibility === 'public' ? true");
    expect(workbenchSource).toContain("allowClone: visibility === 'public' ? true");
    expect(workbenchSource).toContain("allowCommunityRating: visibility === 'public' ? capsule.access?.allowCommunityRating ?? false : false");
  });

  it('keeps improve actions review-gated instead of direct canonical mutation', () => {
    expect(workbenchSource).toContain("persistFactoryReviewDiff(diff, 'create-review-diff')");
    expect(workbenchSource).toContain("action: 'create-review-diff'");
    expect(workbenchSource).toContain('Return reviewable capsule improvements, not direct writes.');
    expect(workbenchSource).toContain('Do not silently mutate the capsule');
    expect(workbenchSource).not.toContain('setCapsuleVisibility(capsule, \'improve\'');
  });
});
