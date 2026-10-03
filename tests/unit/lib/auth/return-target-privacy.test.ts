import { describe, expect, it } from 'vitest';
import { resolvePostLoginRedirect, safeWorkspaceReturnTarget, safeWorkspaceSearchParams } from '@/lib/auth/post-login-redirect';
describe('auth return target privacy', () => {
  it('strips analytical context, nested redirects, unknown fields and fragments', () => {
    expect(safeWorkspaceReturnTarget('/app?panel=memo&prompt=Private&capsulePrompt=Private&question=Private&capsuleOutput=Private&organization=Private&redirect=/app?prompt=Private#Private')).toBe('/app?panel=memo');
  });
  it('retains a validated opaque handoff alongside supported navigation', () => {
    const path='/app?panel=memo&handoff=a7fc6ad8-73f0-4b83-a55d-7602777e02c4';
    expect(safeWorkspaceReturnTarget(path)).toBe(path);
    expect(resolvePostLoginRedirect(new URLSearchParams({redirect:path}),false,false)).not.toContain('Private');
    expect(safeWorkspaceReturnTarget('/app?handoff=Private%20question')).toBe('/app');
  });
  it('rejects unsafe paths and removes invalid routing values', () => {
    expect(safeWorkspaceReturnTarget('/app?panel=Private%20question&capsuleId=Private%20question')).toBe('/app');
    expect(safeWorkspaceReturnTarget('//evil.test/app')).toBeNull();
    expect(safeWorkspaceReturnTarget('/app/%2f%2fevil.test')).toBeNull();
  });
  it('retains current project and settings navigation and ignores prototype keys', () => {
    expect(safeWorkspaceReturnTarget('/app/projects?projectId=project_123')).toBe('/app/projects?projectId=project_123');
    for (const tab of ['usage', 'security', 'connectors', 'workspace']) expect(safeWorkspaceReturnTarget(`/app/settings?tab=${tab}`)).toBe(`/app/settings?tab=${tab}`);
    expect(safeWorkspaceSearchParams(new URLSearchParams('constructor=Private&toString=Private&__proto__=Private&lane=sources&tab=work')).toString()).toBe('lane=sources&tab=work');
  });
  it('rejects arbitrary analytical paths and unused catalog text', () => {
    expect(safeWorkspaceReturnTarget('/app/Private-organization-question')).toBeNull();
    expect(safeWorkspaceReturnTarget('/app?method=Private_Ministry&ontology=Private&model=Private&importToken=Private')).toBe('/app');
  });
});
